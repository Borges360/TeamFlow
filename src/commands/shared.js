import path from "node:path";
import { UserError } from "../errors.js";
import { newestReleaseTag } from "../version.js";

export function assertExpectedOrigin(root, git, isExpectedRepository) {
  const remote = git.remoteUrl(root);
  if (!isExpectedRepository(remote)) {
    throw new UserError(
      "Instalação inválida. O remote origin não aponta para o repositório oficial do teamFlow.\n\nRevise o valor localmente com \"git remote get-url origin\"; a URL não foi incluída para evitar vazamento de credenciais.",
    );
  }
  return remote;
}

export function assertSafeGitConfig(root, git) {
  const unsafe = git.unsafeLocalConfig(root);
  if (unsafe.length > 0) {
    const count = unsafe.length;
    const description = count === 1 ? "configuração Git local" : "configurações Git locais";
    const capability = count === 1 ? "capaz" : "capazes";
    throw new UserError(
      `A instalação possui ${count} ${description} ${capability} de executar ou redirecionar comandos.\n\nRevise localmente com "git config --local --list"; nomes e valores foram omitidos para evitar vazamento de credenciais. Remova as configurações inseguras antes de continuar.`,
    );
  }
}

export function installedRelease(root, git) {
  const release = newestReleaseTag(git.tagsAtHead(root));
  if (!release) {
    throw new UserError(
      "A instalação não está exatamente em uma tag de release do teamFlow.\n\nPreserve seus commits e faça a integração manual com a nova tag.",
    );
  }
  if (git.tagObjectType(root, release.tag) !== "tag") {
    throw new UserError(
      `A tag ${release.tag} não é anotada. A atualização foi interrompida para proteger a origem da release.`,
    );
  }
  return release;
}

export function assertReleaseOnOrigin(root, git, release, repositoryUrl) {
  const localCommit = git.resolveCommit(root, `refs/tags/${release.tag}`);
  const remoteCommit = git.remoteTagCommit(root, repositoryUrl, release.tag);
  if (!remoteCommit) {
    throw new UserError(
      `A tag anotada ${release.tag} não foi encontrada no repositório oficial. A operação foi interrompida.`,
    );
  }
  if (localCommit !== remoteCommit) {
    throw new UserError(
      `A tag local ${release.tag} não corresponde à release oficial.\n\nLocal: ${localCommit}\nOficial: ${remoteCommit}\n\nPreserve seus commits e restaure a tag oficial antes de continuar.`,
    );
  }
}

export function dirtyPaths(statusOutput) {
  return statusOutput
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => line.length > 3 ? line.slice(3) : line)
    .map((line) => line.trim());
}

export function assertClean(root, git, operation = "Atualização") {
  const paths = dirtyPaths(git.status(root));
  if (paths.length > 0) {
    const formatted = paths.map((file) => `  ${file}`).join("\n");
    throw new UserError(
      `${operation} interrompida.\n\nAlterações locais foram detectadas:\n\n${formatted}\n\nFaça commit, stash ou reverta essas alterações antes de continuar.`,
    );
  }
}

export function assertNoIgnoredCollisions(root, git, targetReference) {
  const normalize = (value) => {
    const normalized = value.replaceAll("\\", "/").replace(/^\.\//u, "");
    return process.platform === "win32" ? normalized.toLowerCase() : normalized;
  };
  const ignored = git.ignoredPaths(root).map(normalize);
  const tracked = git.trackedPathsAt(root, targetReference).map(normalize);
  const collisions = ignored.filter((localPath) => tracked.some((trackedPath) => (
    localPath === trackedPath
    || localPath.startsWith(`${trackedPath}/`)
    || trackedPath.startsWith(`${localPath}/`)
  )));
  if (collisions.length > 0) {
    throw new UserError(
      `Atualização interrompida.\n\nArquivos locais ignorados colidem com a nova release:\n\n${collisions.map((file) => `  ${file}`).join("\n")}\n\nMova esses arquivos para fora da instalação e tente novamente. Nada foi sobrescrito.`,
    );
  }
}

export function sameDirectory(left, right) {
  const normalize = (value) => {
    const resolved = path.resolve(value).replace(/[\\/]+$/u, "");
    return process.platform === "win32" ? resolved.toLowerCase() : resolved;
  };
  return normalize(left) === normalize(right);
}
