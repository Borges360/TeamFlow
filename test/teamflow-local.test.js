import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { main } from "../src/cli.js";
import { TeamFlowStore, resolveTeamFlowHome } from "../src/storage.js";
import { captureIo } from "./helpers.js";

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "teamflow-local-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return { root, home: path.join(root, "home"), store: new TeamFlowStore(path.join(root, "home")) };
}

test("home follows override, environment and platform precedence", () => {
  assert.equal(resolveTeamFlowHome({ override: "./explicit", env: { TEAMFLOW_HOME: "ignored" } }), path.resolve("explicit"));
  assert.equal(resolveTeamFlowHome({ env: { TEAMFLOW_HOME: "./environment" } }), path.resolve("environment"));
  assert.equal(resolveTeamFlowHome({ env: { USERPROFILE: "C:/Users/test" }, platform: "win32", homedir: "ignored" }), path.resolve("C:/Users/test", ".teamFlow"));
  assert.equal(resolveTeamFlowHome({ env: {}, platform: "linux", homedir: "/home/test" }), path.resolve("/home/test", ".teamFlow"));
});

test("non-interactive setup creates a private team and optional first project", async (t) => {
  const { root, home } = await fixture(t);
  const configFile = path.join(root, "setup.json");
  await fs.writeFile(configFile, JSON.stringify({
    team: { id: "comprovantes", name: "Comprovantes" },
    git: { flow: "gitflow", commit_mode: "final-per-repository" },
    agents: { preset: "essential" },
    project: { id: "filtros-comprovante", name: "Filtros", description: "Adicionar filtros" },
  }));
  const output = captureIo();
  assert.equal(await main(["setup", "--non-interactive", "--config", configFile, "--home", home], { io: output.io }), 0);
  const teamConfig = JSON.parse(await fs.readFile(path.join(home, "teams", "comprovantes", "team-config.yaml"), "utf8"));
  const projectConfig = JSON.parse(await fs.readFile(path.join(home, "teams", "comprovantes", "projects", "filtros-comprovante", "project-config.yaml"), "utf8"));
  assert.equal(teamConfig.git.flow.base, "develop");
  assert.equal(teamConfig.git.delivery.push_allowed, false);
  assert.deepEqual(teamConfig.agents.installed.map(({ id }) => id), ["lead", "requirement-analyst", "software-engineer", "quality-engineer", "principal-reviewer"]);
  assert.equal(projectConfig.project.team_id, "comprovantes");
  assert.match(output.stdout.join("\n"), /Estado: bootstrap/u);
  assert.equal(await main(["setup", "--non-interactive", "--config", configFile, "--home", home], { io: captureIo().io }), 0);
  assert.deepEqual((await fs.readdir(path.join(home, "teams"))).sort(), ["comprovantes"]);
});

test("dry-run is side-effect free", async (t) => {
  const { root, home } = await fixture(t);
  const configFile = path.join(root, "setup.json");
  await fs.writeFile(configFile, JSON.stringify({ team: { id: "dry", name: "Dry" } }));
  assert.equal(await main(["setup", "--dry-run", "--non-interactive", "--config", configFile, "--home", home], { io: captureIo().io }), 0);
  await assert.rejects(() => fs.access(home), { code: "ENOENT" });
});

test("projects are listed and activated only inside the active team", async (t) => {
  const { store } = await fixture(t);
  await store.createTeam("time-a", { agentPreset: "essential" });
  await store.createTeam("time-b", { agentPreset: "complete" });
  await store.useTeam("time-a");
  await store.createProject("projeto-a");
  await store.useTeam("time-b");
  await store.createProject("projeto-b");
  assert.deepEqual((await store.listProjects()).projects.map(({ id }) => id), ["projeto-b"]);
  await assert.rejects(() => store.activateProject("projeto-a"), /obrigatório não encontrado/u);
  const activation = await store.activateProject("projeto-b");
  const active = await store.readJson(store.metadata("active-project.json"));
  assert.equal(active.team_id, "time-b");
  assert.equal(active.project_id, "projeto-b");
  assert.equal(active.base.version, "0.1.1");
  assert.equal(active.effective_context, store.project("time-b", "projeto-b", "effective-context"));
  assert.equal(activation.teamId, "time-b");
  await store.useTeam("time-a");
  assert.deepEqual((await store.listProjects()).projects.map(({ id }) => id), ["projeto-a"]);
});

test("project snapshots do not change silently when team agents change", async (t) => {
  const { store } = await fixture(t);
  await store.createTeam("time-a", { agentPreset: "essential" });
  await store.useTeam("time-a");
  await store.createProject("projeto-a");
  const before = await store.projectConfig("time-a", "projeto-a");
  await store.installAgent("security-engineer");
  const unchanged = await store.projectConfig("time-a", "projeto-a");
  assert.deepEqual(unchanged.agents_snapshot, before.agents_snapshot);
  assert.equal((await store.compareProject("projeto-a")).changed, true);
  const updated = await store.updateProjectSnapshot("projeto-a", { reason: "Aprovação do owner", author: "teste" });
  assert.notEqual(updated.previous_hash, updated.current_hash);
  assert.equal((await store.compareProject("projeto-a")).changed, false);
});

test("effective context captures team files and reports catalog changes", async (t) => {
  const { store } = await fixture(t);
  await store.createTeam("time-a");
  await store.useTeam("time-a");
  await fs.writeFile(store.team("time-a", "context", "domain.md"), "Contexto original", "utf8");
  await store.createProject("projeto-a");
  await fs.writeFile(store.team("time-a", "context", "domain.md"), "Contexto alterado", "utf8");
  const comparison = await store.compareProject("projeto-a");
  assert.equal(comparison.changed, true);
  assert.equal(comparison.file_differences.some(({ path: file }) => file === "context/domain.md"), true);
  assert.equal(await fs.readFile(store.project("time-a", "projeto-a", "effective-context", "team-files", "context", "domain.md"), "utf8"), "Contexto original");
});

test("agent removal warns about active project snapshots and preserves them", async (t) => {
  const { store } = await fixture(t);
  await store.createTeam("time-a", { agentPreset: "essential" });
  await store.useTeam("time-a");
  await store.createProject("projeto-a");
  await assert.rejects(() => store.removeAgent("quality-engineer"), /--confirm/u);
  await store.removeAgent("quality-engineer", { confirmed: true });
  assert.equal((await store.projectConfig("time-a", "projeto-a")).agents_snapshot.some(({ id }) => id === "quality-engineer"), true);
  assert.equal((await store.teamConfig("time-a")).agents.installed.some(({ id }) => id === "quality-engineer"), false);
});

test("universally required agents need explicit confirmation even without projects", async (t) => {
  const { store } = await fixture(t);
  await store.createTeam("time-a", { agentPreset: "essential" });
  await store.useTeam("time-a");
  await assert.rejects(() => store.removeAgent("principal-reviewer"), /--confirm/u);
  await store.removeAgent("principal-reviewer", { confirmed: true });
  assert.equal((await store.teamConfig("time-a")).agents.installed.some(({ id }) => id === "principal-reviewer"), false);
});

test("schema migration creates a backup before updating metadata", async (t) => {
  const { home, store } = await fixture(t);
  await fs.mkdir(path.join(home, "metadata"), { recursive: true });
  await fs.mkdir(path.join(home, "teams", "legacy", "projects", "old-project"), { recursive: true });
  await fs.writeFile(path.join(home, "metadata", "schema-version.json"), JSON.stringify({ schema_version: "0.9" }));
  await fs.writeFile(path.join(home, "teams", "legacy", "team-config.yaml"), JSON.stringify({ schema_version: "0.9", team: { id: "legacy", name: "Legacy" }, agents: { installed: ["lead", "principal-reviewer"] }, git_delivery: { local_commit_mode: "manual" } }));
  await fs.writeFile(path.join(home, "teams", "legacy", "projects", "old-project", "project-config.yaml"), JSON.stringify({ schema_version: "0.9", project: { id: "old-project", team_id: "legacy" } }));
  const result = await store.initialize();
  assert.equal(result.migrated, true);
  assert.equal((await store.readJson(store.metadata("schema-version.json"))).schema_version, "1.0");
  assert.equal((await fs.stat(path.join(result.backup, "metadata", "schema-version.json"))).isFile(), true);
  assert.equal((await store.teamConfig("legacy")).git.delivery.push_allowed, false);
  assert.equal((await store.projectConfig("legacy", "old-project")).project.team_id, "legacy");
  await store.useTeam("legacy");
  assert.equal((await store.compareProject("old-project")).changed, false);
});

test("catalog journeys include impact surfaces and stay inside the active team", async (t) => {
  const { store } = await fixture(t);
  await store.createTeam("time-a");
  await store.createTeam("time-b");
  await store.useTeam("time-a");
  await store.addCatalogEntry("journeys", { id: "consulta", name: "Consulta", systems: [], repositories: [], apis: [], events: [], data: [] });
  assert.equal((await store.readJson(store.team("time-a", "catalog", "journeys.json"))).journeys.length, 1);
  await assert.rejects(() => store.readJson(store.team("time-b", "catalog", "journeys.json")), /obrigatório não encontrado/u);
});

test("git delivery policy never authorizes remote operations", async (t) => {
  const { store } = await fixture(t);
  const { config } = await store.createTeam("time-a", { gitFlow: "gitflow", commitMode: "final-per-repository" });
  assert.equal(config.git.delivery.local_commit_mode, "final-per-repository");
  for (const key of ["push_allowed", "pull_request_allowed", "merge_allowed", "deploy_allowed", "release_allowed"]) assert.equal(config.git.delivery[key], false);
});

test("tampered team policy cannot enable remote operations", async (t) => {
  const { store } = await fixture(t);
  const { config } = await store.createTeam("time-a");
  config.git.delivery.push_allowed = true;
  await store.writeJson(store.team("time-a", "team-config.yaml"), config);
  await assert.rejects(() => store.teamConfig("time-a"), /operações remotas/u);
});

test("tampered effective snapshot is rejected before comparison or activation", async (t) => {
  const { store } = await fixture(t);
  await store.createTeam("time-a");
  await store.useTeam("time-a");
  await store.createProject("projeto-a");
  const file = store.project("time-a", "projeto-a", "effective-context", "team-snapshot.json");
  const snapshot = await store.readJson(file);
  snapshot.team_config.team.name = "Conteúdo adulterado";
  await store.writeJson(file, snapshot);
  await assert.rejects(() => store.compareProject("projeto-a"), /Integridade do snapshot inválida/u);
  await assert.rejects(() => store.activateProject("projeto-a"), /Integridade do snapshot inválida/u);
});

test("project cannot forge agents or weaken its inherited Git policy", async (t) => {
  const { store } = await fixture(t);
  await store.createTeam("time-a", { gitFlow: "gitflow", commitMode: "manual" });
  await store.useTeam("time-a");
  await store.createProject("projeto-a");
  const file = store.project("time-a", "projeto-a", "project-config.yaml");
  const forgedAgents = await store.readJson(file);
  forgedAgents.agents_snapshot.push({ id: "security-engineer", version: "1.0", source: "bundled" });
  await store.writeJson(file, forgedAgents);
  await assert.rejects(() => store.projectConfig("time-a", "projeto-a"), /Agents snapshot divergente/u);
  const snapshot = await store.readJson(store.project("time-a", "projeto-a", "effective-context", "team-snapshot.json"));
  const weakened = { ...forgedAgents, agents_snapshot: snapshot.team_config.agents.installed };
  weakened.git.delivery.require_secret_scan_before_commit = false;
  await store.writeJson(file, weakened);
  await assert.rejects(() => store.projectConfig("time-a", "projeto-a"), /enfraquece um controle/u);
});

test("doctor reports corrupted local policy instead of a false healthy status", async (t) => {
  const { store } = await fixture(t);
  const { config } = await store.createTeam("time-a");
  await store.useTeam("time-a");
  config.git.delivery.push_allowed = true;
  await store.writeJson(store.team("time-a", "team-config.yaml"), config);
  const output = captureIo();
  assert.equal(await main(["doctor"], { io: output.io, store }), 0);
  const result = JSON.parse(output.stdout.at(-1));
  assert.equal(result.status, "degraded");
  assert.equal(result.findings.length > 0, true);
});

test("setup resume continues from a private draft after interruption", async (t) => {
  const { store } = await fixture(t);
  const interrupted = captureIo();
  const firstAnswers = ["Time Retomado", "", () => { throw new Error("interrompido"); }];
  assert.equal(await main(["setup"], { io: interrupted.io, store, ask: async () => { const value = firstAnswers.shift(); return typeof value === "function" ? value() : value; } }), 1);
  assert.equal((await store.readJson(store.metadata("setup-draft.json"))).team.id, "time-retomado");
  const answers = ["1", "1", "1", "n"];
  assert.equal(await main(["setup", "--resume"], { io: captureIo().io, store, ask: async () => answers.shift() }), 0);
  assert.equal((await store.teamConfig("time-retomado")).team.name, "Time Retomado");
  await assert.rejects(() => fs.access(store.metadata("setup-draft.json")), { code: "ENOENT" });
});

test("IDs reject traversal and persisted configuration rejects secret-bearing keys", async (t) => {
  const { store } = await fixture(t);
  await assert.rejects(() => store.createTeam("../outside"), /ID do time inválido/u);
  await assert.rejects(() => store.writeJson(store.metadata("unsafe.json"), { api_token: "must-not-be-written" }), /potencialmente secreto/u);
  await assert.rejects(() => store.writeJson(store.metadata("unsafe-url.json"), { repository_url: "https://user:TOKEN@example.invalid/repo.git" }), /aparência de credencial/u);
  await assert.rejects(() => store.writeJson(store.metadata("unsafe-auth.json"), { authorization: "Bearer TOKEN123" }), /potencialmente secreto/u);
  await assert.rejects(() => store.writeJson(store.metadata("unsafe-camel.json"), { apiToken: "TOKEN" }), /potencialmente secreto/u);
  await assert.rejects(() => fs.access(store.metadata("unsafe.json")), { code: "ENOENT" });
});
