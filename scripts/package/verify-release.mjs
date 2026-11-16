import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(
  await readFile(new URL("../../package.json", import.meta.url), "utf8"),
);
const suppliedTag = process.argv[2] ?? process.env.GITHUB_REF_NAME;

assert.ok(suppliedTag, "Provide a release tag, e.g. npm run release:verify -- v0.1.0");
assert.equal(suppliedTag, `v${packageJson.version}`, "release tag differs from package version");

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8", shell: false, windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.error?.message || `git ${args.join(" ")} failed`);
  return result.stdout.trim();
}

assert.equal(git(["cat-file", "-t", `refs/tags/${suppliedTag}`]), "tag", "release tag must be annotated");
assert.equal(
  git(["rev-parse", "HEAD^{commit}"]),
  git(["rev-parse", `refs/tags/${suppliedTag}^{commit}`]),
  "checked out commit differs from release tag",
);

console.log(`Release tag ${suppliedTag} matches package version ${packageJson.version}.`);
