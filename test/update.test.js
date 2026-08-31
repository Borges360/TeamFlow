import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { installCommand } from "../src/commands/install.js";
import { updateCommand } from "../src/commands/update.js";
import { UserError } from "../src/errors.js";
import {
  captureIo,
  createReleaseRepository,
  expectedLocalRepository,
  runGit,
  testProduct,
} from "./helpers.js";

async function installAt(fixture, destination, version) {
  return installCommand({
    args: [destination],
    cwd: fixture.root,
    io: captureIo().io,
    product: testProduct(fixture.source, version),
    isExpectedRepository: expectedLocalRepository(fixture.source),
  });
}

async function updateAt(fixture, directory, version = "0.1.0", extra = {}) {
  const output = captureIo();
  const result = await updateCommand({
    args: [directory],
    cwd: fixture.root,
    io: output.io,
    product: testProduct(fixture.source, version),
    isExpectedRepository: expectedLocalRepository(fixture.source),
    ...extra,
  });
  return { result, output };
}

test("clean old release updates to the target annotated tag", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.0.1");
  const { result, output } = await updateAt(fixture, destination);

  assert.equal(result.status, "updated");
  assert.equal(runGit(["describe", "--tags", "--exact-match"], destination).stdout.trim(), "v0.1.0");
  assert.equal(runGit(["status", "--porcelain"], destination).stdout, "");
  assert.match(output.stdout.join("\n"), /atualizado para v0\.1\.0/u);
});

test("update discovers the installation root from a child directory", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.0.1");
  const child = path.join(destination, "nested");
  const { result } = await updateAt(fixture, child);
  assert.equal(path.resolve(result.root).toLowerCase(), path.resolve(destination).toLowerCase());
});

test("already current update is idempotent and does not fetch", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.1.0");
  const before = runGit(["rev-parse", "HEAD"], destination).stdout;
  const { result, output } = await updateAt(fixture, destination);
  assert.equal(result.status, "already-current");
  assert.equal(runGit(["rev-parse", "HEAD"], destination).stdout, before);
  assert.match(output.stdout.join("\n"), /já está atualizado/u);
});

test("tracked local modifications abort before update and are preserved", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.0.1");
  await fs.writeFile(path.join(destination, "managed.txt"), "custom\n", "utf8");

  await assert.rejects(() => updateAt(fixture, destination), /managed\.txt/u);
  assert.equal(await fs.readFile(path.join(destination, "managed.txt"), "utf8"), "custom\n");
});

test("untracked files abort before update and are preserved", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.0.1");
  const local = path.join(destination, "local.txt");
  await fs.writeFile(local, "local", "utf8");

  await assert.rejects(() => updateAt(fixture, destination), /local\.txt/u);
  assert.equal(await fs.readFile(local, "utf8"), "local");
});

test("ignored local files that collide with a future release are never overwritten", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  await fs.writeFile(path.join(fixture.source, ".gitignore"), "collision.txt\n", "utf8");
  runGit(["add", ".gitignore"], fixture.source);
  runGit(["commit", "-m", "release 0.1.1 ignores local collision"], fixture.source);
  runGit(["tag", "-a", "v0.1.1", "-m", "v0.1.1"], fixture.source);
  await fs.writeFile(path.join(fixture.source, "collision.txt"), "official\n", "utf8");
  runGit(["add", "--force", "collision.txt"], fixture.source);
  runGit(["commit", "-m", "release 0.2.0 tracks collision"], fixture.source);
  runGit(["tag", "-a", "v0.2.0", "-m", "v0.2.0"], fixture.source);

  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.1.1");
  const collision = path.join(destination, "collision.txt");
  await fs.writeFile(collision, "local ignored state\n", "utf8");

  await assert.rejects(() => updateAt(fixture, destination, "0.2.0"), /Arquivos locais ignorados colidem/u);
  assert.equal(await fs.readFile(collision, "utf8"), "local ignored state\n");
  assert.equal(runGit(["describe", "--tags", "--exact-match"], destination).stdout.trim(), "v0.1.1");
});

test("merge conflict state aborts without reset or clean", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.0.1");
  runGit(["switch", "-c", "local"], destination);
  await fs.writeFile(path.join(destination, "managed.txt"), "local branch\n", "utf8");
  runGit(["add", "managed.txt"], destination);
  runGit(["-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "-m", "local"], destination);
  runGit(["switch", "-c", "other", "v0.0.1"], destination);
  await fs.writeFile(path.join(destination, "managed.txt"), "other branch\n", "utf8");
  runGit(["add", "managed.txt"], destination);
  runGit(["-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "-m", "other"], destination);
  runGit(["merge", "local"], destination, { allowFailure: true });

  await assert.rejects(() => updateAt(fixture, destination), /Alterações locais foram detectadas/u);
  assert.match(runGit(["status", "--porcelain"], destination).stdout, /^UU /mu);
});

test("invalid repository origin is rejected before fetch", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.0.1");
  runGit(["remote", "set-url", "origin", "https://github.com/attacker/TeamFlow.git"], destination);

  await assert.rejects(() => updateAt(fixture, destination), /Instalação inválida/u);
});

test("missing target tag and network failures abort without changing HEAD", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.0.1");
  const before = runGit(["rev-parse", "HEAD"], destination).stdout;

  await assert.rejects(() => updateAt(fixture, destination, "0.2.0"), /tag anotada v0\.2\.0/u);
  assert.equal(runGit(["rev-parse", "HEAD"], destination).stdout, before);
});

test("accidental downgrade is refused", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.1.0");
  await assert.rejects(() => updateAt(fixture, destination, "0.0.1"), /Downgrade recusado/u);
  assert.equal(runGit(["describe", "--tags", "--exact-match"], destination).stdout.trim(), "v0.1.0");
});

test("custom commit without an exact release tag requires manual integration", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.0.1");
  await fs.writeFile(path.join(destination, "custom.txt"), "custom", "utf8");
  runGit(["add", "custom.txt"], destination);
  runGit(["-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "-m", "custom"], destination);

  await assert.rejects(() => updateAt(fixture, destination), /não está exatamente em uma tag/u);
});

test("custom commit with a local annotated SemVer tag is not treated as an official release", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.0.1");
  await fs.writeFile(path.join(destination, "custom.txt"), "custom", "utf8");
  runGit(["add", "custom.txt"], destination);
  runGit(["-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "-m", "custom"], destination);
  runGit(["-c", "user.name=test", "-c", "user.email=test@example.invalid", "tag", "-a", "v0.0.2", "-m", "local tag"], destination);
  const before = runGit(["rev-parse", "HEAD"], destination).stdout;

  await assert.rejects(() => updateAt(fixture, destination), /não foi encontrada no repositório oficial/u);
  assert.equal(runGit(["rev-parse", "HEAD"], destination).stdout, before);
});

test("unsafe repository-local Git execution configuration aborts update", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.0.1");
  runGit(["config", "core.hooksPath", path.join(destination, "hooks")], destination);

  await assert.rejects(() => updateAt(fixture, destination), /1 configuração Git local/u);
  assert.equal(runGit(["describe", "--tags", "--exact-match"], destination).stdout.trim(), "v0.0.1");
});

test("repository-local HTTP proxy and TLS overrides cannot redirect official tag validation", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.0.1");
  runGit(["config", "http.proxy", "http://127.0.0.1:9"], destination);
  runGit(["config", "http.sslVerify", "false"], destination);

  await assert.rejects(() => updateAt(fixture, destination), /2 configurações Git locais/u);
  assert.equal(runGit(["describe", "--tags", "--exact-match"], destination).stdout.trim(), "v0.0.1");
});

test("checkout failure restores the previous commit", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const root = path.join(fixture.root, "fake-install");
  await fs.mkdir(root);
  const calls = [];
  const fakeGit = {
    ensureAvailable() {},
    topLevel: () => root,
    remoteUrl: () => fixture.source,
    status: () => "",
    ignoredPaths: () => [],
    trackedPathsAt: () => [],
    unsafeLocalConfig: () => [],
    tagsAtHead: () => ["v0.0.1"],
    tagObjectType: () => "tag",
    resolveCommit: (_root, reference) => reference.includes("v0.1.0") ? "target-commit" : "previous-commit",
    remoteTagCommit: (_root, _repository, tag) => tag === "v0.1.0" ? "target-commit" : "previous-commit",
    currentCommit: () => "previous-commit",
    fetchTag() {},
    checkoutDetached(_root, reference) {
      calls.push(reference);
      if (reference.startsWith("refs/tags/")) {
        throw new UserError("Conflito de checkout simulado.");
      }
    },
  };

  await assert.rejects(
    () => updateAt(fixture, root, "0.1.0", { git: fakeGit }),
    /checkout de previous-commit foi restaurado/u,
  );
  assert.deepEqual(calls, ["refs/tags/v0.1.0", "previous-commit"]);
});

test("explicit simulated fetch failure leaves the current commit unchanged", async (t) => {
  const fixture = await createReleaseRepository();
  t.after(fixture.cleanup);
  const destination = path.join(fixture.root, "installed");
  await installAt(fixture, destination, "0.0.1");
  const before = runGit(["rev-parse", "HEAD"], destination).stdout;
  const baseGit = new (await import("../src/git.js")).GitClient();
  baseGit.fetchTag = () => { throw new UserError("Falha de rede simulada no fetch."); };

  await assert.rejects(() => updateAt(fixture, destination, "0.1.0", { git: baseGit }), /Falha de rede simulada/u);
  assert.equal(runGit(["rev-parse", "HEAD"], destination).stdout, before);
});
