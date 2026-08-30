# Universal Agentic Squad Template

A reusable, vendor-neutral engineering template that tells development agents how to receive a demand, discover context, choose a workflow, delegate responsibilities, implement safely, review, test, produce evidence, and decide completion.

The repository is intentionally documentation and configuration first. Codex, Claude Code, Devin, and other products provide execution; this template provides the operating model.

MCP and A2A are not implemented in this version.

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
│   ├── playbooks/                    eight load-on-demand developer recipes
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

O template é usado pelo agente de desenvolvimento que você já utiliza. Não há serviço para iniciar, banco para configurar ou CLI obrigatória.

Para o caminho completo — preparar um projeto existente, compor responsabilidades pela stack real, criar a primeira branch, mapear peças afetadas, seguir a pipeline e executar o piloto — consulte [start.md](start.md).

### 1. Preparar o contexto do projeto

Copie a base para o repositório coordenador da squad ou do projeto. Em seguida, substitua o conteúdo marcado como `EXAMPLE` em `.project/` por informações revisadas e rastreáveis.

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
Siga o AGENTS.md. Use o contexto de .project, carregue repositórios
progressivamente e registre os artefatos em deliveries/DEM-001.

Demanda: corrija a consulta de contratos que retorna dados desatualizados.
```

O segundo formato é opcional: um runtime corretamente configurado já lê `AGENTS.md`.

Use atalhos operacionais quando preferir: `/feature`, `/bugfix`, `/tests`, `/performance`, `/adr`, `/finops`, `/doc` ou `/refactor`. O texto completo de somente um playbook é carregado sob demanda; workspace, branch, pipeline e documentação seguem as políticas comuns.

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

Para cada demanda, o agente cria localmente `deliveries/<demand-id>/` no projeto adotante. O diretório é ignorado pelo Git e não segue para branches de release; `delivery-index.md` aponta para requisitos, contexto, tarefas, decisões, evidências, gates, revisão e resumo. Documentação permanente é gravada no repositório canônico ou em `docs/` do repositório proprietário.

O trabalho só deve ser apresentado como concluído quando os gates aplicáveis estiverem resolvidos e as evidências estiverem vinculadas. Se faltarem regra de negócio, autoridade, acesso ou contexto, o agente deve retornar `NEEDS_USER_INPUT` ou `BLOCKED` com a pergunta e o impacto.

Não há pacote Python, serviço, scheduler, banco de dados, máquina de estados, runtime próprio ou CLI obrigatória envolvidos.

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
