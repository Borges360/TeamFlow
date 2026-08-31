import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { AGENTS, PLAYBOOKS, WORKFLOWS, agentById, playbookById } from "../bundled.js";
import { UserError } from "../errors.js";
import { gitConfiguration, slugify } from "../storage.js";

function parseArgs(args) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) { positionals.push(token); continue; }
    const [rawKey, inline] = token.slice(2).split(/=(.*)/su, 2);
    if (inline !== undefined) { options[rawKey] = inline; continue; }
    const next = args[index + 1];
    if (next !== undefined && !next.startsWith("--")) { options[rawKey] = next; index += 1; }
    else options[rawKey] = true;
  }
  return { positionals, options };
}

function requirePositional(positionals, index, usage) {
  if (!positionals[index]) throw new UserError(`Uso: ${usage}`, { exitCode: 2 });
  return positionals[index];
}

async function readConfig(file) {
  let text;
  try { text = await fs.readFile(path.resolve(file), "utf8"); }
  catch (error) { throw new UserError(`Não foi possível ler a configuração: ${file}\n\n${error.message}`, { cause: error }); }
  try { return JSON.parse(text); }
  catch (error) { throw new UserError(`A configuração deve ser JSON válido (JSON também é YAML válido): ${file}\n\n${error.message}`, { cause: error }); }
}

async function exportFiles(root, directories) {
  const files = {};
  const sensitiveName = /(^|[._-])(secret|token|credential|password|private-key|private_key)([._-]|$)|^\.env(?:\.|$)/iu;
  async function walk(directory, relative = "") {
    let entries;
    try { entries = await fs.readdir(directory, { withFileTypes: true }); }
    catch (error) { if (error.code === "ENOENT") return; throw error; }
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) { files[childRelative] = { omitted: "symbolic-link" }; continue; }
      if (entry.isDirectory()) await walk(path.join(directory, entry.name), childRelative);
      else if (entry.isFile()) files[childRelative] = sensitiveName.test(entry.name) ? { omitted: "sensitive-filename" } : await fs.readFile(path.join(directory, entry.name), "utf8");
    }
  }
  for (const directory of directories) await walk(path.join(root, directory), directory);
  return files;
}

function parseChoice(value, choices, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  return choices[normalized] ?? normalized;
}

async function defaultAsk(question) {
  const terminal = readline.createInterface({ input, output });
  try { return await terminal.question(question); }
  finally { terminal.close(); }
}

async function interactiveSetup(ask = defaultAsk, draft = {}, onProgress = async () => {}) {
  const setup = structuredClone(draft);
  if (!setup.team) {
    const name = (await ask("\n1/4 Nome do time: ")).trim();
    if (!name) throw new UserError("O nome do time é obrigatório.");
    const suggestedId = slugify(name);
    const id = (await ask(`ID técnico [${suggestedId}]: `)).trim() || suggestedId;
    setup.team = { id, name };
    await onProgress(setup);
  }
  if (!setup.git) {
    const flow = parseChoice(await ask("\n2/4 Fluxo Git (1 GitFlow, 2 trunk, 3 customizado, 4 depois) [1]: "), { 1: "gitflow", 2: "trunk", 3: "custom", 4: "later" }, "gitflow");
    const customBase = flow === "custom" ? (await ask("Branch base customizada: ")).trim() : null;
    const customFeature = flow === "custom" ? (await ask("Padrão de feature [feature/{demand_id}-{slug}]: ")).trim() || "feature/{demand_id}-{slug}" : null;
    const commitMode = parseChoice(await ask("Commits locais (1 não criar, 2 final por repositório, 3 depois) [1]: "), { 1: "disabled", 2: "final-per-repository", 3: "manual" }, "disabled");
    setup.git = { flow, commit_mode: commitMode, base: customBase, feature: customFeature };
    await onProgress(setup);
  }
  if (!setup.agents) {
    const preset = parseChoice(await ask("\n3/4 Agents (1 Essencial, 2 Completo, 3 Personalizado) [1]: "), { 1: "essential", 2: "complete", 3: "custom" }, "essential");
    let agentIds;
    if (preset === "custom") {
    const descriptions = AGENTS.map(({ id: agentId, name: agentName, description, triggers }) => `  [ ] ${agentId} — ${agentName}: ${description} Gatilhos: ${triggers.join(", ")}.`).join("\n");
    const selected = await ask(`${descriptions}\nIDs separados por vírgula: `);
    agentIds = selected.split(",").map((item) => item.trim()).filter(Boolean);
    }
    setup.agents = { preset, installed: agentIds };
    await onProgress(setup);
  }
  if (!Object.hasOwn(setup, "project")) {
    const createFirst = /^s|^y|^1/iu.test(await ask("\n4/4 Deseja criar o primeiro projeto agora? [s/N]: "));
    setup.project = null;
    if (createFirst) {
    const projectName = (await ask("Nome do projeto: ")).trim();
    const suggestedProjectId = slugify(projectName);
    const projectId = (await ask(`ID técnico [${suggestedProjectId}]: `)).trim() || suggestedProjectId;
    const description = (await ask("Descrição curta da demanda: ")).trim();
      setup.project = { id: projectId, name: projectName, description };
    }
    await onProgress(setup);
  }
  return setup;
}

function normalizeSetupConfig(config) {
  const team = config.team ?? {};
  const id = team.id ?? slugify(team.name);
  if (!id || !team.name) throw new UserError("A configuração exige team.name e team.id (ou nome que gere um ID).");
  const preset = config.agents?.preset ?? "essential";
  const agentIds = config.agents?.installed?.map?.((item) => typeof item === "string" ? item : item.id);
  return { team: { id, name: team.name }, git: { flow: config.git?.flow ?? "later", commit_mode: config.git?.commit_mode ?? "disabled", base: config.git?.base, feature: config.git?.feature }, agents: { preset, installed: agentIds }, project: config.project ?? null };
}

export async function setupCommand({ args, io, store, ask }) {
  const { options } = parseArgs(args);
  let draft = null;
  if (options.resume) {
    await store.initialize({ dryRun: Boolean(options["dry-run"]) });
    draft = await store.readJson(store.metadata("setup-draft.json"), { optional: true });
    try {
      const teamId = await store.activeTeam();
      if (!draft) io.log(`Setup já iniciado. Time ativo: ${teamId}\nLocalização: ${store.team(teamId)}`);
      else io.log(`Retomando setup pendente para o time ${draft.team?.id ?? teamId}.`);
      if (!draft) return { status: "resumed", teamId };
    } catch (error) { if (!(error instanceof UserError)) throw error; }
  }
  const setup = options["non-interactive"]
    ? normalizeSetupConfig(await readConfig(options.config || (() => { throw new UserError("Use --config <arquivo> com --non-interactive.", { exitCode: 2 }); })()))
    : await interactiveSetup(ask, draft ?? {}, async (nextDraft) => store.writeJson(store.metadata("setup-draft.json"), nextDraft));
  if (options["dry-run"]) {
    io.log(`Dry-run: o time ${setup.team.id} seria criado em ${store.team(setup.team.id)}.`);
    if (setup.project) io.log(`Dry-run: o projeto ${setup.project.id} seria criado dentro do time.`);
    return { status: "dry-run", setup };
  }
  await store.initialize();
  const existingTeamConfig = await store.readJson(store.team(setup.team.id, "team-config.yaml"), { optional: true });
  if (existingTeamConfig && existingTeamConfig.team.name !== setup.team.name) {
    throw new UserError(`O ID ${setup.team.id} já pertence ao time "${existingTeamConfig.team.name}"; escolha outro ID.`);
  }
  const team = existingTeamConfig
    ? { root: store.team(setup.team.id), config: existingTeamConfig, existing: true }
    : await store.createTeam(setup.team.id, { name: setup.team.name, gitFlow: setup.git.flow, commitMode: setup.git.commit_mode, customBase: setup.git.base, customFeature: setup.git.feature, agentPreset: setup.agents.preset, agentIds: setup.agents.installed });
  await store.useTeam(setup.team.id);
  const existingProjectConfig = setup.project ? await store.readJson(store.project(setup.team.id, setup.project.id, "project-config.yaml"), { optional: true }) : null;
  const project = setup.project
    ? existingProjectConfig
      ? { teamId: setup.team.id, root: store.project(setup.team.id, setup.project.id), config: existingProjectConfig, existing: true }
      : await store.createProject(setup.project.id, setup.project)
    : null;
  const installed = team.config.agents.preset === "custom" ? team.config.agents.installed.map(({ id }) => id).join(", ") : team.config.agents.preset;
  io.log(`Time ${team.existing ? "reutilizado" : "criado"}: ${setup.team.id}\nLocalização: ${team.root}\nFluxo Git: ${team.config.git.flow.model}\nPolítica de commit: ${team.config.git.delivery.local_commit_mode}\nAgents instalados: ${installed}\nEstado: bootstrap`);
  if (project) io.log(`\nProjeto ${project.existing ? "reutilizado" : "criado"}: ${setup.project.id}\nLocalização: ${project.root}\n\nPróximo passo:\nteamflow project activate ${setup.project.id}`);
  else io.log("\nPróximos passos: teamflow team configure e teamflow project create <project-id>");
  await fs.unlink(store.metadata("setup-draft.json")).catch((error) => { if (error.code !== "ENOENT") throw error; });
  return { status: "created", team, project };
}

export async function teamCommand({ args, io, store, ask = defaultAsk }) {
  const { positionals, options } = parseArgs(args);
  const action = requirePositional(positionals, 0, "teamflow team <create|list|show|use|configure|agents>");
  if (action === "create") {
    const id = requirePositional(positionals, 1, "teamflow team create <team-id> [--name <nome>]");
    const result = await store.createTeam(id, { name: options.name ?? id, gitFlow: options["git-flow"] ?? "later", commitMode: options["commit-mode"] ?? "disabled", customBase: options.base, customFeature: options["feature-pattern"], agentPreset: options.agents ?? "essential" });
    io.log(`Time criado: ${id}\nLocalização: ${result.root}`);
    return result;
  }
  if (action === "list") { const teams = await store.listTeams(); for (const id of teams) io.log(id); return teams; }
  if (action === "show") { const config = await store.teamConfig(requirePositional(positionals, 1, "teamflow team show <team-id>")); io.log(JSON.stringify(config, null, 2)); return config; }
  if (action === "use") { const id = requirePositional(positionals, 1, "teamflow team use <team-id>"); await store.useTeam(id); io.log(`Time ativo: ${id}`); return id; }
  if (action === "configure") {
    const teamId = await store.activeTeam();
    const config = await store.teamConfig(teamId);
    if (Object.keys(options).length === 0) {
      const name = (await ask(`Nome do time [${config.team.name}]: `)).trim();
      if (name) options.name = name;
      options["git-flow"] = parseChoice(await ask("Fluxo Git (1 GitFlow, 2 trunk, 3 customizado, 4 depois) [manter]: "), { 1: "gitflow", 2: "trunk", 3: "custom", 4: "later" }, config.git.flow.model);
      options["commit-mode"] = parseChoice(await ask("Commits (1 desabilitado, 2 final por repositório, 3 manual) [manter]: "), { 1: "disabled", 2: "final-per-repository", 3: "manual" }, config.git.delivery.local_commit_mode);
      if (options["git-flow"] === "custom") {
        options.base = (await ask(`Branch base [${config.git.flow.base ?? "pendente"}]: `)).trim() || config.git.flow.base;
        options["feature-pattern"] = (await ask(`Padrão de feature [${config.git.flow.feature ?? "feature/{demand_id}-{slug}"}]: `)).trim() || config.git.flow.feature || "feature/{demand_id}-{slug}";
      }
    }
    if (options.name) config.team.name = options.name;
    if (options["git-flow"] || options["commit-mode"]) config.git = gitConfiguration(options["git-flow"] ?? config.git.flow.model, options["commit-mode"] ?? config.git.delivery.local_commit_mode, { base: options.base, feature: options["feature-pattern"] }, config.git);
    config.team.updated_at = new Date().toISOString();
    await store.writeJson(store.team(teamId, "team-config.yaml"), config);
    io.log(`Time atualizado: ${teamId}`);
    return config;
  }
  if (action === "agents") {
    const forwarded = positionals.slice(1).concat(Object.entries(options).flatMap(([key, value]) => value === true ? [`--${key}`] : [`--${key}`, value]));
    return agentsCommand({ args: forwarded, io, store });
  }
  throw new UserError(`Ação de time desconhecida: ${action}`, { exitCode: 2 });
}

export async function agentsCommand({ args, io, store }) {
  const { positionals, options } = parseArgs(args);
  const action = requirePositional(positionals, 0, "teamflow team agents <list|install|remove|show>");
  const teamId = await store.activeTeam();
  const config = await store.teamConfig(teamId);
  if (action === "list") { for (const installed of config.agents.installed) io.log(`${installed.id}\t${agentById(installed.id)?.name ?? installed.id}`); return config.agents.installed; }
  const agentId = requirePositional(positionals, 1, `teamflow team agents ${action} <agent-id>`);
  if (action === "show") { const installed = config.agents.installed.find(({ id }) => id === agentId); if (!installed) throw new UserError(`Agent não está instalado no time ${teamId}: ${agentId}`); const agent = { ...agentById(agentId), ...installed }; io.log(JSON.stringify(agent, null, 2)); return agent; }
  if (action === "install") { const result = await store.installAgent(agentId); io.log(`Agent instalado no time ${teamId}: ${agentId}`); return result; }
  if (action === "remove") { const result = await store.removeAgent(agentId, { confirmed: Boolean(options.confirm) }); io.log(`Agent removido da configuração atual do time ${teamId}: ${agentId}\nSnapshots existentes preservados.`); return result; }
  throw new UserError(`Ação de agents desconhecida: ${action}`, { exitCode: 2 });
}

function readyForPush(config) {
  const repositories = config.repositories ?? [];
  const gates = config.gates ?? [];
  const hasEvidence = (value) => typeof value === "string" ? value.trim().length > 0 : Array.isArray(value) && value.length > 0;
  const checks = repositories.length > 0 && repositories.every((repository) => (
    typeof repository.id === "string" && repository.id.length > 0
    && typeof repository.branch === "string" && repository.branch.length > 0
    && typeof repository.base_revision === "string" && repository.base_revision.length > 0
    && typeof repository.commit_hash === "string" && repository.commit_hash.length > 0
    && repository.valid_branch === true
    && repository.related_changes_committed === true
    && repository.no_related_uncommitted_changes === true
    && hasEvidence(repository.local_checks_evidence)
    && repository.secret_scan === "pass"
    && ["pending", "pass"].includes(repository.remote_checks_status)
  ));
  const gateResolved = (gate) => {
    if (!hasEvidence(gate.evidence)) return false;
    if (gate.decision === "PASS") return true;
    if (gate.decision === "NOT_APPLICABLE") return !["principal-review", "delivery"].includes(gate.id);
    if (gate.decision !== "WAIVED" || gate.waiver?.authorized !== true) return false;
    return !gate.waiver.expires_at || Date.parse(gate.waiver.expires_at) > Date.now();
  };
  const resolvedGateIds = new Set(gates.filter(gateResolved).map(({ id }) => id));
  const gateResolution = gates.length > 0 && gates.every(gateResolved) && resolvedGateIds.has("principal-review") && resolvedGateIds.has("delivery");
  const artifactsCurrent = config.readiness?.documentation_current === true && config.readiness?.evidence_current === true;
  return { state: checks && gateResolution && artifactsCurrent ? "ready_for_push" : "bootstrap", criteria: { repositories_configured: repositories.length > 0, repository_checks_passed: checks, gates_resolved: gateResolution, documentation_and_evidence_current: artifactsCurrent, remote_checks: "pendentes e declarados por repositório" }, boundary: "Push, PR, merge, tag, release e deploy dependem do usuário ou da pipeline." };
}

export async function projectCommand({ args, io, store }) {
  const { positionals, options } = parseArgs(args);
  const action = requirePositional(positionals, 0, "teamflow project <create|list|activate|status|archive|compare|update-snapshot>");
  if (action === "create") { const id = requirePositional(positionals, 1, "teamflow project create <project-id>"); const result = await store.createProject(id, { name: options.name ?? id, description: options.description ?? "", author: options.author }); io.log(`Projeto criado no time ${result.teamId}: ${id}\nLocalização: ${result.root}`); return result; }
  if (action === "list") { const result = await store.listProjects(); for (const project of result.projects) io.log(`${project.id}\t${project.status}`); return result; }
  const id = requirePositional(positionals, 1, `teamflow project ${action} <project-id>`);
  if (action === "activate") { const result = await store.activateProject(id); io.log(`Projeto ativo: ${result.teamId}/${id}\nLocalização: ${result.root}`); return result; }
  if (action === "status") { const teamId = await store.activeTeam(); const config = await store.projectConfig(teamId, id); const active = await store.readJson(store.metadata("active-project.json"), { optional: true }); const result = { team_id: teamId, project: config.project, active: active?.team_id === teamId && active.project_id === id, snapshot: await store.compareProject(id), delivery: readyForPush(config) }; io.log(JSON.stringify(result, null, 2)); return result; }
  if (action === "archive") { const result = await store.archiveProject(id); io.log(`Projeto arquivado dentro do time ${result.teamId}: ${id}`); return result; }
  if (action === "compare") { const result = await store.compareProject(id); io.log(JSON.stringify(result, null, 2)); return result; }
  if (action === "update-snapshot") { const result = await store.updateProjectSnapshot(id, { reason: options.reason, author: options.author }); io.log(`Snapshot atualizado explicitamente: ${result.teamId}/${id}\nAnterior: ${result.previous_hash}\nAtual: ${result.current_hash}`); return result; }
  throw new UserError(`Ação de projeto desconhecida: ${action}`, { exitCode: 2 });
}

export async function doctorCommand({ io, store }) {
  const initialization = await store.initialize();
  const teams = await store.listTeams();
  const findings = [];
  let projects = 0;
  for (const teamId of teams) {
    try { await store.teamConfig(teamId); }
    catch (error) { findings.push({ scope: `team:${teamId}`, message: error.message }); continue; }
    let entries = [];
    try { entries = await fs.readdir(store.team(teamId, "projects"), { withFileTypes: true }); }
    catch (error) { findings.push({ scope: `team:${teamId}/projects`, message: error.message }); continue; }
    for (const entry of entries.filter((item) => item.isDirectory())) {
      projects += 1;
      try { await store.projectConfig(teamId, entry.name); }
      catch (error) { findings.push({ scope: `project:${teamId}/${entry.name}`, message: error.message }); }
    }
  }
  let activeTeam = null;
  const active = await store.readJson(store.metadata("active-team.json"), { optional: true });
  if (active) {
    try { activeTeam = await store.activeTeam(); }
    catch (error) { findings.push({ scope: "active-team", message: error.message }); }
  }
  const result = { status: findings.length === 0 ? "ok" : "degraded", home: store.home, schema: "1.0", base: await store.baseReference(), teams: teams.length, projects, active_team: activeTeam, isolation: "teams/<team-id>/projects/<project-id>", remote_operations: false, findings, initialization };
  io.log(JSON.stringify(result, null, 2));
  return result;
}

export async function exportCommand({ args, io, store }) {
  const { positionals, options } = parseArgs(args);
  const kind = requirePositional(positionals, 0, "teamflow export <team|project> [project-id] [--output <arquivo>]");
  const teamId = await store.activeTeam();
  let payload;
  if (kind === "team") {
    const catalog = {};
    for (const name of ["repositories", "systems", "journeys"]) catalog[name] = (await store.readJson(store.team(teamId, "catalog", `${name}.json`), { optional: true }))?.[name] ?? [];
    payload = { exported_at: new Date().toISOString(), team: await store.teamConfig(teamId), catalog, files: await exportFiles(store.team(teamId), ["context", "catalog", "policies", "profiles", "templates", "history"]) };
  }
  else if (kind === "project") { const projectId = requirePositional(positionals, 1, "teamflow export project <project-id>"); const root = store.project(teamId, projectId); payload = { exported_at: new Date().toISOString(), team_id: teamId, project: await store.projectConfig(teamId, projectId), effective_context: await store.readJson(store.project(teamId, projectId, "effective-context", "team-snapshot.json")), files: await exportFiles(root, ["effective-context", "generated-runtime-files", "deliveries", "evidence", "history"]) }; }
  else throw new UserError(`Tipo de exportação desconhecido: ${kind}`);
  if (options.output) { const target = path.resolve(options.output); await store.writeJson(target, payload); io.log(`Exportação criada por solicitação explícita: ${target}`); }
  else io.log(JSON.stringify(payload, null, 2));
  return payload;
}

export async function catalogCommand({ args, io, store, ask = defaultAsk }) {
  const { positionals, options } = parseArgs(args);
  const action = requirePositional(positionals, 0, "teamflow catalog <add-repository|add-system|add-journey|import>");
  if (action === "import") {
    const file = options.file ?? positionals[1];
    if (!file) throw new UserError("Uso: teamflow catalog import <arquivo>", { exitCode: 2 });
    const config = await readConfig(file); const results = [];
    for (const kind of ["repositories", "systems", "journeys"]) for (const entry of config[kind] ?? []) results.push(await store.addCatalogEntry(kind, entry));
    io.log(`${results.length} entradas importadas no catálogo do time ativo.`); return results;
  }
  const kind = { "add-repository": "repositories", "add-system": "systems", "add-journey": "journeys" }[action];
  if (!kind) throw new UserError(`Ação de catálogo desconhecida: ${action}`);
  const id = options.id ?? positionals[1] ?? (await ask("ID técnico: ")).trim();
  options.name ??= (await ask("Nome: ")).trim();
  if (!id || !options.name) throw new UserError(`Uso: teamflow catalog ${action} --id <id> --name <nome>`, { exitCode: 2 });
  const common = { id, name: options.name, owner: options.owner ?? null, source: options.source ?? "user", verified_at: options["verified-at"] ?? null };
  const entry = kind === "journeys" ? { ...common, objective: options.objective ?? null, criticality: options.criticality ?? "unknown", actors_channels: [], systems: [], repositories: [], apis: [], events: [], data: [], dependencies: [], operational_requirements: [] } : common;
  const result = await store.addCatalogEntry(kind, entry); io.log(`Entrada adicionada a ${kind} no time ${result.teamId}: ${id}`); return result;
}

export async function playbookCommand({ args, io }) {
  const { positionals } = parseArgs(args); const action = requirePositional(positionals, 0, "teamflow playbook <list|show>");
  if (action === "list") { for (const playbook of PLAYBOOKS) io.log(`${playbook.id}\t${playbook.workflow}`); return PLAYBOOKS; }
  if (action === "show") { const id = requirePositional(positionals, 1, "teamflow playbook show <id>"); const playbook = playbookById(id); if (!playbook) throw new UserError(`Playbook desconhecido: ${id}`); io.log(JSON.stringify(playbook, null, 2)); return playbook; }
  throw new UserError(`Ação de playbook desconhecida: ${action}`);
}

export async function workflowCommand({ args, io }) {
  const { positionals } = parseArgs(args);
  if (positionals[0] !== "show" || !positionals[1]) throw new UserError("Uso: teamflow workflow show <id>", { exitCode: 2 });
  const workflow = WORKFLOWS[positionals[1]];
  if (!workflow) throw new UserError(`Workflow desconhecido: ${positionals[1]}`);
  io.log(`${positionals[1]}\n${workflow}`); return workflow;
}
