import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AGENTS, AGENT_PRESETS, SCHEMA_VERSION, agentById } from "./bundled.js";
import { PACKAGE_VERSION } from "./config.js";
import { UserError } from "./errors.js";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const TEAM_SNAPSHOT_DIRECTORIES = ["context", "catalog", "policies", "profiles", "templates"];
const SECRET_KEY_PATTERN = /(^|_)(secret|token|password|credential|authorization|private_key|api_key|access_key)(_|$)/iu;
const SAFE_POLICY_SECRET_KEYS = new Set(["secret_scan", "require_secret_scan_before_commit"]);
const SECRET_VALUE_PATTERNS = [
  /^[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^@\s]+@/iu,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{6,}/u,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/u,
  /\b(?:ghp_|github_pat_|npm_)[A-Za-z0-9_]{20,}\b/u,
  /\bAKIA[0-9A-Z]{16}\b/u,
];

function now() {
  return new Date().toISOString();
}

function normalizeObject(value) {
  if (Array.isArray(value)) return value.map(normalizeObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalizeObject(value[key])]));
}

function configDifferences(left, right, prefix = "") {
  if (JSON.stringify(normalizeObject(left)) === JSON.stringify(normalizeObject(right))) return [];
  if (!left || !right || typeof left !== "object" || typeof right !== "object" || Array.isArray(left) || Array.isArray(right)) {
    return [{ path: prefix || "$", before: left ?? null, after: right ?? null }];
  }
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
  return keys.flatMap((key) => configDifferences(left[key], right[key], prefix ? `${prefix}.${key}` : key));
}

async function collectDirectoryFiles(root, directories, fileSystem) {
  const collected = [];
  async function walk(directory, relative) {
    let entries;
    try { entries = await fileSystem.readdir(directory, { withFileTypes: true }); }
    catch (error) { if (error.code === "ENOENT") return; throw error; }
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(directory, entry.name);
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new UserError(`Links simbólicos não são permitidos no contexto efetivo: ${childRelative}`);
      if (entry.isDirectory()) await walk(absolute, childRelative);
      else if (entry.isFile()) {
        const data = await fileSystem.readFile(absolute);
        assertNoSecrets(data.toString("utf8"), childRelative);
        collected.push({ path: childRelative.replaceAll("\\", "/"), data });
      }
    }
  }
  for (const directory of directories) await walk(path.join(root, directory), directory);
  return collected.sort((left, right) => left.path.localeCompare(right.path));
}

function directoryFilesHash(files) {
  const hash = createHash("sha256");
  for (const file of files) hash.update(file.path).update("\0").update(file.data).update("\0");
  return hash.digest("hex");
}

async function writeDirectoryFiles(root, files, fileSystem) {
  for (const file of files) {
    const destination = path.join(root, ...file.path.split("/"));
    await fileSystem.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    await fileSystem.writeFile(destination, file.data, { mode: 0o600 });
  }
}

function fileDifferences(leftFiles, rightFiles) {
  const hashes = (files) => new Map(files.map((file) => [file.path, createHash("sha256").update(file.data).digest("hex")]));
  const left = hashes(leftFiles);
  const right = hashes(rightFiles);
  return [...new Set([...left.keys(), ...right.keys()])].sort().filter((file) => left.get(file) !== right.get(file)).map((file) => ({ path: file, before_hash: left.get(file) ?? null, after_hash: right.get(file) ?? null }));
}

export function snapshotHash(value) {
  return createHash("sha256").update(JSON.stringify(normalizeObject(value))).digest("hex");
}

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 64);
}

export function assertId(id, label = "ID") {
  if (!ID_PATTERN.test(id ?? "")) {
    throw new UserError(`${label} inválido: use letras minúsculas, números e hífens.`);
  }
  return id;
}

export function resolveTeamFlowHome({ override, env = process.env, platform = process.platform, homedir = os.homedir() } = {}) {
  if (override) return path.resolve(override);
  if (env.TEAMFLOW_HOME) return path.resolve(env.TEAMFLOW_HOME);
  if (platform === "win32") {
    const profile = env.USERPROFILE || homedir;
    return path.resolve(profile, ".teamFlow");
  }
  return path.resolve(homedir, ".teamFlow");
}

function assertNoSecrets(value, location = "configuração") {
  if (typeof value === "string") {
    if (SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))) throw new UserError(`Valor com aparência de credencial não é permitido em ${location}.`);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    const normalizedKey = key.replace(/([a-z0-9])([A-Z])/gu, "$1_$2").replaceAll("-", "_").toLowerCase();
    if (SECRET_KEY_PATTERN.test(normalizedKey) && !SAFE_POLICY_SECRET_KEYS.has(normalizedKey)) {
      throw new UserError(`Campo potencialmente secreto não é permitido em ${location}: ${key}`);
    }
    assertNoSecrets(nested, location);
  }
}

function assertRemoteOperationsDenied(git, location) {
  const delivery = git?.delivery;
  const denied = ["push_allowed", "pull_request_allowed", "merge_allowed", "deploy_allowed", "release_allowed"];
  if (!delivery || denied.some((field) => delivery[field] !== false)) {
    throw new UserError(`Política Git inválida em ${location}: operações remotas, merge, release e deploy devem permanecer desabilitados.`);
  }
}

function assertProjectInheritance(projectConfig, snapshot, location) {
  const expectedAgents = JSON.stringify(normalizeObject(snapshot.team_config.agents?.installed ?? []));
  const actualAgents = JSON.stringify(normalizeObject(projectConfig.agents_snapshot ?? []));
  if (expectedAgents !== actualAgents) throw new UserError(`Agents snapshot divergente em ${location}; use a atualização explícita de snapshot.`);
  const projectGit = projectConfig.git;
  const teamGit = snapshot.team_config.git;
  if (JSON.stringify(normalizeObject(projectGit?.flow)) !== JSON.stringify(normalizeObject(teamGit?.flow))) {
    throw new UserError(`Fluxo Git do projeto diverge do snapshot em ${location} sem exceção autorizada.`);
  }
  const projectDelivery = projectGit?.delivery ?? {};
  const teamDelivery = teamGit?.delivery ?? {};
  const requiredTrue = ["require_clean_worktree_before_start", "require_requirements_traceability", "require_applicable_local_checks_before_final_commit", "require_secret_scan_before_commit", "require_demand_id"];
  if (requiredTrue.some((field) => teamDelivery[field] === true && projectDelivery[field] !== true)) {
    throw new UserError(`Política Git do projeto enfraquece um controle obrigatório em ${location}.`);
  }
  if (teamDelivery.allow_commit_with_unavailable_remote_checks === false && projectDelivery.allow_commit_with_unavailable_remote_checks !== false) {
    throw new UserError(`Política Git do projeto enfraquece checks remotos em ${location}.`);
  }
  if (teamDelivery.commit_message_template !== projectDelivery.commit_message_template) {
    throw new UserError(`Template de commit do projeto diverge do snapshot em ${location}.`);
  }
  const signingRank = { disabled: 0, "repository-default": 1, required: 2 };
  if ((signingRank[projectDelivery.signing] ?? -1) < (signingRank[teamDelivery.signing] ?? -1)) {
    throw new UserError(`Política de assinatura do projeto é menos restritiva em ${location}.`);
  }
  const commitModeRank = { incremental: 0, "final-per-repository": 1, manual: 2, disabled: 3 };
  if ((commitModeRank[projectDelivery.local_commit_mode] ?? -1) < (commitModeRank[teamDelivery.local_commit_mode] ?? -1)) {
    throw new UserError(`Modo de commit do projeto é menos restritivo em ${location}.`);
  }
}

async function exists(file, fileSystem = fs) {
  try {
    await fileSystem.access(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export class TeamFlowStore {
  constructor(home, { fileSystem = fs } = {}) {
    this.home = path.resolve(home);
    this.fs = fileSystem;
  }

  metadata(...parts) { return path.join(this.home, "metadata", ...parts); }
  baseRoot() { return this.metadata("bases", PACKAGE_VERSION); }
  teams(...parts) { return path.join(this.home, "teams", ...parts); }
  team(teamId, ...parts) { return this.teams(assertId(teamId, "ID do time"), ...parts); }
  project(teamId, projectId, ...parts) { return this.team(teamId, "projects", assertId(projectId, "ID do projeto"), ...parts); }

  async writeJson(file, value) {
    assertNoSecrets(value, file);
    await this.fs.mkdir(path.dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
    await this.fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await this.fs.rename(temporary, file);
  }

  async readJson(file, { optional = false } = {}) {
    try {
      return JSON.parse(await this.fs.readFile(file, "utf8"));
    } catch (error) {
      if (optional && error.code === "ENOENT") return null;
      if (error instanceof SyntaxError) throw new UserError(`Arquivo inválido: ${file}\n\n${error.message}`, { cause: error });
      if (error.code === "ENOENT") throw new UserError(`Arquivo obrigatório não encontrado: ${file}`);
      throw error;
    }
  }

  async initialize({ dryRun = false } = {}) {
    if (dryRun) return { home: this.home, changed: !(await exists(this.metadata("schema-version.json"), this.fs)), base: this.baseRoot() };
    await this.fs.mkdir(this.metadata(), { recursive: true, mode: 0o700 });
    await this.fs.mkdir(this.teams(), { recursive: true, mode: 0o700 });
    await this.fs.mkdir(path.join(this.home, "backups"), { recursive: true, mode: 0o700 });
    await this.ensureBundledBase();
    const schemaFile = this.metadata("schema-version.json");
    const current = await this.readJson(schemaFile, { optional: true });
    if (!current) {
      await this.writeJson(schemaFile, { schema_version: SCHEMA_VERSION, created_at: now() });
      return { home: this.home, changed: true, migrated: false };
    }
    if (current.schema_version !== SCHEMA_VERSION) return this.migrate(current.schema_version);
    return { home: this.home, changed: false, migrated: false };
  }

  async ensureBundledBase() {
    const base = this.baseRoot();
    const manifest = path.join(base, "base-manifest.json");
    if (await exists(manifest, this.fs)) return { root: base, version: PACKAGE_VERSION, reused: true };
    const sourceItems = [".squad", "AGENTS.md", "squad.yaml", "docs/local-teams-cli.md"];
    await this.fs.mkdir(base, { recursive: true, mode: 0o700 });
    for (const item of sourceItems) {
      const source = path.join(PACKAGE_ROOT, item);
      if (!(await exists(source, this.fs))) throw new UserError(`Base instalada incompleta: ${item} não foi encontrado no pacote teamFlow.`);
      const destination = path.join(base, item);
      await this.fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
      await this.fs.cp(source, destination, { recursive: true, force: false, errorOnExist: false, dereference: false });
    }
    await this.writeJson(manifest, { package: "teamflow", version: PACKAGE_VERSION, installed_at: now(), source: "bundled-package", files: sourceItems });
    return { root: base, version: PACKAGE_VERSION, reused: false };
  }

  async baseReference() {
    await this.ensureBundledBase();
    return { version: PACKAGE_VERSION, root: this.baseRoot(), manifest: path.join(this.baseRoot(), "base-manifest.json") };
  }

  async migrate(fromVersion) {
    if (fromVersion !== "0.9") {
      throw new UserError(`Schema ${fromVersion} não é suportado. Versão esperada: ${SCHEMA_VERSION}.`);
    }
    const backup = path.join(this.home, "backups", `schema-${fromVersion}-to-${SCHEMA_VERSION}-${Date.now()}`);
    await this.fs.mkdir(backup, { recursive: true, mode: 0o700 });
    if (await exists(this.metadata(), this.fs)) await this.fs.cp(this.metadata(), path.join(backup, "metadata"), { recursive: true });
    if (await exists(this.teams(), this.fs)) await this.fs.cp(this.teams(), path.join(backup, "teams"), { recursive: true });
    const timestamp = now();
    const base = await this.baseReference();
    const teamEntries = await this.fs.readdir(this.teams(), { withFileTypes: true });
    for (const teamEntry of teamEntries.filter((entry) => entry.isDirectory())) {
      const teamId = assertId(teamEntry.name, "ID do time legado");
      const file = this.team(teamId, "team-config.yaml");
      const legacy = await this.readJson(file);
      const installedIds = (legacy.agents?.installed ?? AGENT_PRESETS.essential)
        .map((item) => typeof item === "string" ? item : item.id)
        .filter((id) => agentById(id));
      const flow = legacy.git?.flow?.model ?? legacy.git?.flow ?? "later";
      const commitMode = legacy.git?.delivery?.local_commit_mode ?? legacy.git_delivery?.local_commit_mode ?? "disabled";
      const migrated = {
        ...legacy,
        schema_version: SCHEMA_VERSION,
        team: { id: teamId, name: legacy.team?.name ?? teamId, status: legacy.team?.status ?? "bootstrap", created_at: legacy.team?.created_at ?? timestamp, updated_at: timestamp },
        locale: legacy.locale ?? "pt-BR",
        base,
        git: gitConfiguration(flow, commitMode, { base: legacy.git?.flow?.base, feature: legacy.git?.flow?.feature }, legacy.git),
        agents: {
          preset: legacy.agents?.preset ?? "custom",
          installed: installedIds.map((id) => ({ id, version: "1.0", source: "bundled" })),
          unavailable: AGENTS.filter(({ id }) => !installedIds.includes(id)).map(({ id }) => ({ id })),
        },
        pending: legacy.pending ?? ["domínio", "classificação de dados", "criticidade", "catálogo", "observabilidade"],
        migration: { from: fromVersion, migrated_at: timestamp, backup },
      };
      await this.writeJson(file, migrated);
      await this.writeAgentProfiles(teamId, installedIds);
      const projectsRoot = this.team(teamId, "projects");
      if (!(await exists(projectsRoot, this.fs))) continue;
      const projectEntries = await this.fs.readdir(projectsRoot, { withFileTypes: true });
      for (const projectEntry of projectEntries.filter((entry) => entry.isDirectory())) {
        const projectId = assertId(projectEntry.name, "ID do projeto legado");
        const projectFile = this.project(teamId, projectId, "project-config.yaml");
        const legacyProject = await this.readJson(projectFile);
        const snapshotFile = this.project(teamId, projectId, "effective-context", "team-snapshot.json");
        const legacySnapshot = await this.readJson(snapshotFile, { optional: true });
        const legacySnapshotConfig = legacySnapshot?.team_config;
        const snapshotInstalledIds = (legacySnapshotConfig?.agents?.installed ?? migrated.agents.installed)
          .map((item) => typeof item === "string" ? item : item.id)
          .filter((id) => agentById(id));
        const migratedSnapshotConfig = legacySnapshotConfig ? {
          ...legacySnapshotConfig,
          schema_version: SCHEMA_VERSION,
          git: gitConfiguration(
            legacySnapshotConfig.git?.flow?.model ?? legacySnapshotConfig.git?.flow ?? "later",
            legacySnapshotConfig.git?.delivery?.local_commit_mode ?? "disabled",
            { base: legacySnapshotConfig.git?.flow?.base, feature: legacySnapshotConfig.git?.flow?.feature },
            legacySnapshotConfig.git,
          ),
          agents: {
            preset: legacySnapshotConfig.agents?.preset ?? "custom",
            installed: snapshotInstalledIds.map((id) => ({ id, version: "1.0", source: "bundled" })),
            unavailable: AGENTS.filter(({ id }) => !snapshotInstalledIds.includes(id)).map(({ id }) => ({ id })),
          },
          migration: { from: fromVersion, migrated_at: timestamp, backup },
        } : migrated;
        const hash = snapshotHash(migratedSnapshotConfig);
        const snapshot = { schema_version: SCHEMA_VERSION, team_id: teamId, base, captured_at: legacySnapshot?.captured_at ?? timestamp, captured_by: "schema-migration", reason: `schema ${fromVersion} -> ${SCHEMA_VERSION}`, team_config: migratedSnapshotConfig, hash };
        await this.fs.mkdir(this.project(teamId, projectId, "effective-context"), { recursive: true, mode: 0o700 });
        await this.fs.mkdir(this.project(teamId, projectId, "history"), { recursive: true, mode: 0o700 });
        const snapshotFilesRoot = this.project(teamId, projectId, "effective-context", "team-files");
        const snapshotFiles = await collectDirectoryFiles(snapshotFilesRoot, TEAM_SNAPSHOT_DIRECTORIES, this.fs);
        const filesToRetain = (await exists(snapshotFilesRoot, this.fs))
          ? snapshotFiles
          : await collectDirectoryFiles(this.team(teamId), TEAM_SNAPSHOT_DIRECTORIES, this.fs);
        if (!(await exists(snapshotFilesRoot, this.fs))) await writeDirectoryFiles(snapshotFilesRoot, filesToRetain, this.fs);
        snapshot.files_hash = directoryFilesHash(filesToRetain);
        await this.writeJson(snapshotFile, snapshot);
        await this.writeJson(projectFile, {
          ...legacyProject,
          schema_version: SCHEMA_VERSION,
          project: { id: projectId, name: legacyProject.project?.name ?? projectId, team_id: teamId, status: legacyProject.project?.status ?? "bootstrap", description: legacyProject.project?.description ?? "", created_at: legacyProject.project?.created_at ?? timestamp, updated_at: timestamp },
          team_snapshot: { hash, captured_at: timestamp, source: "effective-context/team-snapshot.json", reason: snapshot.reason, author: snapshot.captured_by },
          base_snapshot: base,
          agents_snapshot: migratedSnapshotConfig.agents.installed,
          git: migratedSnapshotConfig.git,
          pending: legacyProject.pending ?? [...migrated.pending],
          migration: { from: fromVersion, migrated_at: timestamp, backup },
        });
      }
    }
    await this.writeJson(this.metadata("schema-version.json"), {
      schema_version: SCHEMA_VERSION,
      migrated_from: fromVersion,
      migrated_at: timestamp,
      backup,
    });
    return { home: this.home, changed: true, migrated: true, backup };
  }

  async createTeam(teamId, options = {}) {
    assertId(teamId, "ID do time");
    await this.initialize();
    const root = this.team(teamId);
    if (await exists(root, this.fs)) throw new UserError(`O time já existe: ${teamId}`);
    const preset = options.agentPreset ?? "essential";
    const installedIds = preset === "custom" ? options.agentIds ?? [] : AGENT_PRESETS[preset];
    if (!installedIds) throw new UserError(`Preset de agents inválido: ${preset}`);
    for (const id of installedIds) if (!agentById(id)) throw new UserError(`Agent desconhecido: ${id}`);
    const timestamp = now();
    const base = await this.baseReference();
    const teamConfig = {
      schema_version: SCHEMA_VERSION,
      team: { id: teamId, name: options.name ?? teamId, status: "bootstrap", created_at: timestamp, updated_at: timestamp },
      locale: options.locale ?? "pt-BR",
      base,
      git: gitConfiguration(options.gitFlow, options.commitMode, { base: options.customBase, feature: options.customFeature }),
      agents: {
        preset,
        installed: installedIds.map((id) => ({ id, version: "1.0", source: "bundled" })),
        unavailable: AGENTS.filter(({ id }) => !installedIds.includes(id)).map(({ id }) => ({ id })),
      },
      pending: ["domínio", "classificação de dados", "criticidade", "catálogo", "observabilidade"],
    };
    const directories = ["context", "catalog", "policies", "profiles/agents", "templates", "history", "projects"];
    for (const directory of directories) await this.fs.mkdir(path.join(root, directory), { recursive: true, mode: 0o700 });
    await this.writeJson(path.join(root, "team-config.yaml"), teamConfig);
    await this.writeAgentProfiles(teamId, installedIds);
    return { root, config: teamConfig };
  }

  async writeAgentProfiles(teamId, agentIds) {
    for (const id of agentIds) {
      const agent = agentById(id);
      await this.writeJson(this.team(teamId, "profiles", "agents", `${id}.json`), { ...agent, version: "1.0", source: "bundled" });
    }
  }

  async listTeams() {
    await this.initialize();
    return (await this.fs.readdir(this.teams(), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory()).map(({ name }) => name).sort();
  }

  async teamConfig(teamId) {
    const config = await this.readJson(this.team(teamId, "team-config.yaml"));
    if (config.schema_version !== SCHEMA_VERSION || config.team?.id !== teamId || !Array.isArray(config.agents?.installed)) {
      throw new UserError(`Schema inválido em team-config.yaml do time ${teamId}. Execute "teamflow doctor" e restaure um backup antes de continuar.`);
    }
    assertRemoteOperationsDenied(config.git, `team-config.yaml do time ${teamId}`);
    return config;
  }

  async useTeam(teamId) {
    await this.teamConfig(teamId);
    await this.writeJson(this.metadata("active-team.json"), { team_id: teamId, activated_at: now() });
    const activeProject = await this.readJson(this.metadata("active-project.json"), { optional: true });
    if (activeProject?.team_id !== teamId) await this.writeJson(this.metadata("active-project.json"), { team_id: teamId, project_id: null, activated_at: now() });
    return teamId;
  }

  async activeTeam() {
    const active = await this.readJson(this.metadata("active-team.json"), { optional: true });
    if (!active?.team_id) throw new UserError('Nenhum time ativo. Execute "teamflow team use <team-id>".');
    await this.teamConfig(active.team_id);
    return active.team_id;
  }

  async createProject(projectId, options = {}) {
    const teamId = await this.activeTeam();
    assertId(projectId, "ID do projeto");
    const root = this.project(teamId, projectId);
    if (await exists(root, this.fs)) throw new UserError(`O projeto já existe no time ${teamId}: ${projectId}`);
    const teamConfig = await this.teamConfig(teamId);
    const base = await this.baseReference();
    const teamFiles = await collectDirectoryFiles(this.team(teamId), TEAM_SNAPSHOT_DIRECTORIES, this.fs);
    const timestamp = now();
    const snapshot = {
      schema_version: SCHEMA_VERSION,
      team_id: teamId,
      base,
      captured_at: timestamp,
      captured_by: options.author ?? os.userInfo().username,
      team_config: teamConfig,
    };
    snapshot.hash = snapshotHash(snapshot.team_config);
    snapshot.files_hash = directoryFilesHash(teamFiles);
    const config = {
      schema_version: SCHEMA_VERSION,
      project: { id: projectId, name: options.name ?? projectId, team_id: teamId, status: "bootstrap", description: options.description ?? "", created_at: timestamp, updated_at: timestamp },
      team_snapshot: { hash: snapshot.hash, captured_at: timestamp, source: "effective-context/team-snapshot.json" },
      base_snapshot: base,
      agents_snapshot: teamConfig.agents.installed,
      git: teamConfig.git,
      pending: [...teamConfig.pending],
    };
    for (const directory of ["effective-context", "generated-runtime-files", "deliveries", "evidence", "history"]) {
      await this.fs.mkdir(path.join(root, directory), { recursive: true, mode: 0o700 });
    }
    await this.writeJson(path.join(root, "project-config.yaml"), config);
    await this.writeJson(path.join(root, "effective-context", "team-snapshot.json"), snapshot);
    await writeDirectoryFiles(path.join(root, "effective-context", "team-files"), teamFiles, this.fs);
    return { teamId, root, config };
  }

  async projectConfig(teamId, projectId) {
    const config = await this.readJson(this.project(teamId, projectId, "project-config.yaml"));
    if (config.schema_version !== SCHEMA_VERSION || config.project?.id !== projectId || config.project?.team_id !== teamId || !config.team_snapshot?.hash) {
      throw new UserError(`Schema inválido em project-config.yaml de ${teamId}/${projectId}. Restaure o histórico ou backup antes de continuar.`);
    }
    assertRemoteOperationsDenied(config.git, `project-config.yaml de ${teamId}/${projectId}`);
    const snapshot = await this.readJson(this.project(teamId, projectId, "effective-context", "team-snapshot.json"));
    const actualHash = snapshotHash(snapshot.team_config);
    const snapshotFiles = await collectDirectoryFiles(this.project(teamId, projectId, "effective-context", "team-files"), TEAM_SNAPSHOT_DIRECTORIES, this.fs);
    const actualFilesHash = directoryFilesHash(snapshotFiles);
    if (snapshot.team_id !== teamId || snapshot.hash !== actualHash || config.team_snapshot.hash !== actualHash || snapshot.files_hash !== actualFilesHash) {
      throw new UserError(`Integridade do snapshot inválida em ${teamId}/${projectId}. A ativação foi bloqueada; restaure o histórico ou atualize o snapshot por ação explícita.`);
    }
    assertProjectInheritance(config, snapshot, `${teamId}/${projectId}`);
    return config;
  }

  async listProjects() {
    const teamId = await this.activeTeam();
    const entries = await this.fs.readdir(this.team(teamId, "projects"), { withFileTypes: true });
    const projects = [];
    for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      const config = await this.projectConfig(teamId, entry.name);
      projects.push({ id: entry.name, status: config.project.status });
    }
    return { teamId, projects };
  }

  async activateProject(projectId) {
    const teamId = await this.activeTeam();
    const config = await this.projectConfig(teamId, projectId);
    if (config.project.status === "archived") throw new UserError(`O projeto está arquivado: ${projectId}`);
    const active = { team_id: teamId, project_id: projectId, activated_at: now(), base: await this.baseReference(), effective_context: this.project(teamId, projectId, "effective-context"), generated_runtime_files: this.project(teamId, projectId, "generated-runtime-files") };
    await this.writeJson(this.metadata("active-project.json"), active);
    await this.writeJson(this.project(teamId, projectId, "generated-runtime-files", "activation.json"), active);
    return { teamId, projectId, root: this.project(teamId, projectId) };
  }

  async archiveProject(projectId) {
    const teamId = await this.activeTeam();
    const config = await this.projectConfig(teamId, projectId);
    config.project.status = "archived";
    config.project.archived_at = now();
    config.project.updated_at = now();
    await this.writeJson(this.project(teamId, projectId, "project-config.yaml"), config);
    const active = await this.readJson(this.metadata("active-project.json"), { optional: true });
    if (active?.team_id === teamId && active.project_id === projectId) {
      await this.writeJson(this.metadata("active-project.json"), { team_id: teamId, project_id: null, activated_at: now() });
    }
    return { teamId, projectId };
  }

  async compareProject(projectId) {
    const teamId = await this.activeTeam();
    const config = await this.projectConfig(teamId, projectId);
    const teamConfig = await this.teamConfig(teamId);
    const snapshot = await this.readJson(this.project(teamId, projectId, "effective-context", "team-snapshot.json"));
    const snapshotFiles = await collectDirectoryFiles(this.project(teamId, projectId, "effective-context", "team-files"), TEAM_SNAPSHOT_DIRECTORIES, this.fs);
    const currentFiles = await collectDirectoryFiles(this.team(teamId), TEAM_SNAPSHOT_DIRECTORIES, this.fs);
    const currentHash = snapshotHash(teamConfig);
    const currentFilesHash = directoryFilesHash(currentFiles);
    const differences = configDifferences(snapshot.team_config, teamConfig);
    const changedFiles = fileDifferences(snapshotFiles, currentFiles);
    return { teamId, projectId, changed: config.team_snapshot.hash !== currentHash || snapshot.files_hash !== currentFilesHash, snapshot_hash: config.team_snapshot.hash, current_hash: currentHash, snapshot_files_hash: snapshot.files_hash, current_files_hash: currentFilesHash, differences, file_differences: changedFiles };
  }

  async updateProjectSnapshot(projectId, { reason, author = os.userInfo().username } = {}) {
    if (!reason) throw new UserError("Informe --reason para atualizar o snapshot do projeto.");
    const teamId = await this.activeTeam();
    const config = await this.projectConfig(teamId, projectId);
    const teamConfig = await this.teamConfig(teamId);
    const currentFiles = await collectDirectoryFiles(this.team(teamId), TEAM_SNAPSHOT_DIRECTORIES, this.fs);
    const previous = await this.readJson(this.project(teamId, projectId, "effective-context", "team-snapshot.json"));
    const effectiveRoot = this.project(teamId, projectId, "effective-context");
    const previousFiles = await collectDirectoryFiles(path.join(effectiveRoot, "team-files"), TEAM_SNAPSHOT_DIRECTORIES, this.fs);
    const timestamp = now();
    const snapshot = { schema_version: SCHEMA_VERSION, team_id: teamId, captured_at: timestamp, captured_by: author, reason, team_config: teamConfig, hash: snapshotHash(teamConfig), files_hash: directoryFilesHash(currentFiles) };
    const differences = configDifferences(previous.team_config, teamConfig);
    const changedFiles = fileDifferences(previousFiles, currentFiles);
    await this.writeJson(this.project(teamId, projectId, "history", `team-snapshot-${Date.now()}.json`), previous);
    const fileBackup = this.project(teamId, projectId, "history", `team-files-${Date.now()}`);
    await writeDirectoryFiles(fileBackup, previousFiles, this.fs);
    const snapshotFilesRoot = path.join(effectiveRoot, "team-files");
    const relativeSnapshotRoot = path.relative(this.project(teamId, projectId), snapshotFilesRoot);
    if (relativeSnapshotRoot.startsWith("..") || path.isAbsolute(relativeSnapshotRoot)) throw new UserError("Destino de snapshot inválido; atualização cancelada.");
    await this.fs.rm(snapshotFilesRoot, { recursive: true, force: true });
    await writeDirectoryFiles(snapshotFilesRoot, currentFiles, this.fs);
    await this.writeJson(this.project(teamId, projectId, "history", `snapshot-update-${Date.now()}.json`), { updated_at: timestamp, author, reason, previous_hash: previous.hash, current_hash: snapshot.hash, previous_files_hash: previous.files_hash, current_files_hash: snapshot.files_hash, differences, file_differences: changedFiles });
    await this.writeJson(this.project(teamId, projectId, "effective-context", "team-snapshot.json"), snapshot);
    config.team_snapshot = { hash: snapshot.hash, captured_at: timestamp, source: "effective-context/team-snapshot.json", reason, author };
    config.agents_snapshot = teamConfig.agents.installed;
    config.git = teamConfig.git;
    config.project.updated_at = timestamp;
    await this.writeJson(this.project(teamId, projectId, "project-config.yaml"), config);
    return { teamId, projectId, previous_hash: previous.hash, current_hash: snapshot.hash, differences, file_differences: changedFiles };
  }

  async installAgent(agentId) {
    const teamId = await this.activeTeam();
    const agent = agentById(agentId);
    if (!agent) throw new UserError(`Agent desconhecido: ${agentId}`);
    const config = await this.teamConfig(teamId);
    if (!config.agents.installed.some(({ id }) => id === agentId)) config.agents.installed.push({ id: agentId, version: "1.0", source: "bundled" });
    config.agents.unavailable = config.agents.unavailable.filter(({ id }) => id !== agentId);
    config.team.updated_at = now();
    await this.writeJson(this.team(teamId, "team-config.yaml"), config);
    await this.writeAgentProfiles(teamId, [agentId]);
    return { teamId, agent };
  }

  async removeAgent(agentId, { confirmed = false } = {}) {
    const teamId = await this.activeTeam();
    const config = await this.teamConfig(teamId);
    if (!config.agents.installed.some(({ id }) => id === agentId)) throw new UserError(`Agent não está instalado no time ${teamId}: ${agentId}`);
    const impacted = [];
    const { projects } = await this.listProjects();
    for (const project of projects.filter(({ status }) => status !== "archived")) {
      const projectConfig = await this.projectConfig(teamId, project.id);
      if (projectConfig.agents_snapshot.some(({ id }) => id === agentId)) impacted.push(project.id);
    }
    const alwaysRequired = ["lead", "principal-reviewer"].includes(agentId);
    if ((impacted.length > 0 || alwaysRequired) && !confirmed) {
      const impacts = impacted.length > 0 ? ` snapshots de projetos ativos (${impacted.join(", ")})` : " um gate/responsabilidade universal";
      throw new UserError(`A remoção afeta${impacts}. Repita com --confirm; gates continuam aplicáveis e snapshots existentes não serão alterados.`);
    }
    config.agents.installed = config.agents.installed.filter(({ id }) => id !== agentId);
    if (!config.agents.unavailable.some(({ id }) => id === agentId)) config.agents.unavailable.push({ id: agentId });
    config.team.updated_at = now();
    await this.writeJson(this.team(teamId, "team-config.yaml"), config);
    await this.fs.unlink(this.team(teamId, "profiles", "agents", `${agentId}.json`)).catch((error) => { if (error.code !== "ENOENT") throw error; });
    return { teamId, agentId, impacted };
  }

  async addCatalogEntry(kind, entry) {
    const teamId = await this.activeTeam();
    const allowed = new Set(["repositories", "systems", "journeys"]);
    if (!allowed.has(kind)) throw new UserError(`Tipo de catálogo inválido: ${kind}`);
    const file = this.team(teamId, "catalog", `${kind}.json`);
    const catalog = await this.readJson(file, { optional: true }) ?? { schema_version: SCHEMA_VERSION, [kind]: [] };
    assertId(entry.id, "ID da entrada");
    if (catalog[kind].some(({ id }) => id === entry.id)) throw new UserError(`A entrada já existe em ${kind}: ${entry.id}`);
    catalog[kind].push(entry);
    await this.writeJson(file, catalog);
    return { teamId, file, entry };
  }
}

export function gitConfiguration(flow = "later", commitMode = "disabled", custom = {}, previous = null) {
  const flows = {
    gitflow: { model: "gitflow", base: "develop", feature: "feature/{demand_id}-{slug}" },
    trunk: { model: "trunk-based", base: "main", feature: "feature/{demand_id}-{slug}" },
    custom: { model: "custom", base: custom.base ?? previous?.flow?.base ?? null, feature: custom.feature ?? previous?.flow?.feature ?? null },
    later: { model: "pending", base: null, feature: null },
  };
  flows["trunk-based"] = flows.trunk;
  flows.pending = flows.later;
  if (!flows[flow]) throw new UserError(`Fluxo Git inválido: ${flow}`);
  if (!["disabled", "final-per-repository", "manual", "incremental"].includes(commitMode)) throw new UserError(`Modo de commit inválido: ${commitMode}`);
  const prior = previous?.delivery ?? {};
  return {
    flow: flows[flow],
    delivery: {
      ...prior,
      local_commit_mode: commitMode,
      require_clean_worktree_before_start: true,
      require_requirements_traceability: true,
      require_applicable_local_checks_before_final_commit: true,
      allow_commit_with_unavailable_remote_checks: prior.allow_commit_with_unavailable_remote_checks === false ? false : true,
      require_secret_scan_before_commit: true,
      commit_message_template: prior.commit_message_template ?? "{type}({scope}): {summary} [{demand_id}]",
      require_demand_id: true,
      signing: prior.signing === "required" ? "required" : prior.signing ?? "repository-default",
      push_allowed: false,
      pull_request_allowed: false,
      merge_allowed: false,
      deploy_allowed: false,
      release_allowed: false,
    },
  };
}
