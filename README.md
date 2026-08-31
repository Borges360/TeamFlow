# Universal Agentic Squad Template

A reusable, vendor-neutral engineering template that tells development agents how to receive a demand, discover context, choose a workflow, delegate responsibilities, implement safely, review, test, produce evidence, and decide completion.

The repository is intentionally documentation and configuration first. Codex, Claude Code, Devin, and other products provide execution; this template provides the operating model.

MCP and A2A are not implemented in this version.

## Setup rápido com npx

O pacote npm expõe a CLI local `teamflow`. Ela cria times reutilizáveis e projetos isolados no diretório privado do usuário, sem fork, banco, serviço, credenciais ou clone de repositórios de produto.

Pré-requisitos: Node.js 22.14 ou superior, npm e Git disponíveis no `PATH`.

```bash
npx teamflow setup
```

No Windows, o local padrão é `%USERPROFILE%\.teamFlow`; no macOS e Linux, `$HOME/.teamFlow`. Use `TEAMFLOW_HOME` ou `--home <path>` para uma sobrescrita explícita.

O wizard toma no máximo quatro decisões principais: time, Git/commits, agents disponíveis e primeiro projeto opcional. Também há modos retomável, idempotente, dry-run e não interativo:

```bash
teamflow setup --resume
teamflow setup --dry-run
teamflow setup --non-interactive --config setup.json
```

Times são a fronteira de isolamento. Não existe projeto global: antes de listar, ativar ou alterar um projeto, selecione seu time.

```bash
teamflow team use comprovantes
teamflow project create filtros-comprovante
teamflow project activate filtros-comprovante
```

Consulte [CLI local, times e projetos](docs/local-teams-cli.md) para comandos, layout, snapshots, agents, exportação e política `ready_for_push`. Os comandos legados `install`/`update` continuam disponíveis para checkouts de releases Git imutáveis e nunca descartam alterações locais; veja [distribuição npm e segurança](docs/npm-distribution.md).

## What is universal and what is contextual

```text
.squad/  reusable and definitive operating model
    +
.project/ project/squad-specific example configuration
    =
effective instructions used by the active development agent
```

Everything in `.squad/` is designed to work for any engineering squad. Everything in `.project/` is explicitly marked `EXAMPLE` and reflects the initial squad context supplied for this template; replace it when adopting the template.

## Repository structure

```text
.
├── AGENTS.md                         universal entry point for development agents
├── squad.yaml                        small declarative index, not an executable config
├── .squad/
│   ├── agents/                       responsibility definitions
│   ├── workflows/                    feature, bugfix, incident, architecture, migration, performance
│   ├── playbooks/                    nine optional load-on-demand recipes
│   ├── policies/                     routing, context, delegation, gates, evidence, governance
│   ├── contracts/                    portable task/result/artifact/user-input contracts
│   ├── skills/                       load-on-demand engineering procedures
│   ├── templates/                    reusable delivery artifacts
│   ├── evals/                        specification-only routing, failure and context cases
│   ├── runtimes/                     native-runtime mappings, not adapters
│   └── registries/                   capability and workflow indexes
├── .project/                          contextual EXAMPLE for the initial squad
│   ├── catalog/                      example catalog pattern for 100+ repositories
│   ├── agent-profiles/               example specializations of universal roles
│   └── skills/                       example technology/domain procedures
├── docs/                              adoption and architecture guidance
└── scripts/                           optional deterministic maintenance checks only
```

## Como utilizar

O modelo é usado pelo agente de desenvolvimento que você já utiliza. Não há serviço para iniciar, banco para configurar ou runtime próprio. A CLI local organiza times e projetos, mas não executa a implementação.

Para o caminho completo — preparar um projeto existente, compor responsabilidades pela stack real, criar a primeira branch, mapear peças afetadas, seguir a pipeline e executar o piloto — consulte [start.md](start.md). A CLI é somente uma conveniência de distribuição; o modelo operacional continua independente de Node em runtime.

### 1. Preparar o contexto do projeto

Execute `teamflow setup`. A configuração reutilizável fica em `teams/<team-id>/` e cada implementação fica em `teams/<team-id>/projects/<project-id>/`, sempre fora do checkout de produto. Evolua o time ativo com `team configure`, `team agents` e `catalog`.

Comece por estes arquivos:

| Arquivo | O que informar |
|---|---|
| `.project/context.md` | missão, domínios e características da operação |
| `.project/squad.md` | responsabilidades, autoridades e especializações locais |
| `.project/repositories.md` e `catalog/` | sistemas, repositórios, ownership, APIs, eventos e dependências |
| `.project/constraints.md` | limites de acesso, produção, dados, mudança e aprovações |
| `.project/quality-profile.md`, `compliance.md` e `observability.md` | gates, controles, evidências, SLOs, alertas e padrões aplicáveis |

Não copie os mais de 100 repositórios para este template: catalogue seus metadados e deixe o agente descobrir somente os que a demanda exige.

### 2. Configurar o runtime nativo

Abra este diretório no Codex, Claude Code, Devin ou outro agente de desenvolvimento e configure o mecanismo nativo de instruções do projeto para ler o arquivo raiz `AGENTS.md`.

- No Codex, abra o workspace contendo `AGENTS.md`.
- Em outro runtime que use um nome próprio para instruções do projeto, crie apenas um ponteiro curto para `AGENTS.md`; não duplique nem converta a base em um adapter.
- Use os subagentes, tarefas, worktrees, terminal e revisão que o runtime já oferece. Se não houver delegação nativa, o agente executa as responsabilidades de forma sequencial.

As adaptações disponíveis estão em `.squad/runtimes/`.

### 3. Enviar uma demanda

Forneça a demanda normalmente, em linguagem natural. Exemplo:

```text
Implemente a nova funcionalidade de consulta de contratos.
```

Também é possível ser explícito quando desejado:

```text
Siga o AGENTS.md. Use o contexto efetivo do projeto ativo, carregue repositórios
progressivamente e registre artefatos apenas no diretório privado desse projeto.

Demanda: corrija a consulta de contratos que retorna dados desatualizados.
```

O segundo formato é opcional: um runtime corretamente configurado já lê `AGENTS.md`.

Playbooks são opcionais. Você pode escrever “Use o playbook feature”, referenciar `.squad/playbooks/playbook-feature.md` ou enviar somente a demanda em linguagem natural. O workflow continua sendo a fonte de verdade e o roteamento semântico funciona sem playbook. Formas como `/feature` são apenas atalhos textuais de prompt, não comandos nativos do shell/runtime. O catálogo também inclui o discovery técnico opcional.

### 4. O que o agente fará

```text
Demanda
  → triagem e workflow adequado
  → requisitos, contexto mínimo e change plan
  → descoberta da branch/pipeline do projeto
  → descoberta progressiva de sistemas e repositórios
  → arquitetura e revisões especializadas quando houver risco
  → implementação e testes com evidência
  → gates e revisão principal
  → resumo de entrega
```

Por exemplo, uma mudança apenas de interface pode ativar Software, Quality e Accessibility; uma alteração de API que consulta um sistema de registro pode também ativar Architecture, Security, Reliability, Data ou o perfil Mainframe. A seleção é feita por risco e impacto, não por uma cerimônia fixa.

### 5. Onde acompanhar o trabalho

Para cada demanda, os registros ficam em `%USERPROFILE%\.teamFlow\teams\<team-id>\projects\<project-id>\deliveries\` no Windows (ou no home equivalente), nunca no checkout de produto. Documentação permanente é gravada no repositório canônico ou em `docs/` do repositório proprietário.

O trabalho só deve ser apresentado como concluído quando os gates aplicáveis estiverem resolvidos e as evidências estiverem vinculadas. Se faltarem regra de negócio, autoridade, acesso ou contexto, o agente deve retornar `NEEDS_USER_INPUT` ou `BLOCKED` com a pergunta e o impacto.

Não há pacote Python, serviço, scheduler, banco de dados, máquina de estados ou runtime próprio envolvidos. A CLI npm gerencia apenas estado local e arquivos; o teamFlow continua sendo documentação e configuração consumidas pelo runtime nativo do agente.

## Adoption

1. Copy the template into the coordinating repository for a project or squad.
2. Replace every `.project/` file marked `EXAMPLE` with real, reviewed context.
3. Populate the repository catalog incrementally; do not paste repository contents into this repo.
4. Keep the universal `.squad/` base stable and evolve it through reviewed changes.
5. Add project skills only for procedures that truly differ from the base.
6. Configure the active runtime to honor `AGENTS.md` or reference it in its native instructions.
7. Pilot one controlled demand and review the generated local delivery bundle; do not commit it to release branches.

See [adoption guide](docs/adoption.md), [architecture](docs/architecture.md), and [runtime usage](docs/using-with-runtimes.md).

The replacement of the discarded Python platform is documented in the [implementation correction audit](docs/implementation-correction.md).

## Optional validation

The small validator checks required files, manifest paths, local Markdown links, and accidental reintroduction of platform code:

```text
python scripts/validate-template.py --mode template
```

Additional deterministic checks:

```text
python scripts/validate-evals.py
python scripts/validate-delivery.py deliveries/<demand-id>
python -m unittest discover -s scripts/tests -v
```

They are maintainers' checks, not the squad runtime, and do not prove semantic correctness or operational effectiveness.
