import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { PRODUCT, isCanonicalRepositoryUrl } from "../config.js";
import { UserError } from "../errors.js";
import { GitClient } from "../git.js";
import {
  assertClean,
  assertExpectedOrigin,
  assertReleaseOnOrigin,
  assertSafeGitConfig,
  installedRelease,
  sameDirectory,
} from "./shared.js";

async function destinationState(destination, fileSystem) {
  try {
    const stat = await fileSystem.stat(destination);
    if (!stat.isDirectory()) {
      return { exists: true, empty: false, directory: false };
    }
    const entries = await fileSystem.readdir(destination);
    return { exists: true, empty: entries.length === 0, directory: true };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { exists: false, empty: true, directory: true };
    }
    throw new UserError(`Não foi possível inspecionar o destino ${destination}.\n\n${error.message}`, { cause: error });
  }
}

async function checkWritable(destination, state, fileSystem) {
  const writablePath = state.exists ? destination : path.dirname(destination);
  if (!state.exists) {
    try {
      await fileSystem.mkdir(writablePath, { recursive: true });
    } catch (error) {
      throw new UserError(`Sem permissão para preparar o destino ${destination}.\n\n${error.message}`, { cause: error });
    }
  }
  try {
    await fileSystem.access(writablePath, fsConstants.W_OK);
  } catch (error) {
    throw new UserError(`Sem permissão de escrita em ${writablePath}.`, { cause: error });
  }
}

function existingInstallation(destination, git, product, isExpectedRepository) {
  let root;
  try {
    root = git.topLevel(destination);
  } catch {
    return null;
  }
  if (!sameDirectory(root, destination)) {
    return null;
  }
  assertSafeGitConfig(root, git);
  assertExpectedOrigin(root, git, isExpectedRepository);
  assertClean(root, git, "Instalação");
  const release = installedRelease(root, git);
  assertReleaseOnOrigin(root, git, release, product.repositoryUrl);
  return release;
}

export async function installCommand({
  args = [],
  cwd = process.cwd(),
  io = console,
  git = new GitClient(),
  fileSystem = fs,
  product = PRODUCT,
  isExpectedRepository = isCanonicalRepositoryUrl,
} = {}) {
  if (args.length > 1) {
    throw new UserError("Uso: teamflow install [diretório]", { exitCode: 2 });
  }

  const destination = path.resolve(cwd, args[0] ?? "teamflow");
  io.log(`${product.displayName} v${product.version}\n`);
  io.log(`Destino: ${destination}`);
  io.log("Validando pré-requisitos...");
  git.ensureAvailable();

  const state = await destinationState(destination, fileSystem);
  if (state.exists && !state.directory) {
    throw new UserError(`O destino existe e não é um diretório: ${destination}`);
  }

  if (state.exists && !state.empty) {
    const installed = existingInstallation(destination, git, product, isExpectedRepository);
    if (installed?.version === product.version) {
      io.log(`\n${product.displayName} já está instalado em v${product.version}.`);
      return { destination, status: "already-installed", version: product.version };
    }
    if (installed) {
      throw new UserError(
        `Uma instalação do ${product.displayName} v${installed.version} já existe em ${destination}.\n\nExecute "npx ${product.packageName}@latest update ${destination}".`,
      );
    }
    throw new UserError(
      `O destino não está vazio: ${destination}\n\nEscolha outro diretório ou mova os arquivos existentes. Nada foi sobrescrito.`,
    );
  }

  await checkWritable(destination, state, fileSystem);
  io.log(`Baixando ${product.tag} do repositório oficial...`);
  let temporaryDestination;
  try {
    temporaryDestination = await fileSystem.mkdtemp(
      path.join(path.dirname(destination), `.${path.basename(destination)}.teamflow-`),
    );
    git.clone(product.repositoryUrl, product.tag, temporaryDestination);
    const root = git.topLevel(temporaryDestination);
    if (!sameDirectory(root, temporaryDestination)) {
      throw new UserError("A raiz clonada não corresponde ao destino solicitado.");
    }
    assertSafeGitConfig(root, git);
    assertExpectedOrigin(root, git, isExpectedRepository);
    const installed = installedRelease(root, git);
    if (installed.version !== product.version) {
      throw new UserError(`A instalação resultou em ${installed.tag}, mas ${product.tag} era esperado.`);
    }
    assertReleaseOnOrigin(root, git, installed, product.repositoryUrl);
    assertClean(root, git, "Instalação");

    const promotionState = await destinationState(destination, fileSystem);
    if (promotionState.exists !== state.exists) {
      throw new UserError(
        `O destino mudou durante a instalação: ${destination}\n\nNada no destino foi removido; tente novamente após verificar o diretório.`,
      );
    }
    if (promotionState.exists) {
      if (!promotionState.directory || !promotionState.empty) {
        throw new UserError(
          `O destino deixou de estar vazio durante a instalação: ${destination}\n\nNada foi sobrescrito.`,
        );
      }
      await fileSystem.rmdir(destination);
    }
    await fileSystem.rename(temporaryDestination, destination);
    temporaryDestination = null;
  } catch (error) {
    if (temporaryDestination) {
      try {
        await fileSystem.rm(temporaryDestination, { recursive: true, force: true });
      } catch (cleanupError) {
        throw new UserError(
          `${error.message}\n\nTambém não foi possível remover o diretório temporário ${temporaryDestination}: ${cleanupError.message}`,
          { cause: error },
        );
      }
    }
    throw error;
  }

  io.log("\n✓ Repositório instalado");
  io.log(`✓ Origem e tag ${product.tag} validadas`);
  io.log(`✓ ${product.displayName} pronto em ${destination}`);
  return { destination, status: "installed", version: product.version };
}
