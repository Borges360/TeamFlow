import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { main } from "../src/cli.js";
import { TeamFlowStore, canonicalRemote, remoteDigest, resolveTeamFlowHome } from "../src/storage.js";
import { captureIo } from "./helpers.js";

async function fixture(t) { const root = await fs.mkdtemp(path.join(os.tmpdir(), "teamflow-workspace-")); t.after(() => fs.rm(root, { recursive: true, force: true })); const store = new TeamFlowStore(path.join(root, "private home")); await store.initialize(); await store.createTeam("team", { name: "Team", gitFlow: "trunk" }); await store.useTeam("team"); return { root, store }; }
function git(args, cwd) { execFileSync("git", args, { cwd, stdio: "pipe" }); }
async function repository(root) { const source = path.join(root, "source repository"); await fs.mkdir(source); git(["init", "--initial-branch", "main"], source); git(["config", "user.name", "test"], source); git(["config", "user.email", "test@example.invalid"], source); await fs.writeFile(path.join(source, "README.md"), "initial\n"); git(["add", "."], source); git(["commit", "-m", "initial"], source); return { source, remote: pathToFileURL(source).href }; }

test("home precedence is stable", () => {
  assert.equal(resolveTeamFlowHome({ override: "./explicit", env: { TEAMFLOW_HOME: "ignored" } }), path.resolve("explicit"));
  assert.equal(resolveTeamFlowHome({ env: { USERPROFILE: "C:/Users/test" }, platform: "win32", homedir: "ignored" }), path.resolve("C:/Users/test", ".teamFlow"));
});

test("new projects pin a base and use a workspace delivery root", async (t) => {
  const { store } = await fixture(t); const project = await store.createProject("team", "customer", { name: "Customer", description: "Durable project" });
  const config = await store.projectConfig("team", "customer");
  assert.match(config.base_snapshot.key, /^0\.1\.1-[a-f0-9]{64}$/u);
  assert.equal(config.layout.deliveries_root, "workspace/deliveries");
  assert.equal(await store.projectPath("team", "customer"), project.workspace);
  for (const name of ["AGENTS.md", "agents", "skills", "project", "deliveries", "repositories"]) assert.equal(await fs.stat(path.join(project.workspace, name)).then(() => true), true);
  await assert.rejects(() => store.withLock(store.state("team", "customer", "locks", "x"), () => store.withLock(store.state("team", "customer", "locks", "x"), async () => {})), /lock ativo/u);
});

test("base upgrade and explicit rollback preserve the prior pinned key", async (t) => {
  const { store } = await fixture(t); await store.createProject("team", "customer", { name: "Customer" }); const config = await store.projectConfig("team", "customer");
  const oldKey = "previous-base"; const oldRoot = store.internal("bases", oldKey); await fs.cp(config.base_snapshot.root, oldRoot, { recursive: true }); const oldManifest = await store.readJson(path.join(oldRoot, "base-manifest.json")); oldManifest.key = oldKey; await store.writeJson(path.join(oldRoot, "base-manifest.json"), oldManifest);
  config.base_snapshot = { ...oldManifest, key: oldKey, root: oldRoot, manifest: path.join(oldRoot, "base-manifest.json") }; await store.writeJson(store.project("team", "customer", "project-config.yaml"), config);
  const upgraded = await store.upgradeBase("team", "customer", { reason: "test" }); assert.notEqual(upgraded.current.key, oldKey);
  const rolledBack = await store.rollbackBase("team", "customer", { to: oldKey, reason: "test" }); assert.equal(rolledBack.current.key, oldKey);
});

test("repository cache, demand worktree and literal demand survive re-opening", async (t) => {
  const { root, store } = await fixture(t); await store.createProject("team", "customer", { name: "Customer" }); const remote = await repository(root);
  const binding = await store.addRepository("team", "customer", { id: "api", remote: remote.remote, defaultBranch: "main" });
  assert.equal(binding.remote_digest, remoteDigest(remote.remote)); assert.equal(canonicalRemote(remote.remote), canonicalRemote(binding.remote_url));
  const text = "Implemente exatamente esta demanda\nsem reescrever."; await store.createDemand("team", "customer", { id: "dem-1", title: "First demand", text });
  const prepared = await store.prepareDemand("team", "customer", "dem-1");
  assert.equal(prepared.worktrees.length, 1); assert.equal(await fs.stat(path.join(prepared.deliveries, "dem-1")).then(() => true), true); assert.equal(await fs.readFile(path.join(prepared.root, "AGENTS.md"), "utf8").then((value) => value.includes(prepared.deliveries)), true);
  const reopened = new TeamFlowStore(store.home); assert.equal((await reopened.listDemands("team", "customer"))[0].original_demand, text);
});

test("legacy projects migrate lazily without moving deliveries", async (t) => {
  const { store } = await fixture(t); const root = store.project("team", "legacy"); await fs.mkdir(path.join(root, "deliveries"), { recursive: true }); await fs.writeFile(path.join(root, "deliveries", "keep.txt"), "keep");
  await store.writeJson(path.join(root, "project-config.yaml"), { schema_version: "1.0", project: { id: "legacy", team_id: "team", name: "Legacy", status: "bootstrap" }, team_snapshot: { hash: "legacy" }, git: { flow: { feature: "feature/{demand_id}-{slug}" } } });
  const migrated = await store.projectConfig("team", "legacy"); assert.equal(migrated.layout.legacy_deliveries, true); assert.equal(await fs.readFile(path.join(root, "deliveries", "keep.txt"), "utf8"), "keep"); assert.equal(await fs.stat(path.join(root, "workspace", "deliveries")).then(() => true, () => false), false);
});

test("sync rejects remote mismatch and dirty state; detach retains the checkout", async (t) => {
  const { root, store } = await fixture(t); await store.createProject("team", "customer", { name: "Customer" }); const remote = await repository(root);
  const binding = await store.addRepository("team", "customer", { id: "api", remote: remote.remote, defaultBranch: "main" });
  git(["remote", "set-url", "origin", "https://example.invalid/other.git"], binding.checkout);
  await assert.rejects(() => store.syncRepository("team", "customer", "api"), /Remote mismatch/u);
  git(["remote", "set-url", "origin", remote.remote], binding.checkout); await fs.writeFile(path.join(binding.checkout, "dirty.txt"), "dirty");
  await assert.rejects(() => store.syncRepository("team", "customer", "api"), /alterações locais/u);
  const detached = await store.detachRepository("team", "customer", "api"); assert.equal(detached.checkout_retained, binding.checkout); assert.equal(await fs.stat(binding.checkout).then(() => true), true);
});

test("demand exec launches a runtime inside the prepared worktree", async (t) => {
  const { root, store } = await fixture(t); await store.createProject("team", "customer", { name: "Customer" }); const remote = await repository(root);
  await store.addRepository("team", "customer", { id: "api", remote: remote.remote, defaultBranch: "main" }); await store.createDemand("team", "customer", { id: "dem-2", title: "Runtime", text: "execute" });
  const output = captureIo(); const status = await main(["demand", "exec", "dem-2", "--project", "customer", "--team", "team", "--", process.execPath, "-e", "process.exit(0)"], { io: output.io, store });
  assert.equal(status, 0); const demand = (await store.listDemands("team", "customer")).find((item) => item.demand_id === "dem-2"); assert.equal(demand.status, "prepared");
});
