import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { main } from "../src/cli.js";
import { assertExpectedOrigin, assertSafeGitConfig } from "../src/commands/shared.js";
import { isCanonicalRepositoryUrl } from "../src/config.js";
import { GitClient } from "../src/git.js";
import { compareSemver, newestReleaseTag, parseSemver } from "../src/version.js";
import { captureIo } from "./helpers.js";

test("strict SemVer parsing and comparison prevent ambiguous versions", () => {
  assert.deepEqual(parseSemver("0.1.0"), [0, 1, 0]);
  assert.equal(parseSemver("01.0.0"), null);
  assert.equal(parseSemver("1.0"), null);
  assert.equal(compareSemver("0.1.0", "0.0.1"), 1);
  assert.equal(compareSemver("1.0.0", "1.0.0"), 0);
  assert.equal(newestReleaseTag(["noise", "v0.1.0", "v0.0.1"]).tag, "v0.1.0");
});

test("only supported variants of the canonical GitHub origin are accepted", () => {
  assert.equal(isCanonicalRepositoryUrl("https://github.com/Borges360/TeamFlow.git"), true);
  assert.equal(isCanonicalRepositoryUrl("git@github.com:Borges360/TeamFlow.git"), true);
  assert.equal(isCanonicalRepositoryUrl("ssh://git@github.com/Borges360/TeamFlow"), true);
  assert.equal(isCanonicalRepositoryUrl("https://example.com/Borges360/TeamFlow.git"), false);
  assert.equal(isCanonicalRepositoryUrl("https://github.com/attacker/TeamFlow.git"), false);
  assert.equal(isCanonicalRepositoryUrl("http://github.com/Borges360/TeamFlow.git"), false);
});

test("invalid origins are rejected without leaking embedded credentials", () => {
  const secret = "TOKEN-SENTINEL-DO-NOT-LOG";
  assert.throws(
    () => assertExpectedOrigin(
      ".",
      { remoteUrl: () => `https://${secret}@github.com/attacker/TeamFlow.git` },
      () => false,
    ),
    (error) => {
      assert.match(error.message, /URL não foi incluída/u);
      assert.equal(error.message.includes(secret), false);
      return true;
    },
  );
});

test("unsafe Git config is rejected without leaking credential-bearing keys", () => {
  const secret = "CONFIG-CREDENTIAL-SENTINEL-DO-NOT-LOG";
  assert.throws(
    () => assertSafeGitConfig(
      ".",
      {
        unsafeLocalConfig: () => [
          `http.https://user:${secret}@example.invalid/.sslverify`,
          `credential.https://user:${secret}@example.invalid.helper`,
        ],
      },
    ),
    (error) => {
      assert.match(error.message, /2 configurações Git locais/u);
      assert.match(error.message, /nomes e valores foram omitidos/u);
      assert.equal(error.message.includes(secret), false);
      assert.equal(error.message.includes("example.invalid"), false);
      return true;
    },
  );
});

test("CLI exposes help, version and actionable unknown-command status", async () => {
  const help = captureIo();
  assert.equal(await main(["--help"], { io: help.io }), 0);
  assert.match(help.stdout.join("\n"), /teamflow install/u);

  const version = captureIo();
  assert.equal(await main(["--version"], { io: version.io }), 0);
  assert.match(version.stdout[0], /^teamFlow \d+\.\d+\.\d+$/u);

  const unknown = captureIo();
  assert.equal(await main(["launch"], { io: unknown.io }), 2);
  assert.match(unknown.stderr.join("\n"), /Comando desconhecido/u);
});

test("CI declares Linux, macOS and Windows CLI validation", async () => {
  const workflow = await readFile(new URL("../.github/workflows/validate.yml", import.meta.url), "utf8");
  assert.match(workflow, /ubuntu-latest, macos-latest, windows-latest/u);
  assert.match(workflow, /node-version: "22\.14\.0"/u);
});

test("npm allowlist ships the immutable squad base with the local CLI", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.ok(packageJson.files.includes(".squad/"));
  assert.ok(packageJson.files.includes("AGENTS.md"));
  assert.ok(packageJson.files.includes("docs/local-teams-cli.md"));
});

test("GitClient neutralizes global config, hooks and fsmonitor for every command", () => {
  let invocation;
  const previousSslBypass = process.env.GIT_SSL_NO_VERIFY;
  const previousConfigInjection = process.env.GIT_CONFIG_PARAMETERS;
  process.env.GIT_SSL_NO_VERIFY = "1";
  process.env.GIT_CONFIG_PARAMETERS = "'http.sslVerify=false'";
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
  if (previousSslBypass === undefined) delete process.env.GIT_SSL_NO_VERIFY;
  else process.env.GIT_SSL_NO_VERIFY = previousSslBypass;
  if (previousConfigInjection === undefined) delete process.env.GIT_CONFIG_PARAMETERS;
  else process.env.GIT_CONFIG_PARAMETERS = previousConfigInjection;
});
