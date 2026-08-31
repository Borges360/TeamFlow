import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

function numericVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)/u.exec(value);
  assert.ok(match, `Invalid runtime version: ${value}`);
  return match.slice(1).map(Number);
}

function atLeast(actual, minimum) {
  for (let index = 0; index < 3; index += 1) {
    if (actual[index] !== minimum[index]) {
      return actual[index] > minimum[index];
    }
  }
  return true;
}

const nodeVersion = numericVersion(process.versions.node);
assert.ok(atLeast(nodeVersion, [22, 14, 0]), "Node.js 22.14.0 or newer is required");

const npmCli = process.env.npm_execpath;
assert.ok(npmCli, "npm_execpath is required to verify the npm runtime");
const npmResult = spawnSync(process.execPath, [npmCli, "--version"], {
  encoding: "utf8",
  shell: false,
  windowsHide: true,
});
assert.equal(npmResult.status, 0, npmResult.stderr || npmResult.error?.message);
const npmVersion = numericVersion(npmResult.stdout.trim());
assert.ok(atLeast(npmVersion, [11, 5, 1]), "npm 11.5.1 or newer is required");

console.log(`Runtime is compatible: Node ${process.versions.node}, npm ${npmResult.stdout.trim()}`);
