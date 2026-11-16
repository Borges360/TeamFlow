import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { spawn } from "node:child_process";
import { stdin as input, stdout as output } from "node:process";
import { AGENTS, PLAYBOOKS, WORKFLOWS, agentById, playbookById } from "../bundled.js";
import { UserError } from "../errors.js";
import { slugify } from "../storage.js";

function parseArgs(args) { const positionals = []; const options = {}; for (let index = 0; index < args.length; index += 1) { const token = args[index]; if (!token.startsWith("--")) { positionals.push(token); continue; } const [key, inline] = token.slice(2).split(/=(.*)/su, 2); if (inline !== undefined) options[key] = inline; else if (args[index + 1] !== undefined && !args[index + 1].startsWith("--")) { options[key] = args[index + 1]; index += 1; } else options[key] = true; } return { positionals, options }; }
const required = (values, index, usage) => { if (!values[index]) throw new UserError(`Uso: ${usage}`, { exitCode: 2 }); return values[index]; };
const teamOption = (options) => options.team ?? null;
async function ask(question) { const terminal = readline.createInterface({ input, output }); try { return await terminal.question(question); } finally { terminal.close(); } }
async function readJson(file) { try { return JSON.parse(await fs.readFile(path.resolve(file), "utf8")); } catch (error) { throw new UserError(`Não foi possível ler configuração JSON: ${file}\n\n${error.message}`, { cause: error }); } }

export async function setupCommand({ args, io, store }) {
  const { options } = parseArgs(args); if (options["dry-run"]) { io.log(`Dry-run: a base seria preparada em ${store.home}.`); return store.initialize({ dryRun: true }); }
  let config;
  if (options["non-interactive"]) { if (!options.config) throw new UserError("Use --config <arquivo> com --non-interactive.", { exitCode: 2 }); config = await readJson(options.config); }
  else { const name = (await ask("Nome do time: ")).trim(); const projectName = (await ask("Nome do primeiro projeto (vazio para pular): ")).trim(); config = { team: { id: slugify(name), name }, project: projectName ? { id: slugify(projectName), name: projectName, description: (await ask("Descrição curta do projeto: ")).trim() } : null }; }
  if (!config.team?.id || !config.team?.name) throw new UserError("A configuração exige team.id e team.name.");
  await store.initialize(); let team;
  try { team = { root: store.team(config.team.id), config: await store.teamConfig(config.team.id), existing: true }; } catch { team = await store.createTeam(config.team.id, { name: config.team.name, gitFlow: config.git?.flow, commitMode: config.git?.commit_mode, agentPreset: config.agents?.preset, agentIds: config.agents?.installed }); }
  await store.useTeam(config.team.id); let project = null;
  if (config.project) { try { project = { workspace: await store.projectPath(config.team.id, config.project.id), existing: true }; } catch { project = await store.createProject(config.team.id, config.project.id, config.project); } }
  io.log(`Time ${team.existing ? "reutilizado" : "criado"}: ${config.team.id}\nLocalização: ${team.root}`); if (project) io.log(`Projeto ${project.existing ? "reutilizado" : "criado"}: ${config.project.id}\nWorkspace: ${project.workspace ?? project.root}`); return { team, project };
}

export async function teamCommand({ args, io, store }) {
  const { positionals, options } = parseArgs(args); const action = required(positionals, 0, "teamflow team <create|list|show|use>");
  if (action === "create") { const id = required(positionals, 1, "teamflow team create <id>"); const result = await store.createTeam(id, { name: options.name ?? id, gitFlow: options["git-flow"], commitMode: options["commit-mode"], agentPreset: options.agents, agentIds: options["agent-ids"]?.split(",") }); io.log(`Time criado: ${id}\n${result.root}`); return result; }
  if (action === "list") { const result = await store.listTeams(); result.forEach((id) => io.log(id)); return result; }
  const id = required(positionals, 1, `teamflow team ${action} <id>`);
  if (action === "show") { const result = await store.teamConfig(id); io.log(JSON.stringify(result, null, 2)); return result; }
  if (action === "use") { await store.useTeam(id); io.log(`Time selecionado: ${id}`); return id; }
  throw new UserError(`Ação de time desconhecida: ${action}`);
}

export async function projectCommand({ args, io, store }) {
  const { positionals, options } = parseArgs(args); const action = required(positionals, 0, "teamflow project <create|list|path|status|archive|upgrade-base|rollback-base>"); const teamId = teamOption(options);
  if (action === "list") { const result = await store.listProjects(teamId); result.projects.forEach((project) => io.log(`${project.id}\t${project.status}\t${project.workspace}`)); return result; }
  const id = required(positionals, 1, `teamflow project ${action} <project-id>`);
  if (action === "create") { const result = await store.createProject(teamId, id, { name: options.name ?? id, description: options.description ?? "", author: options.author }); io.log(`Projeto criado: ${result.teamId}/${id}\nWorkspace: ${result.workspace}`); return result; }
  if (action === "path") { const result = await store.projectPath(teamId, id); io.log(result); return result; }
  if (action === "status") { const config = await store.projectConfig(teamId, id); const repositories = await store.repositoryStatus(teamId, id); const demands = await store.listDemands(teamId, id); const result = { project: config.project, base: config.base_snapshot, workspace: store.workspace(teamId ?? await store.activeTeam(), id), repositories, demands }; io.log(JSON.stringify(result, null, 2)); return result; }
  if (action === "archive") { const result = await store.archiveProject(teamId, id); io.log(`Projeto arquivado: ${id}`); return result; }
  if (action === "upgrade-base") { const result = await store.upgradeBase(teamId, id, { reason: options.reason, to: options.to ?? null }); io.log(JSON.stringify(result, null, 2)); return result; }
  if (action === "rollback-base") { const result = await store.rollbackBase(teamId, id, { reason: options.reason, to: options.to }); io.log(JSON.stringify(result, null, 2)); return result; }
  throw new UserError(`Ação de projeto desconhecida: ${action}`);
}

export async function repositoryCommand({ args, io, store }) {
  const { positionals, options } = parseArgs(args); const action = required(positionals, 0, "teamflow repository <add|attach|status|sync|detach>"); const project = options.project; if (!project) throw new UserError("Use --project <project-id>.", { exitCode: 2 }); const team = teamOption(options);
  if (action === "add" || action === "attach") { const id = required(positionals, 1, `teamflow repository ${action} <repository-id> --project <project>`); const result = await store.addRepository(team, project, { id, remote: options.remote, defaultBranch: options["default-branch"] ?? null, attachPath: action === "attach" ? options.path : null }); io.log(JSON.stringify(result, null, 2)); return result; }
  if (action === "status") { const result = await store.repositoryStatus(team, project, positionals[1] ?? null); io.log(JSON.stringify(result, null, 2)); return result; }
  if (action === "sync") { const result = await store.syncRepository(team, project, positionals[1] ?? null); io.log(JSON.stringify(result, null, 2)); return result; }
  if (action === "detach") { const result = await store.detachRepository(team, project, required(positionals, 1, "teamflow repository detach <repository-id> --project <project>")); io.log(JSON.stringify(result, null, 2)); return result; }
  throw new UserError(`Ação de repositório desconhecida: ${action}`);
}

function splitRuntime(args) { const separator = args.indexOf("--"); if (separator < 0) throw new UserError("Use -- antes do runtime, por exemplo: demand exec DEM-1 -- codex.", { exitCode: 2 }); return { command: args.slice(0, separator), runtime: args.slice(separator + 1) }; }
function runRuntime(command, args, options) { return new Promise((resolve, reject) => { const child = spawn(command, args, { cwd: options.cwd, env: options.env, shell: false, stdio: "inherit", windowsHide: true }); child.once("error", reject); child.once("close", (code, signal) => code === 0 ? resolve({ code, signal }) : reject(new UserError(`Runtime terminou com código ${code ?? "desconhecido"}.`))); }); }
export async function demandCommand({ args, io, store }) {
  const action = args[0]; if (!action) throw new UserError("Uso: teamflow demand <create|list|exec> ...", { exitCode: 2 });
  if (action === "exec") { const { command, runtime } = splitRuntime(args); const { positionals, options } = parseArgs(command); const id = required(positionals, 1, "teamflow demand exec <demand-id> --project <project> -- <runtime>"); if (!options.project || !runtime.length) throw new UserError("Exec exige --project e um runtime após --."); const prepared = await store.prepareDemand(teamOption(options), options.project, id); const environment = { ...process.env, TEAMFLOW_HOME: store.home, TEAMFLOW_TEAM_ID: prepared.teamId, TEAMFLOW_PROJECT_ID: prepared.projectId, TEAMFLOW_DEMAND_ID: id, TEAMFLOW_BASE: prepared.base.root, TEAMFLOW_DELIVERIES: prepared.deliveries, TEAMFLOW_WORKTREES: prepared.root }; await runRuntime(runtime[0], runtime.slice(1), { cwd: prepared.root, env: environment }); io.log(`Runtime concluído: ${id}`); return prepared; }
  const { positionals, options } = parseArgs(args); if (!options.project) throw new UserError("Use --project <project-id>.");
  if (action === "create") { let text = options.text; if (options.file) { if (text !== undefined) throw new UserError("Use apenas --text ou --file."); text = await fs.readFile(path.resolve(options.file), "utf8"); } const result = await store.createDemand(teamOption(options), options.project, { id: required(positionals, 1, "teamflow demand create <demand-id> --project <project> --title <title> --text <texto>"), title: options.title, text }); io.log(JSON.stringify(result, null, 2)); return result; }
  if (action === "list") { const result = await store.listDemands(teamOption(options), options.project); result.forEach((demand) => io.log(`${demand.demand_id}\t${demand.status}\t${demand.title}`)); return result; }
  throw new UserError(`Ação de demanda desconhecida: ${action}`);
}

export async function catalogCommand({ args, io, store }) {
  const { positionals, options } = parseArgs(args); const action = required(positionals, 0, "teamflow catalog <add-repository|add-system|add-journey|import>"); const team = await store.resolveTeam(teamOption(options));
  if (action === "import") { const data = await readJson(options.file ?? required(positionals, 1, "teamflow catalog import <arquivo>")); for (const kind of ["repositories", "systems", "journeys"]) await store.writeJson(store.team(team, "catalog", `${kind}.json`), { [kind]: data[kind] ?? [] }); io.log("Catálogo importado."); return data; }
  const kind = { "add-repository": "repositories", "add-system": "systems", "add-journey": "journeys" }[action]; if (!kind) throw new UserError(`Ação de catálogo desconhecida: ${action}`); const entry = { id: options.id ?? required(positionals, 1, "Informe ID"), name: options.name ?? required(positionals, 2, "Informe nome") }; const file = store.team(team, "catalog", `${kind}.json`); const current = await store.readJson(file, { optional: true }) ?? { [kind]: [] }; if (current[kind].some((item) => item.id === entry.id)) throw new UserError(`Entrada de catálogo já existe: ${entry.id}`); current[kind].push(entry); await store.writeJson(file, current); io.log(`Entrada adicionada: ${entry.id}`); return entry;
}
export async function doctorCommand({ io, store }) { const init = await store.initialize(); const result = { status: "ok", home: store.home, base: init.base, teams: (await store.listTeams()).length, active_project: null }; io.log(JSON.stringify(result, null, 2)); return result; }
export async function playbookCommand({ args, io }) { const { positionals } = parseArgs(args); if (positionals[0] === "list") { PLAYBOOKS.forEach((item) => io.log(`${item.id}\t${item.workflow}`)); return PLAYBOOKS; } const item = playbookById(required(positionals, 1, "teamflow playbook show <id>")); if (!item) throw new UserError("Playbook desconhecido."); io.log(JSON.stringify(item, null, 2)); return item; }
export async function workflowCommand({ args, io }) { const { positionals } = parseArgs(args); const value = WORKFLOWS[required(positionals, 1, "teamflow workflow show <id>")]; if (positionals[0] !== "show" || !value) throw new UserError("Workflow desconhecido."); io.log(value); return value; }
