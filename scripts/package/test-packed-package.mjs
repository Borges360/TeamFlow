import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const npmCli = process.env.npm_execpath
  ?? path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "teamflow-package-"));
const packageRoot = path.join(temporaryRoot, "source-package");
const ownerMarker = path.join(temporaryRoot, ".teamflow-package-test-owner");
const ownerMarkerContents = "teamflow-isolated-package-test-v1\n";
const temporaryBase = path.resolve(os.tmpdir());
const relativeTemporaryRoot = path.relative(temporaryBase, path.resolve(temporaryRoot));
assert.ok(
  relativeTemporaryRoot && !relativeTemporaryRoot.startsWith(`..${path.sep}`) && !path.isAbsolute(relativeTemporaryRoot),
  "Temporary package root must remain inside the OS temporary directory",
);

async function stageInput(relativePath, optional = false) {
  const source = path.join(root, relativePath);
  const destination = path.join(packageRoot, relativePath);
  try {
    await access(source);
  } catch (error) {
    if (optional && error.code === "ENOENT") return;
    throw error;
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, {
    recursive: true,
    dereference: false,
    force: false,
    errorOnExist: true,
  });
}

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
  await writeFile(ownerMarker, ownerMarkerContents, { flag: "wx" });
  await mkdir(packageRoot);
  for (const relativePath of [
    "package.json",
    "bin",
    "src",
    "scripts/package/build-runtime.mjs",
    "AGENTS.md",
    "squad.yaml",
    ".squad",
  ]) {
    await stageInput(relativePath);
  }
  for (const relativePath of ["README.md", "LICENSE", ".gitignore", ".npmignore"]) {
    await stageInput(relativePath, true);
  }

  run(process.execPath, [npmCli, "run", "build"], packageRoot);
  const pack = run(
    process.execPath,
    [npmCli, "pack", "--json", "--ignore-scripts", "--pack-destination", temporaryRoot],
    packageRoot,
  );
  const packResult = JSON.parse(pack.stdout);
  assert.equal(packResult.length, 1);
  const tarball = path.join(temporaryRoot, packResult[0].filename);

  const cleanProject = path.join(temporaryRoot, "consumer");
  await mkdir(cleanProject);
  run(process.execPath, [npmCli, "init", "--yes"], cleanProject);
  run(
    process.execPath,
    [npmCli, "install", "--offline", "--ignore-scripts", "--no-audit", "--no-fund", tarball],
    cleanProject,
  );

  const installedPackage = JSON.parse(
    await readFile(path.join(cleanProject, "node_modules", "teamflow", "package.json"), "utf8"),
  );
  const installedPackageRoot = path.join(cleanProject, "node_modules", "teamflow");
  const installedCli = path.join(installedPackageRoot, "bin", "teamflow.js");
  const installedBase = path.join(installedPackageRoot, "runtime-assets", ".squad", "playbooks", "playbook-feature.md");
  const packedPaths = packResult[0].files.map((file) => file.path);
  assert.equal(installedPackage.private, true);
  assert.equal(Object.hasOwn(installedPackage, "publishConfig"), false);
  assert.ok(packedPaths.some((file) => file.startsWith("dist/")));
  assert.ok(packedPaths.some((file) => file.startsWith("runtime-assets/")));
  assert.ok(!packedPaths.some((file) => /^(src|test|scripts)\//u.test(file)));
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

  console.log(`Built and packed from an isolated temporary source, installed offline, and executed the teamflow npm shim (${packResult[0].filename}).`);
} finally {
  assert.equal(await readFile(ownerMarker, "utf8"), ownerMarkerContents, "Refusing to clean an unowned temporary package root");
  await rm(temporaryRoot, { recursive: true, force: true });
}
