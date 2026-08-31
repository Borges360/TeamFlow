import fs from "node:fs/promises";
import path from "node:path";
import { PRODUCT, isCanonicalRepositoryUrl } from "../config.js";
import { UserError } from "../errors.js";
import { GitClient } from "../git.js";
import { compareSemver } from "../version.js";
import {
  assertClean,
  assertExpectedOrigin,
  assertNoIgnoredCollisions,
  assertReleaseOnOrigin,
  assertSafeGitConfig,
  installedRelease,
} from "./shared.js";

async function assertDirectory(directory, fileSystem) {
  try {
    const stat = await fileSystem.stat(directory);
    if (!stat.isDirectory()) {
      throw new UserError(`O caminho não é um diretório: ${directory}`);
    }
  } catch (error) {
    if (error instanceof UserError) {
      throw error;
    }
    if (error.code === "ENOENT") {
      throw new UserError(`O diretório não existe: ${directory}`);
    }
    throw new UserError(`Não foi possível acessar ${directory}.\n\n${error.message}`, { cause: error });
  }
}

function rollback(root, previousCommit, git, originalError) {
  try {
    git.checkoutDetached(root, previousCommit);
    throw new UserError(
      `Atualização interrompida. O checkout de ${previousCommit} foi restaurado.\n\nMotivo: ${originalError.message}`,
      { cause: originalError },
    );
  } catch (rollbackError) {
    if (rollbackError instanceof UserError && rollbackError.cause === originalError) {
      throw rollbackError;
    }
    throw new UserError(
      `Atualização interrompida e o rollback automático também falhou.\n\nCommit anterior: ${previousCommit}\nMotivo original: ${originalError.message}\nRollback: ${rollbackError.message}`,
      { cause: originalError },
    );
  }
}

export async function updateCommand({
  args = [],
  cwd = process.cwd(),
  io = console,
  git = new GitClient(),
  fileSystem = fs,
  product = PRODUCT,
  isExpectedRepository = isCanonicalRepositoryUrl,
} = {}) {
  if (args.length > 1) {
    throw new UserError("Uso: teamflow update [diretório]", { exitCode: 2 });
  }

  const requestedDirectory = path.resolve(cwd, args[0] ?? ".");
  io.log(`${product.displayName} v${product.version}\n`);
  io.log("Verificando instalação...");
  git.ensureAvailable();
  await assertDirectory(requestedDirectory, fileSystem);
  const root = git.topLevel(requestedDirectory);
  assertSafeGitConfig(root, git);
  assertExpectedOrigin(root, git, isExpectedRepository);
  assertClean(root, git);

  const current = installedRelease(root, git);
  assertReleaseOnOrigin(root, git, current, product.repositoryUrl);
  io.log(`Versão atual: ${current.version}`);
  io.log(`Versão disponível: ${product.version}`);
  const comparison = compareSemver(current.version, product.version);
  if (comparison === 0) {
    io.log(`\n${product.displayName} já está atualizado.`);
    return { root, status: "already-current", version: current.version };
  }
  if (comparison > 0) {
    throw new UserError(
      `Downgrade recusado. A instalação v${current.version} é mais nova que a CLI v${product.version}.\n\nUse "npx ${product.packageName}@latest update".`,
    );
  }

  const previousCommit = git.currentCommit(root);
  io.log(`\nObtendo ${product.tag}...`);
  const targetRemoteCommit = git.remoteTagCommit(root, product.repositoryUrl, product.tag);
  if (!targetRemoteCommit) {
    throw new UserError(`A tag anotada ${product.tag} não existe no repositório oficial.`);
  }
  git.fetchTag(root, product.repositoryUrl, product.tag);
  if (git.tagObjectType(root, product.tag) !== "tag") {
    throw new UserError(
      `A tag ${product.tag} não é anotada. A atualização foi interrompida para proteger a origem da release.`,
    );
  }
  const targetLocalCommit = git.resolveCommit(root, `refs/tags/${product.tag}`);
  if (targetLocalCommit !== targetRemoteCommit) {
    throw new UserError(
      `A tag local ${product.tag} não corresponde à release oficial.\n\nLocal: ${targetLocalCommit}\nOficial: ${targetRemoteCommit}`,
    );
  }
  assertClean(root, git);
  assertNoIgnoredCollisions(root, git, `refs/tags/${product.tag}`);

  io.log("Atualizando...");
  try {
    git.checkoutDetached(root, `refs/tags/${product.tag}`);
    const expectedCommit = git.resolveCommit(root, `refs/tags/${product.tag}`);
    const actualCommit = git.currentCommit(root);
    if (actualCommit !== expectedCommit) {
      throw new UserError(`HEAD ${actualCommit} não corresponde à tag ${product.tag} (${expectedCommit}).`);
    }
    assertClean(root, git);
  } catch (error) {
    rollback(root, previousCommit, git, error);
  }

  io.log("\n✓ Repositório atualizado");
  io.log("✓ Nenhuma alteração local foi descartada");
  io.log(`✓ ${product.displayName} atualizado para v${product.version}`);
  return { root, status: "updated", version: product.version, previousCommit };
}
