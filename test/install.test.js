import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { installCommand } from "../src/commands/install.js";
import { UserError } from "../src/errors.js";
import { GitClient } from "../src/git.js";
import {
  captureIo,
  createReleaseRepository,
  expectedLocalRepository,
  runGit,
  testProduct,
} from "./helpers.js";

async function installFixture(fixture, destination, version = "0.1.0") {
  const output = captureIo();
  const result = await installCommand({
    args: [destination],
    cwd: fixture.root,
    io: output.io,
    product: testProduct(fixture.source, version),
    isExpectedRepository: expectedLocalRepository(fixture.source),
  });
  return { result, output };
}

test("clean install creates a deterministic checkout at the requested release", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  const { result, output } = await installFixture(fixture, destination);

  assert.equal(result.status, "installed");
  assert.equal(runGit(["describe", "--tags", "--exact-match"], destination).stdout.trim(), "v0.1.0");
  assert.equal(runGit(["status", "--porcelain"], destination).stdout, "");
  assert.match(output.stdout.join("\n"), /teamFlow pronto/u);
});

test("install accepts an existing empty directory", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "empty");
  await fs.mkdir(destination);
  const { result } = await installFixture(fixture, destination);
  assert.equal(result.status, "installed");
});

test("install never removes a file that appears in the destination during download", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "raced-destination");
  await fs.mkdir(destination);
  let destinationReads = 0;
  const racedFs = {
    ...fs,
    async readdir(directory) {
      if (path.resolve(directory) === path.resolve(destination)) {
        destinationReads += 1;
        if (destinationReads === 2) {
          await fs.writeFile(path.join(destination, "appeared.txt"), "preserve", "utf8");
        }
      }
      return fs.readdir(directory);
    },
  };

  await assert.rejects(
    () => installCommand({
      args: [destination],
      cwd: fixture.root,
      io: captureIo().io,
      product: testProduct(fixture.source),
      isExpectedRepository: expectedLocalRepository(fixture.source),
      fileSystem: racedFs,
    }),
    /deixou de estar vazio/u,
  );
  assert.equal(await fs.readFile(path.join(destination, "appeared.txt"), "utf8"), "preserve");
});

test("repeated install is idempotent for the same official release", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installFixture(fixture, destination);
  const { result, output } = await installFixture(fixture, destination);
  assert.equal(result.status, "already-installed");
  assert.match(output.stdout.join("\n"), /já está instalado/u);
});

test("repeated install reports a modified installation instead of a false success", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installFixture(fixture, destination);
  await fs.writeFile(path.join(destination, "local.txt"), "local", "utf8");

  await assert.rejects(() => installFixture(fixture, destination), /Instalação interrompida/u);
  assert.equal(await fs.readFile(path.join(destination, "local.txt"), "utf8"), "local");
});

test("install refuses a non-empty existing directory without overwriting it", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "consumer");
  await fs.mkdir(destination);
  const sentinel = path.join(destination, "keep.txt");
  await fs.writeFile(sentinel, "keep", "utf8");

  await assert.rejects(() => installFixture(fixture, destination), /destino não está vazio/u);
  assert.equal(await fs.readFile(sentinel, "utf8"), "keep");
});

test("install tells an older existing installation to use update", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installFixture(fixture, destination, "0.0.1");
  await assert.rejects(() => installFixture(fixture, destination), /update/u);
  assert.equal(runGit(["describe", "--tags", "--exact-match"], destination).stdout.trim(), "v0.0.1");
});

test("unavailable repository leaves no partial destination", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "partial");
  const missingSource = path.join(fixture.root, "missing-source");

  await assert.rejects(
    () => installCommand({
      args: [destination],
      cwd: fixture.root,
      io: captureIo().io,
      product: testProduct(missingSource),
      isExpectedRepository: () => true,
    }),
    /Não foi possível baixar/u,
  );
  await assert.rejects(fs.stat(destination), { code: "ENOENT" });
});

test("missing Git is reported before the destination is changed", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const git = new GitClient(() => ({
    status: null,
    stdout: "",
    stderr: "",
    error: Object.assign(new Error("missing"), { code: "ENOENT" }),
  }));
  const destination = path.join(fixture.root, "no-git");

  await assert.rejects(
    () => installCommand({ args: [destination], cwd: fixture.root, io: captureIo().io, git }),
    /Git não foi encontrado/u,
  );
  await assert.rejects(fs.stat(destination), { code: "ENOENT" });
});

test("permission failure is actionable and clone is not attempted", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  let cloned = false;
  const git = {
    ensureAvailable() {},
    clone() { cloned = true; },
  };
  const deniedFs = {
    ...fs,
    access: async () => { throw Object.assign(new Error("access denied"), { code: "EACCES" }); },
  };

  await assert.rejects(
    () => installCommand({
      args: [path.join(fixture.root, "denied")],
      cwd: fixture.root,
      io: captureIo().io,
      git,
      fileSystem: deniedFs,
    }),
    /Sem permissão de escrita/u,
  );
  assert.equal(cloned, false);
});

test("Git clone network-style errors remain visible and actionable", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const git = {
    ensureAvailable() {},
    clone() { throw new UserError("Não foi possível baixar a release. Falha de rede simulada."); },
  };
  await assert.rejects(
    () => installCommand({
      args: [path.join(fixture.root, "network")],
      cwd: fixture.root,
      io: captureIo().io,
      git,
    }),
    /Falha de rede simulada/u,
  );
});
