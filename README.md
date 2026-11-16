# TeamFlow

TeamFlow combines a reusable, vendor-neutral engineering workflow with a local CLI for organizing teams, projects, repositories and delivery workspaces.

**Manifest:** `teamflow` · **version:** `0.1.1` · **license:** `UNLICENSED`
**Distribution:** internal; A22 excludes TeamFlow from npm distribution in this plan. No public npm route or registry publication is configured.
**Runtime:** Node.js `>=22.14.0`; npm `>=11.5.1` (`npm@11.9.0` package manager metadata).

## English

### What it does

The repository provides portable agent instructions, workflows, contracts, policies, playbooks, templates and runtime guidance. The `teamflow` CLI keeps reusable team configuration and project workspaces in a private local home. It is a workflow and storage tool; it is not an agent runtime, hosted service, database, MCP server or A2A implementation.

### Install and run locally

TeamFlow is internal and has no npm distribution route in this plan. This README does not claim that `npx teamflow` or a global npm installation is available. For local development from this checkout, use the repository's Node.js/npm requirements:

```sh
npm ci --ignore-scripts
npm test
node bin/teamflow.js --help
node bin/teamflow.js --version
```

The CLI help is currently Portuguese. The documentation is in English and Brazilian Portuguese; the CLI has no language selector.

### Use

The root command `teamflow setup` opens the initial setup flow. Use `--dry-run` to inspect the proposed setup, or `--non-interactive --config <file>` with a configuration file. The CLI also provides `team`, `project`, `repository`, `demand`, `doctor`, `catalog`, `playbook` and `workflow` command groups. See [local teams and projects](docs/local-teams-cli.md) for the supported subcommands and their effects.

```sh
node bin/teamflow.js setup --dry-run
node bin/teamflow.js team show <team-id>
node bin/teamflow.js project path <project-id> --team <team-id>
node bin/teamflow.js repository status --project <project-id> --team <team-id>
node bin/teamflow.js demand list --project <project-id> --team <team-id>
```

Select the team explicitly in concurrent work. There is no global active project. A demand runtime starts only through the explicit `demand exec ... -- <runtime>` command.

### Configuration and state

The default home is `%USERPROFILE%\.teamFlow` on Windows and `$HOME/.teamFlow` on macOS/Linux. Set `TEAMFLOW_HOME` or pass `--home <path>` to choose another location. Team configuration, project metadata, repository bindings and delivery data are local files under that home. Existing product repositories are not copied into the template repository; repository and worktree commands operate only after the user selects them.

### Privacy and security

Treat the TeamFlow home as private: it can contain project descriptions, repository paths, demands and delivery metadata. Help and version do not initialize that home. Repository commands may access Git remotes when explicitly invoked; `demand exec` launches the selected native runtime. TeamFlow does not provide hosted storage or automatic publication. Use synthetic data when testing and review the selected project and remote before repository operations.

### Architecture, adoption and limits

Start with the [adoption guide](docs/adoption.md), [architecture](docs/architecture.md), [runtime instructions](docs/using-with-runtimes.md), or [start guide](start.md). `.squad/` is the reusable operating model; `.project/` contains contextual examples that must be replaced during adoption. MCP and A2A are not implemented in this version.

The release workflow validates the internal package on a release event, without publishing it to npm. Registry availability, provenance and a public artifact are not part of this plan.

### License

The product manifest is `UNLICENSED`; no license for the TeamFlow product is claimed. The bundled INTEIRO mark has a separate attribution/license notice at [docs/assets/INTEIRO-MARK-LICENSE.txt](docs/assets/INTEIRO-MARK-LICENSE.txt).

## Português (Brasil)

### O que faz

O repositório oferece instruções portáveis para agentes, workflows, contratos, políticas, playbooks, templates e orientações de runtime. A CLI `teamflow` mantém configuração reutilizável de times e workspaces de projetos em um diretório local privado. Ela organiza workflows e armazenamento; não é um runtime de agentes, serviço hospedado, banco de dados, servidor MCP ou implementação A2A.

### Instalação e execução local

TeamFlow é interno e não tem rota de distribuição npm neste plano. Este README não afirma que `npx teamflow` ou a instalação npm global estejam disponíveis. Para desenvolvimento local neste checkout, use os requisitos Node.js/npm do projeto:

```sh
npm ci --ignore-scripts
npm test
node bin/teamflow.js --help
node bin/teamflow.js --version
```

A ajuda da CLI está atualmente em português. A documentação está em inglês e português do Brasil; a CLI não tem seletor de idioma.

### Uso

O comando raiz `teamflow setup` inicia o fluxo de configuração. Use `--dry-run` para inspecionar a proposta ou `--non-interactive --config <arquivo>` com um arquivo de configuração. Também existem os grupos `team`, `project`, `repository`, `demand`, `doctor`, `catalog`, `playbook` e `workflow`. Consulte [times e projetos locais](docs/local-teams-cli.md) para os subcomandos e efeitos suportados.

```sh
node bin/teamflow.js setup --dry-run
node bin/teamflow.js team show <team-id>
node bin/teamflow.js project path <project-id> --team <team-id>
node bin/teamflow.js repository status --project <project-id> --team <team-id>
node bin/teamflow.js demand list --project <project-id> --team <team-id>
```

Selecione o time explicitamente em trabalhos concorrentes. Não existe projeto ativo global. Um runtime só é iniciado pelo comando explícito `demand exec ... -- <runtime>`.

### Configuração e dados

O diretório padrão é `%USERPROFILE%\.teamFlow` no Windows e `$HOME/.teamFlow` no macOS/Linux. Defina `TEAMFLOW_HOME` ou use `--home <path>` para escolher outro local. Configuração de times, metadados de projetos, vínculos com repositórios e dados de entregas são arquivos locais nesse diretório. Repositórios de produto não são copiados para o template; comandos de repositório e worktree só operam após seleção explícita.

### Privacidade e segurança

Trate o diretório TeamFlow como privado: ele pode conter descrições de projetos, caminhos de repositórios, demandas e metadados de entregas. `help` e `version` não inicializam esse diretório. Comandos de repositório podem acessar remotes Git quando chamados explicitamente; `demand exec` inicia o runtime nativo selecionado. TeamFlow não oferece armazenamento hospedado nem publicação automática. Use dados sintéticos nos testes e revise o projeto e o remote selecionados antes de operações de repositório.

### Arquitetura, adoção e limites

Comece pelo [guia de adoção](docs/adoption.md), [arquitetura](docs/architecture.md), [uso com runtimes](docs/using-with-runtimes.md) ou [guia de início](start.md). `.squad/` é o modelo operacional reutilizável; `.project/` contém exemplos contextuais que devem ser substituídos na adoção. MCP e A2A não estão implementados nesta versão.

O workflow valida o pacote interno em um evento de release, sem publicá-lo no npm. Disponibilidade de registry, provenance e artefato público não fazem parte deste plano.

### Licença

O manifesto do produto declara `UNLICENSED`; não se afirma uma licença para o TeamFlow. A marca INTEIRO incluída tem aviso separado de atribuição/licença em [docs/assets/INTEIRO-MARK-LICENSE.txt](docs/assets/INTEIRO-MARK-LICENSE.txt).
