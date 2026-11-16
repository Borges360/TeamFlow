import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { main } from "../src/cli.js";
import { GitClient } from "../src/git.js";
import { captureIo } from "./helpers.js";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const releaseWorkflow = await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
const rootReadme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const localGuide = await readFile(new URL("../docs/local-teams-cli.md", import.meta.url), "utf8");
const distributionGuide = await readFile(new URL("../docs/npm-distribution.md", import.meta.url), "utf8");

test("CLI exposes workspace commands and no Git-install commands", async () => {
  const output = captureIo();
  assert.equal(await main(["--help"], { io: output.io }), 0);
  const help = output.stdout.join("\n");
  assert.match(help, /teamflow repository/u);
  assert.match(help, /teamflow demand/u);
  assert.doesNotMatch(help, /teamflow install|teamflow update/u);
});

test("version remains available without initializing storage", async () => {
  const output = captureIo();
  assert.equal(await main(["--version"], { io: output.io }), 0);
  assert.match(output.stdout.join("\n"), /^teamFlow 0\.1\.1$/u);
});

test("TeamFlow stays internal without a public npm publication or install path", () => {
  assert.equal(packageJson.private, true);
  assert.equal(Object.hasOwn(packageJson, "publishConfig"), false);
  assert.equal(packageJson.scripts["test:package"], "node scripts/package/test-packed-package.mjs");
  assert.doesNotMatch(releaseWorkflow, /^\s*run:\s*npm publish\b/mu);
  assert.doesNotMatch(releaseWorkflow, /^\s*registry-url:/mu);
  assert.doesNotMatch(releaseWorkflow, /^\s*environment:\s*npm\s*$/mu);
  assert.doesNotMatch(releaseWorkflow, /^\s*id-token:\s*write\s*$/mu);
  assert.match(releaseWorkflow, /^\s*run:\s*npm pack --dry-run\s*$/mu);
  assert.match(releaseWorkflow, /^\s*run:\s*npm run test:package\s*$/mu);
  for (const guide of [rootReadme, localGuide, distributionGuide]) {
    assert.doesNotMatch(guide, /^\s*npx\s+teamflow\b/mu);
    assert.doesNotMatch(guide, /^\s*npm\s+install\s+-g\s+teamflow\b/mu);
  }
});

test("GitClient isolates local repository operations from inherited Git settings", () => {
  const previous = new Map([
    ["GIT_SSL_NO_VERIFY", process.env.GIT_SSL_NO_VERIFY],
    ["GIT_CONFIG_PARAMETERS", process.env.GIT_CONFIG_PARAMETERS],
  ]);
  let invocation;
  process.env.GIT_SSL_NO_VERIFY = "1";
  process.env.GIT_CONFIG_PARAMETERS = "'http.sslVerify=false'";
  try {
    const git = new GitClient((command, args, options) => {
      invocation = { command, args, options };
      return { status: 0, stdout: "git version 2.0\n", stderr: "" };
    });
    git.ensureAvailable();
    assert.equal(invocation.command, "git");
    assert.ok(invocation.args.some((value) => value.startsWith("core.hooksPath=")));
    assert.ok(invocation.args.includes("core.fsmonitor=false"));
    assert.equal(invocation.options.env.GIT_CONFIG_NOSYSTEM, "1");
    assert.ok(invocation.options.env.GIT_CONFIG_GLOBAL);
    assert.equal(invocation.options.env.GIT_SSL_NO_VERIFY, undefined);
    assert.equal(invocation.options.env.GIT_CONFIG_PARAMETERS, undefined);
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
