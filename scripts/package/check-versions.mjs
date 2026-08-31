import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (file) => readFile(path.join(root, file), "utf8");

const packageJson = JSON.parse(await read("package.json"));
const squadYaml = await read("squad.yaml");
const manifestYaml = await read(".squad/manifest.yaml");

const squadVersion = /^\s{2}version:\s*["']?([^\s"']+)/mu.exec(squadYaml)?.[1];
const manifestVersion = /^template_version:\s*["']?([^\s"']+)/mu.exec(manifestYaml)?.[1];

assert.equal(packageJson.name, "teamflow", "package name must remain teamflow");
assert.match(packageJson.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u);
assert.equal(squadVersion, packageJson.version, "squad.yaml version differs from package.json");
assert.equal(manifestVersion, packageJson.version, ".squad/manifest.yaml version differs from package.json");
assert.equal(packageJson.publishConfig?.registry, "https://registry.npmjs.org/");
assert.equal(packageJson.publishConfig?.access, "public");
assert.equal(packageJson.publishConfig?.provenance, true);
assert.equal(packageJson.packageManager, "npm@11.9.0");
assert.deepEqual(
  packageJson.files,
  ["bin/", "src/", ".squad/", "AGENTS.md", "squad.yaml", "start.md", "docs/local-teams-cli.md"],
  "npm files allowlist changed unexpectedly",
);
assert.equal(Object.keys(packageJson.dependencies ?? {}).length, 0, "runtime dependencies are not allowed without review");

console.log(`Version metadata is consistent: ${packageJson.version}`);
