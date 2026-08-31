import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const npmCli = process.env.npm_execpath
  ?? path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "teamflow-package-"));

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed\n${result.error?.message ?? ""}\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result;
}

try {
  const pack = run(
    process.execPath,
    [npmCli, "pack", "--json", "--ignore-scripts", "--pack-destination", temporaryRoot],
    root,
  );
  const packResult = JSON.parse(pack.stdout);
  assert.equal(packResult.length, 1);
  const tarball = path.join(temporaryRoot, packResult[0].filename);

  const cleanProject = path.join(temporaryRoot, "consumer");
  await mkdir(cleanProject);
  run(process.execPath, [npmCli, "init", "--yes"], cleanProject);
  run(
    process.execPath,
    [npmCli, "install", "--ignore-scripts", "--no-audit", "--no-fund", tarball],
    cleanProject,
  );

  const installedPackage = JSON.parse(
    await readFile(path.join(cleanProject, "node_modules", "teamflow", "package.json"), "utf8"),
  );
  const installedCli = path.join(cleanProject, "node_modules", "teamflow", "bin", "teamflow.js");
  const installedBase = path.join(cleanProject, "node_modules", "teamflow", ".squad", "playbooks", "playbook-feature.md");
  assert.match(await readFile(installedBase, "utf8"), /# Playbook: feature/u);
  const smoke = run(process.execPath, [installedCli, "--version"], cleanProject);
  assert.equal(smoke.stdout.trim(), `teamFlow ${installedPackage.version}`);
  const setupConfig = path.join(cleanProject, "setup.json");
  const teamFlowHome = path.join(cleanProject, "private-home");
  await writeFile(setupConfig, JSON.stringify({ team: { id: "packaged-team", name: "Packaged Team" } }), "utf8");
  run(process.execPath, [installedCli, "setup", "--non-interactive", "--config", setupConfig, "--home", teamFlowHome], cleanProject);
  const installedTeam = JSON.parse(await readFile(path.join(teamFlowHome, "teams", "packaged-team", "team-config.yaml"), "utf8"));
  assert.equal(installedTeam.team.id, "packaged-team");
  assert.equal(installedTeam.git.delivery.push_allowed, false);
  const npmExecSmoke = run(
    process.execPath,
    [npmCli, "exec", "--offline", "--", "teamflow", "--version"],
    cleanProject,
  );
  assert.equal(npmExecSmoke.stdout.trim(), `teamFlow ${installedPackage.version}`);

  console.log(`Packed ${packResult[0].filename}, installed it in a clean directory and executed the teamflow npm shim.`);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
