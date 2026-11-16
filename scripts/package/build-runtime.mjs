import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dist = path.join(root, "dist");
const assets = path.join(root, "runtime-assets");

async function copy(source, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, dereference: false });
}

await rm(dist, { recursive: true, force: true });
await rm(assets, { recursive: true, force: true });
await copy(path.join(root, "src"), dist);
await copy(path.join(root, "AGENTS.md"), path.join(assets, "AGENTS.md"));
await copy(path.join(root, "squad.yaml"), path.join(assets, "squad.yaml"));
await copy(path.join(root, ".squad"), path.join(assets, ".squad"));

// The checked-in manifest describes the development repository.  The installed
// base is intentionally narrower and must never claim development-only paths.
const runtimeManifest = `schema_version: "1.0"\ntemplate_version: ${(JSON.parse(await readFile(path.join(root, "package.json"), "utf8"))).version}\nentrypoint: AGENTS.md\nexecution_model: native-development-agent-runtime\nrequired_directories:\n  - .squad/agents\n  - .squad/workflows\n  - .squad/playbooks\n  - .squad/policies\n  - .squad/contracts\n  - .squad/skills\n  - .squad/templates\n  - .squad/runtimes\n  - .squad/registries\n  - .squad/evals\nrequired_files:\n  - AGENTS.md\n  - squad.yaml\n`;
await writeFile(path.join(assets, ".squad", "manifest.yaml"), runtimeManifest, "utf8");

const forbidden = new Set(["src", "test", "scripts"]);
for (const entry of await readdir(assets)) {
  if (forbidden.has(entry)) throw new Error(`Runtime assets unexpectedly include ${entry}`);
}
