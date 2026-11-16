import { PRODUCT } from "./config.js";
import {
  catalogCommand,
  demandCommand,
  doctorCommand,
  playbookCommand,
  projectCommand,
  repositoryCommand,
  setupCommand,
  teamCommand,
  workflowCommand,
} from "./commands/local.js";
import { UserError } from "./errors.js";
import { TeamFlowStore, resolveTeamFlowHome } from "./storage.js";

const HELP = `teamFlow v${PRODUCT.version}

Uso:
  teamflow setup [--resume|--dry-run|--non-interactive --config <arquivo>]
  teamflow team <create|list|show|use|configure|agents>
  teamflow project <create|list|path|status|archive|upgrade-base|rollback-base>
  teamflow repository <add|attach|status|sync|detach> --project <project-id>
  teamflow demand <create|list|exec> --project <project-id>
  teamflow doctor
  teamflow catalog <add-repository|add-system|add-journey|import>
  teamflow playbook <list|show>
  teamflow workflow show <id>
  teamflow --version             Exibe a versão da CLI
  teamflow --help                Exibe esta ajuda

Opções globais:
  --home <path>   Sobrescreve TEAMFLOW_HOME`;

const COMMANDS = new Map([
  ["setup", setupCommand],
  ["team", teamCommand],
  ["project", projectCommand],
  ["repository", repositoryCommand],
  ["demand", demandCommand],
  ["doctor", doctorCommand],
  ["catalog", catalogCommand],
  ["playbook", playbookCommand],
  ["workflow", workflowCommand],
]);

function extractHome(argv) {
  const args = [];
  let home;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--home") {
      if (!argv[index + 1]) throw new UserError("--home exige um caminho.", { exitCode: 2 });
      home = argv[index + 1];
      index += 1;
    } else if (argv[index].startsWith("--home=")) {
      home = argv[index].slice("--home=".length);
    } else {
      args.push(argv[index]);
    }
  }
  return { args, home };
}

export async function main(argv, { io = console, commands = COMMANDS, env = process.env, ask, store: injectedStore } = {}) {
  try {
    const extracted = extractHome(argv);
    const [commandName, ...args] = extracted.args;
    if (!commandName || commandName === "--help" || commandName === "-h") {
      io.log(HELP);
      return 0;
    }
    if (commandName === "--version" || commandName === "-v") {
      io.log(`${PRODUCT.displayName} ${PRODUCT.version}`);
      return 0;
    }
    const command = commands.get(commandName);
    if (!command) {
      io.error(`Comando desconhecido: ${commandName}\n\n${HELP}`);
      return 2;
    }
    if (args.includes("--help") || args.includes("-h")) {
      io.log(HELP);
      return 0;
    }
    const store = injectedStore ?? new TeamFlowStore(resolveTeamFlowHome({ override: extracted.home, env }));
    await command({ args, io, store, ask });
    return 0;
  } catch (error) {
    if (error instanceof UserError) {
      io.error(`\n${error.message}`);
      return error.exitCode;
    }
    io.error(`\nFalha inesperada: ${error.message}`);
    return 1;
  }
}
