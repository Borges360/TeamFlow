import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { UserError } from "./errors.js";
import { runCommand } from "./process.js";

let safetyEnvironment;

function gitSafetyEnvironment() {
  if (safetyEnvironment) {
    return safetyEnvironment;
  }
  const root = mkdtempSync(path.join(os.tmpdir(), "teamflow-git-safety-"));
  const hooksPath = path.join(root, "hooks");
  const globalConfig = path.join(root, "global.gitconfig");
  mkdirSync(hooksPath);
  writeFileSync(globalConfig, "", "utf8");
  safetyEnvironment = { root, hooksPath, globalConfig };
  process.once("exit", () => rmSync(root, { recursive: true, force: true }));
  return safetyEnvironment;
}

function sanitizedGitEnvironment(globalConfig) {
  const environment = { ...process.env };
  for (const key of Object.keys(environment)) {
    if (
      key.toUpperCase().startsWith("GIT_")
      || ["CURL_CA_BUNDLE", "SSL_CERT_DIR", "SSL_CERT_FILE", "SSH_ASKPASS"].includes(key.toUpperCase())
    ) {
      delete environment[key];
    }
  }
  environment.GIT_CONFIG_GLOBAL = globalConfig;
  environment.GIT_CONFIG_NOSYSTEM = "1";
  environment.GIT_TERMINAL_PROMPT = "0";
  return environment;
}

function commandDetail(result) {
  return (result.stderr || result.stdout || "Erro Git sem detalhes.").trim();
}

export class GitClient {
  constructor(runner = runCommand) {
    this.runner = runner;
    this.safety = gitSafetyEnvironment();
  }

  run(args, { cwd, action = "O comando Git falhou.", allowFailure = false } = {}) {
    const safeArgs = [
      "-c",
      `core.hooksPath=${this.safety.hooksPath}`,
      "-c",
      "core.fsmonitor=false",
      ...args,
    ];
    const result = this.runner("git", safeArgs, {
      cwd,
      env: sanitizedGitEnvironment(this.safety.globalConfig),
    });
    if (result.error?.code === "ENOENT") {
      throw new UserError(
        "Git não foi encontrado. Instale o Git, confirme que ele está no PATH e tente novamente.",
        { cause: result.error },
      );
    }
    if (result.error) {
      throw new UserError(`${action}\n\n${result.error.message}`, { cause: result.error });
    }
    if (result.status !== 0 && !allowFailure) {
      throw new UserError(`${action}\n\n${commandDetail(result)}`);
    }
    return result;
  }

  ensureAvailable() {
    this.run(["--version"], { action: "Não foi possível executar o Git." });
  }

  clone(repositoryUrl, tag, destination) {
    this.run(
      [
        "clone",
        "--branch",
        tag,
        "--depth",
        "1",
        "--no-recurse-submodules",
        "--",
        repositoryUrl,
        destination,
      ],
      { action: `Não foi possível baixar a release ${tag}. Verifique a rede e a disponibilidade do repositório.` },
    );
  }

  topLevel(directory) {
    return this.run(["-C", directory, "rev-parse", "--show-toplevel"], {
      action: `Nenhuma instalação Git válida foi encontrada em ${directory}.`,
    }).stdout.trim();
  }

  remoteUrl(root) {
    return this.run(["-C", root, "remote", "get-url", "origin"], {
      action: "A instalação não possui um remote 'origin' válido.",
    }).stdout.trim();
  }

  status(root) {
    return this.run(
      ["-C", root, "status", "--porcelain=v1", "--untracked-files=all"],
      { action: "Não foi possível verificar alterações locais." },
    ).stdout;
  }

  ignoredPaths(root) {
    return this.run(
      ["-C", root, "ls-files", "--others", "--ignored", "--exclude-standard", "-z"],
      { action: "Não foi possível inspecionar arquivos locais ignorados." },
    ).stdout.split("\0").filter(Boolean);
  }

  trackedPathsAt(root, reference) {
    return this.run(["-C", root, "ls-tree", "-r", "--name-only", "-z", reference], {
      action: `Não foi possível inspecionar os arquivos gerenciados em ${reference}.`,
    }).stdout.split("\0").filter(Boolean);
  }

  unsafeLocalConfig(root) {
    const keys = this.run(["-C", root, "config", "--local", "--name-only", "--list"], {
      action: "Não foi possível inspecionar a configuração Git local.",
    }).stdout.split(/\r?\n/u).map((line) => line.trim().toLowerCase()).filter(Boolean);
    const unsafe = [
      /^core\.(hookspath|fsmonitor|sshcommand)$/u,
      /^filter\..*\.(clean|smudge|process)$/u,
      /^url\..*\.insteadof$/u,
      /^http\./u,
      /^credential(?:\..*)?\..*$/u,
      /^remote\..*\.proxy$/u,
    ];
    return keys.filter((key) => unsafe.some((pattern) => pattern.test(key)));
  }

  tagsAtHead(root) {
    return this.run(["-C", root, "tag", "--points-at", "HEAD", "--list", "v*"], {
      action: "Não foi possível identificar a versão instalada.",
    }).stdout.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
  }

  tagObjectType(root, tag) {
    const result = this.run(["-C", root, "cat-file", "-t", `refs/tags/${tag}`], {
      action: `Não foi possível validar a tag ${tag}.`,
      allowFailure: true,
    });
    return result.status === 0 ? result.stdout.trim() : null;
  }

  currentCommit(root) {
    return this.resolveCommit(root, "HEAD");
  }

  resolveCommit(root, reference) {
    return this.run(["-C", root, "rev-parse", `${reference}^{commit}`], {
      action: `Não foi possível resolver ${reference} para um commit.`,
    }).stdout.trim();
  }

  remoteTagCommit(root, repositoryUrl, tag) {
    const result = this.run(
      ["-C", root, "ls-remote", "--tags", repositoryUrl, `refs/tags/${tag}`, `refs/tags/${tag}^{}`],
      { action: `Não foi possível validar ${tag} no repositório oficial.` },
    );
    const peeledRef = `refs/tags/${tag}^{}`;
    for (const line of result.stdout.split(/\r?\n/u)) {
      const [commit, reference] = line.trim().split(/\s+/u);
      if (reference === peeledRef) {
        return commit;
      }
    }
    return null;
  }

  fetchTag(root, repositoryUrl, tag) {
    this.run(
      ["-C", root, "fetch", "--no-recurse-submodules", "--no-tags", repositoryUrl, "tag", tag],
      { action: `Não foi possível obter a tag ${tag}. Verifique a rede e se a release existe.` },
    );
  }

  checkoutDetached(root, reference) {
    this.run(["-C", root, "checkout", "--detach", reference], {
      action: `Não foi possível aplicar ${reference}.`,
    });
  }
}
