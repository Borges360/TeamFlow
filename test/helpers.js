import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function runGit(args, cwd, { allowFailure = false } = {}) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });
  if (!allowFailure && (result.error || result.status !== 0)) {
    throw new Error(`git ${args.join(" ")} failed\n${result.error?.message ?? ""}\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

export async function createReleaseRepository() {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "teamflow-tests-"));
  const source = path.join(temporaryRoot, "source");
  await mkdir(source);
  runGit(["init", "--initial-branch=main"], source);
  runGit(["config", "user.name", "teamFlow tests"], source);
  runGit(["config", "user.email", "tests@teamflow.invalid"], source);

  await mkdir(path.join(source, "nested"));
  await writeFile(path.join(source, "nested", "info.txt"), "tracked directory\n", "utf8");
  await writeFile(path.join(source, "managed.txt"), "release 0.0.1\n", "utf8");
  runGit(["add", "managed.txt", "nested/info.txt"], source);
  runGit(["commit", "-m", "release 0.0.1"], source);
  runGit(["tag", "-a", "v0.0.1", "-m", "v0.0.1"], source);

  await writeFile(path.join(source, "managed.txt"), "release 0.1.0\n", "utf8");
  runGit(["add", "managed.txt"], source);
  runGit(["commit", "-m", "release 0.1.0"], source);
  runGit(["tag", "-a", "v0.1.0", "-m", "v0.1.0"], source);

  return {
    root: temporaryRoot,
    source,
    cleanup: () => rm(temporaryRoot, { recursive: true, force: true }),
  };
}

export function testProduct(repositoryUrl, version = "0.1.0") {
  return {
    displayName: "teamFlow",
    packageName: "teamflow",
    repositoryUrl,
    version,
    tag: `v${version}`,
  };
}

export function expectedLocalRepository(repositoryUrl) {
  const expected = path.resolve(repositoryUrl).toLowerCase();
  return (candidate) => path.resolve(candidate).toLowerCase() === expected;
}

export function captureIo() {
  const stdout = [];
  const stderr = [];
  return {
    io: {
      log: (message = "") => stdout.push(String(message)),
      error: (message = "") => stderr.push(String(message)),
    },
    stdout,
    stderr,
  };
}
