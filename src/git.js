import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { UserError } from "./errors.js";
import { runCommand } from "./process.js";

let safetyEnvironment;
function safety() {
  if (safetyEnvironment) return safetyEnvironment;
  const root = mkdtempSync(path.join(os.tmpdir(), "teamflow-git-safety-")); const hooksPath = path.join(root, "hooks"); const globalConfig = path.join(root, "global.gitconfig");
  mkdirSync(hooksPath); writeFileSync(globalConfig, "", "utf8"); safetyEnvironment = { root, hooksPath, globalConfig }; process.once("exit", () => rmSync(root, { recursive: true, force: true })); return safetyEnvironment;
}
function environment(globalConfig) { const env = { ...process.env }; for (const key of Object.keys(env)) if (key.toUpperCase().startsWith("GIT_") || ["CURL_CA_BUNDLE", "SSL_CERT_DIR", "SSL_CERT_FILE", "SSH_ASKPASS"].includes(key.toUpperCase())) delete env[key]; return { ...env, GIT_CONFIG_GLOBAL: globalConfig, GIT_CONFIG_NOSYSTEM: "1", GIT_TERMINAL_PROMPT: "0" }; }

export class GitClient {
  constructor(runner = runCommand) { this.runner = runner; this.safety = safety(); }
  run(args, { cwd, action = "O comando Git falhou.", allowFailure = false } = {}) {
    const result = this.runner("git", ["-c", `core.hooksPath=${this.safety.hooksPath}`, "-c", "core.fsmonitor=false", ...args], { cwd, env: environment(this.safety.globalConfig) });
    if (result.error?.code === "ENOENT") throw new UserError("Git não foi encontrado. Instale-o e confirme que está no PATH.", { cause: result.error });
    if (result.error) throw new UserError(`${action}\n\n${result.error.message}`, { cause: result.error });
    if (result.status !== 0 && !allowFailure) throw new UserError(`${action}\n\n${(result.stderr || result.stdout || "Erro Git sem detalhes.").trim()}`);
    return result;
  }
  ensureAvailable() { this.run(["--version"], { action: "Não foi possível executar o Git." }); }
  pathExists(target) { return existsSync(target); }
  topLevel(directory) { return this.run(["-C", directory, "rev-parse", "--show-toplevel"], { action: `Checkout Git inválido: ${directory}` }).stdout.trim(); }
  remoteUrl(root) { return this.run(["-C", root, "remote", "get-url", "origin"], { action: `Remote origin inválido: ${root}` }).stdout.trim(); }
  status(root) { return this.run(["-C", root, "status", "--porcelain=v1", "--untracked-files=all"], { action: `Não foi possível verificar alterações em ${root}.` }).stdout; }
  operationInProgress(root) {
    const probe = this.run(["-C", root, "rev-parse", "-q", "--verify", "MERGE_HEAD"], { action: "", allowFailure: true });
    if (probe.status === 0) return true;
    const gitDir = this.run(["-C", root, "rev-parse", "--git-dir"], { action: `Não foi possível inspecionar ${root}.` }).stdout.trim();
    return ["rebase-merge", "rebase-apply", "CHERRY_PICK_HEAD", "REVERT_HEAD", "BISECT_LOG"].some((item) => existsSync(path.resolve(root, gitDir, item)));
  }
  cloneMirror(remote, destination) { this.run(["clone", "--mirror", "--no-recurse-submodules", "--", remote, destination], { action: `Não foi possível criar o cache Git de ${remote}.` }); }
  cloneCheckout(cache, remote, destination) { this.run(["clone", "--reference-if-able", cache, "--", cache, destination], { action: `Não foi possível criar checkout persistente em ${destination}.` }); this.run(["-C", destination, "remote", "set-url", "origin", remote], { action: "Não foi possível configurar o remote do checkout." }); }
  fetchBare(cache) { this.run(["--git-dir", cache, "fetch", "--prune", "origin"], { action: `Não foi possível sincronizar cache ${cache}.` }); }
  fetch(root) { this.run(["-C", root, "fetch", "--prune", "origin"], { action: `Não foi possível sincronizar checkout ${root}.` }); }
  defaultBranch(root) { const result = this.run(["-C", root, "symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"], { action: "", allowFailure: true }); return result.status === 0 ? result.stdout.trim().replace(/^origin\//u, "") : null; }
  addWorktree(root, destination, branch, startPoint) {
    const existing = this.run(["-C", root, "show-ref", "--verify", "--quiet", `refs/heads/${branch}`], { action: "", allowFailure: true });
    this.run(existing.status === 0 ? ["-C", root, "worktree", "add", "--", destination, branch] : ["-C", root, "worktree", "add", "-b", branch, "--", destination, startPoint], { action: `Não foi possível criar worktree ${destination}.` });
  }
}
