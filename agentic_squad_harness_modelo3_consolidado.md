# Documentação consolidada — Squad Agêntica Modelo 3


---

# 00 — Visão geral

## Objetivo

Construir uma squad agêntica de engenharia capaz de receber uma demanda, entender o requisito de negócio, levantar dúvidas, propor arquitetura, implementar, testar, validar performance, segurança, SRE e qualidade, e entregar evidências auditáveis.

O foco é o **Modelo 3 — Harness agnóstico + Orchestrator**:

```text
User Demand
    ↓
Demand Intake
    ↓
Workflow Engine + Orchestrator
    ↓
Task Router
    ↓
Claude / Codex / Devin / A2A / Local Runtime
    ↓
Artifacts + Evidence
    ↓
Gates
    ↓
Delivery
```

## O problema que este modelo resolve

Modelos simples de multi-agent prompting geralmente colocam várias personas no mesmo contexto. Isso é frágil para projetos grandes porque aumenta custo, cria poluição de contexto, dificulta auditoria e reduz controle sobre quem decide, quem revisa e quais evidências sustentam a entrega.

O harness agnóstico resolve isso separando:

- **Workflow**: processo determinístico.
- **Agent**: responsabilidade especializada.
- **Runtime**: mecanismo de execução substituível.
- **Artifact**: estado persistente.
- **Gate**: critério formal de avanço.
- **Policy**: regra de governança.
- **Evidence**: prova verificável.

## Fundamento técnico da proposta de base universal + overlays

A sugestão de manter uma **base universal reutilizável** e documentações/configurações específicas por projeto tem fundamento técnico quando tratada como prática de plataforma, não como “um prompt universal”. Ela combina padrões consolidados:

1. **Docs as Code**: documentação versionada, revisada e publicada como código.
2. **GitOps / configuração declarativa**: estado desejado versionado e auditável.
3. **Backstage Software Catalog**: modelagem de domínios, sistemas, componentes, APIs, recursos e ownership.
4. **Policy-as-Code com OPA**: regras de governança aplicadas por máquina.
5. **OpenTelemetry**: rastreabilidade de execuções distribuídas.
6. **MCP/A2A**: protocolos para ferramenta e interoperabilidade entre agentes.

Não existe, hoje, um padrão universal único e maduro chamado “documentação universal de squad agêntica”. A proposta aqui é uma síntese arquitetural fundamentada em padrões já aceitos de plataforma e engenharia.

## Princípios do modelo

```text
Agents own responsibilities.
Skills own knowledge.
Workflows own process.
Artifacts own state.
Gates own quality progression.
Policies own governance.
Adapters own vendor differences.
Runtimes provide execution.
Orchestrator owns routing and decisions.
```

## Quando usar este modelo

Use o Modelo 3 quando houver:

- múltiplos repositórios;
- necessidade de auditoria;
- governança enterprise;
- preocupação com lock-in;
- diversidade de ferramentas e vendors;
- necessidade de gates de qualidade;
- projetos regulados;
- escala organizacional com várias squads.

Não use como primeira opção para automações pequenas e pontuais. Nesses casos, um workflow simples no Claude Code, Codex ou Devin pode ser suficiente.


## Referências principais

- Anthropic — Managed Agents / Multi-agent: https://platform.claude.com/docs/en/managed-agents/multi-agent
- Anthropic Engineering — Managed Agents meta-harness: https://www.anthropic.com/engineering/managed-agents
- Claude Code — Subagents: https://code.claude.com/docs/en/subagents
- Claude Code — Context window: https://code.claude.com/docs/en/context-window
- Anthropic — Skills, hooks, rules, subagents: https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more
- OpenAI Agents SDK — Multi-agent orchestration: https://openai.github.io/openai-agents-python/multi_agent/
- OpenAI Agents SDK — Handoffs: https://openai.github.io/openai-agents-python/handoffs/
- OpenAI — Unlocking the Codex harness: https://openai.com/index/unlocking-the-codex-harness/
- OpenAI Codex SDK: https://github.com/openai/codex/blob/main/sdk/python/README.md
- Devin — AGENTS.md: https://docs.devin.ai/onboard-devin/agents-md
- Devin — Playbooks: https://docs.devin.ai/pt-BR/product-guides/creating-playbooks
- A2A Specification: https://a2a-protocol.org/latest/specification/
- Google Developers Blog — A2A announcement: https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/
- MCP Specification: https://modelcontextprotocol.io/specification/2026-07-28
- MCP Tools: https://modelcontextprotocol.io/specification/2026-07-28/server/tools
- MCP Resources: https://modelcontextprotocol.io/specification/2026-07-28/server/resources
- Backstage System Model: https://backstage.io/docs/features/software-catalog/system-model/
- Backstage Descriptor Format: https://backstage.io/docs/features/software-catalog/descriptor-format/
- Backstage Technical Overview: https://backstage.io/docs/overview/technical-overview/
- Open Policy Agent Docs: https://openpolicyagent.org/docs
- Open Policy Agent Policy Language: https://openpolicyagent.org/docs/policy-language
- OpenTelemetry Docs: https://opentelemetry.io/docs/
- OpenTelemetry Context Propagation: https://opentelemetry.io/docs/concepts/context-propagation/
- Temporal Workflow Execution: https://docs.temporal.io/workflows
- Google SRE Book: https://sre.google/sre-book/table-of-contents/
- SWE-agent paper: https://arxiv.org/abs/2405.15793
- SWE-bench Verified: https://www.swebench.com/verified.html
- MetaGPT paper: https://arxiv.org/abs/2308.00352
- OpenHands paper: https://arxiv.org/abs/2407.16741
- AFlow paper: https://proceedings.iclr.cc/paper_files/paper/2025/hash/5492ecbce4439401798dcd2c90be94cd-Abstract-Conference.html


---

# 01 — Modelo de domínio

O domínio da squad agêntica deve ser independente de fornecedor. O harness não deve falar em “Claude agent” ou “Codex thread” como conceitos centrais. Ele deve falar em entidades portáveis.

## Entidades principais

### Agent

Representa uma responsabilidade.

Exemplos:

- `requirement-analyst`
- `solution-architect`
- `software-engineer`
- `quality-engineer`
- `security-engineer`
- `performance-engineer`
- `reliability-engineer`
- `principal-reviewer`

Agente não deve representar tecnologia. `Java`, `Kafka`, `PostgreSQL` e `Kubernetes` devem ser tratados como skills/capabilities.

### Skill

Representa conhecimento ou procedimento carregável sob demanda.

Exemplos:

- `java-performance`
- `distributed-systems`
- `threat-modeling`
- `postgres-review`
- `observability`
- `incident-analysis`

### Task

Unidade formal de trabalho.

Campos mínimos:

```yaml
task:
  id: TASK-123
  type: architecture-review
  objective: Avaliar arquitetura proposta.
  assigned_capability: architecture-design
  inputs:
    - artifact://requirements/REQ-10
  outputs:
    - artifact://architecture/ARCH-10
  blocking: true
```

### Artifact

Estado persistente produzido ou consumido pelos agentes.

Exemplos:

- `requirements.md`
- `open-questions.md`
- `architecture.md`
- `adr-001.md`
- `security-review.md`
- `performance-review.md`
- `qa-report.md`
- `final-review.md`

### Evidence

Prova verificável.

Exemplos:

- comando executado;
- resultado de testes;
- benchmark;
- relatório de profiling;
- trace;
- logs;
- diff;
- link para PR;
- saída de scanner.

### Workflow

DAG declarativo que controla ordem, dependências, paralelismo e gates.

### Gate

Critério objetivo para avanço.

Exemplo:

```yaml
gate:
  id: production-readiness
  required:
    - tests.pass == true
    - security.high_findings == 0
    - observability.has_sli == true
    - rollback.defined == true
```

### Runtime

Mecanismo que executa agentes.

Exemplos:

- Claude Managed Agent
- Claude Code Subagent
- Codex Thread
- Devin Session
- A2A Remote Agent
- Local LLM

### Adapter

Tradução entre o contrato interno e o runtime específico.

```text
Internal Task
    ↓
Claude Adapter / Codex Adapter / Devin Adapter / A2A Adapter
    ↓
Runtime-specific execution
```

## Invariantes

1. Agentes não controlam o estado global do workflow.
2. Agentes podem solicitar trabalho; apenas o orchestrator cria trabalho.
3. Gates, e não agentes, avançam o workflow.
4. Estado vive em artifacts/evidence, não no histórico do chat.
5. Runtimes são substituíveis.
6. Claims exigem evidência.
7. Revisores obrigatórios não podem ser pulados.
8. Delegação tem limites de profundidade, fan-out e orçamento.


---

# 02 — Arquitetura do harness agnóstico

## Visão lógica

```text
                    User / Product / Jira
                             │
                             ▼
                       Demand Intake
                             │
                             ▼
                    Requirement Agent
                             │
                             ▼
                    Artifact Store
                             │
                             ▼
                    Workflow Engine
                    /                                /                         Deterministic Rules     LLM Planner
                  \                /
                   \              /
                    ▼            ▼
                       Task DB / Queue
                             │
                             ▼
                         Task Router
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
           Claude          Codex           Devin
           Adapter         Adapter         Adapter
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                     Runtime Execution
                             │
                             ▼
                    Artifacts + Evidence
                             │
                             ▼
                           Gates
                             │
                      PASS / FAIL / BLOCK
```

## Componentes

### Demand Intake

Recebe uma solicitação humana ou de ferramenta. A primeira obrigação é registrar a demanda original sem alteração.

### Requirement Agent

Extrai:

- objetivo de negócio;
- atores;
- comportamento esperado;
- critérios de aceite;
- restrições;
- NFRs;
- riscos;
- lacunas;
- perguntas bloqueantes.

### Workflow Engine

Controla o DAG e os estados:

```text
PENDING → READY → RUNNING → COMPLETED
                    ├────→ FAILED
                    └────→ NEEDS_USER_INPUT
```

### LLM Planner

Usado apenas quando há ambiguidade real:

- decomposição de trabalho;
- classificação de risco;
- escolha de especialistas;
- síntese de alternativas.

O fluxo principal deve ser majoritariamente determinístico.

### Task Router

Escolhe runtime e agente com base em:

- capability;
- custo;
- latência;
- independência de revisão;
- contexto necessário;
- ferramentas disponíveis;
- permissões;
- criticidade.

### Artifact Store

Pode começar no filesystem/Git e evoluir para banco ou object store.

### Gate Engine

Executa validações de qualidade e governança. Pode usar OPA/Rego para regras formais.

## Por que não deixar o LLM orquestrar tudo?

Porque orquestração exige propriedades de sistemas distribuídos: retries, idempotência, timeout, auditoria, controle de estado, orçamento e rastreabilidade. LLMs são úteis para julgamento e síntese, mas o estado do processo deve ser controlado por código.


---

# 03 — Configuração universal e overlays por projeto

## Objetivo

Criar uma base reutilizável de squad agêntica e permitir adaptações por projeto, domínio, tribo, sistema ou linha de negócio.

Essa proposta é tecnicamente defensável quando tratada como:

- documentação como código;
- configuração declarativa;
- plataforma interna;
- catálogo de software;
- policy-as-code;
- overlays versionados.

## Estrutura proposta

```text
agentic-squad-platform/
├── AGENTS.md
├── squad.yaml
├── runtime.yaml
│
├── .squad/
│   ├── base/
│   │   ├── agents/
│   │   ├── skills/
│   │   ├── workflows/
│   │   ├── contracts/
│   │   └── policies/
│   │
│   ├── overlays/
│   │   ├── bank-core/
│   │   ├── loans/
│   │   ├── payments/
│   │   ├── cards/
│   │   └── fraud/
│   │
│   └── registry/
│       ├── capabilities.yaml
│       ├── runtimes.yaml
│       └── tools.yaml
│
└── adapters/
    ├── claude/
    ├── codex/
    ├── devin/
    └── a2a/
```

## Base universal

Contém o que é comum a todas as squads:

- agentes padrão;
- contratos;
- workflow templates;
- gates mínimos;
- políticas corporativas;
- skills comuns;
- taxonomia de riscos;
- formatos de evidência;
- padrões de perguntas ao usuário.

## Overlay por projeto

Contém o que é específico:

- repositórios;
- owners;
- domínio de negócio;
- criticidade;
- dados sensíveis;
- dependências;
- arquitetura atual;
- SLAs/SLOs;
- ferramentas autorizadas;
- runtimes permitidos;
- exceções de governança;
- compliance aplicável.

## Estratégia de composição

O harness calcula a configuração efetiva assim:

```text
base
  + enterprise overlay
  + domain overlay
  + project overlay
  + task overrides approved by policy
  = effective squad configuration
```

Exemplo:

```yaml
extends:
  - .squad/base
  - .squad/overlays/bank-enterprise
  - .squad/overlays/payments

project:
  id: pix-receipts
  repositories:
    - mobile-bff
    - receipt-core
    - receipt-renderer
  criticality: high
  data_classification: confidential
```

## Regras importantes

1. A base deve evoluir por PR, com changelog.
2. Overlays não podem reduzir gates obrigatórios sem exceção aprovada.
3. Configuração efetiva deve ser materializada para auditoria.
4. Cada execução deve registrar versão da base, overlay e políticas usadas.
5. O repositório da plataforma não deve depender de Claude/Codex/Devin como fonte de verdade.

## Por que isso escala para enterprise?

Empresas grandes precisam diferenciar padrões corporativos de variações locais. O modelo base + overlay permite padronização sem impedir adaptação. A analogia é a mesma de GitOps/Kubernetes/Kustomize/Helm/Backstage: uma base declarativa com customizações específicas por ambiente, domínio ou aplicação.


---

# 04 — Workflows adaptativos

## Visão

A squad deve escolher o workflow conforme o tipo de demanda e risco. Nem toda tarefa precisa passar pela squad inteira.

## Tipos de workflow

### Feature

```text
Demand → Requirements → Architecture → Risk Reviews → Implementation → QA → Principal Review → Delivery
```

### Bugfix

```text
Demand → Reproduction → Root Cause → Fix → Regression Tests → Review → Delivery
```

### Incidente

```text
Incident Intake → Timeline → Impact → Mitigation → Root Cause → Corrective Actions → Postmortem
```

### Arquitetura

```text
Problem Statement → Options → Trade-offs → Specialist Reviews → ADR → Decision Gate
```

### Migração grande

```text
Inventory → Dependency Map → Migration Strategy → Batch Plan → Risk Review → Execution Waves → Validation
```

### Auditoria de performance

```text
Baseline → Hypotheses → Profiling → Benchmark → Recommendations → Regression Guard
```

## Risk routing

Exemplo de classificação:

```yaml
risk:
  security: high
  performance: medium
  consistency: high
  reliability: high
  regulatory: medium
  migration: low
```

A partir disso:

```yaml
activate_agents:
  - security-engineer
  - reliability-engineer
  - data-consistency-reviewer
```

## Quando perguntar ao usuário

O agente pode classificar lacunas como:

```yaml
unknown:
  type: business_rule
  severity: blocking
  assumption_allowed: false
```

Se houver lacuna bloqueante:

```text
Workflow → NEEDS_USER_INPUT → BLOCKED
```

O fluxo só continua após resposta humana ou obtenção da informação por ferramenta confiável.

## Delegação dinâmica

Agentes não chamam diretamente outros agentes. Eles solicitam trabalho:

```yaml
requested_task:
  capability: performance-analysis
  reason: arquitetura introduz processamento síncrono no caminho crítico
  blocking: true
```

O orchestrator valida política, orçamento e profundidade antes de criar a tarefa.


---

# 05 — Escala enterprise para mais de 100 repositórios

## Problema

Em empresas como grandes bancos, um sistema de negócio pode depender de dezenas ou centenas de repositórios: BFFs, microserviços, jobs, libs, pipelines, IaC, schemas, mobile, frontends, data pipelines, observabilidade e documentação.

A squad agêntica não pode simplesmente pedir ao runtime para “ler tudo”. Ela precisa de inventário, catálogo, roteamento e montagem seletiva de contexto.

## Camadas necessárias

### 1. Catálogo de software

Use um modelo similar ao Backstage:

```text
Domain
  └── System
        ├── Component
        ├── API
        ├── Resource
        └── Owner
```

Exemplo:

```yaml
system: receipts
owner: core-bank-receipts
components:
  - receipt-bff
  - receipt-core
  - receipt-renderer
apis:
  - receipt-api
resources:
  - mongodb-receipts
  - kafka-receipt-events
```

### 2. Grafo de dependências

O harness precisa saber:

- quem chama quem;
- APIs expostas e consumidas;
- tópicos Kafka/SNS/SQS;
- bancos e tabelas/collections;
- contratos OpenAPI/AsyncAPI/Proto;
- ownership;
- criticidade;
- SLOs;
- dados sensíveis.

### 3. Context Assembler

Para cada task, montar um pacote mínimo:

```yaml
context_bundle:
  mandatory_artifacts:
    - requirements.md
    - architecture.md
  repositories:
    include:
      - receipt-bff
      - receipt-core
    exclude:
      - legacy-archive
  files:
    max: 80
  tokens:
    max: 30000
```

### 4. Indexação e retrieval

Para 100+ repositórios, é necessário indexar:

- metadados de catálogo;
- documentação;
- APIs;
- dependências;
- ownership;
- ADRs;
- incidentes;
- testes;
- módulos relevantes.

### 5. Scoping por blast radius

Toda demanda deve estimar impacto:

```yaml
blast_radius:
  repositories: 8
  systems: 2
  domains: 1
  customer_impact: high
  regulatory_impact: medium
```

### 6. Governança enterprise

Inclui:

- approval gates;
- segregation of duties;
- audit log;
- evidências de execução;
- política de dados sensíveis;
- runtime permitido por classificação de dados;
- rastreabilidade até Jira/PR/incident.

## Exemplo de fluxo enterprise

```text
Demand
  ↓
Catalog lookup
  ↓
Dependency graph expansion
  ↓
Blast radius analysis
  ↓
Context bundle generation
  ↓
Risk-based agent activation
  ↓
Execution across selected repos
  ↓
Evidence collection
  ↓
Governance gates
```

## Boas práticas

1. Nunca usar todos os repositórios como contexto inicial.
2. Usar catálogo e grafo para reduzir escopo.
3. Exigir ownership explícito por componente.
4. Materializar a configuração efetiva de cada execução.
5. Separar leitura de escrita por permissões de agente.
6. Usar ambientes isolados para execução de código.
7. Fazer reviewer em runtime diferente quando possível.
8. Registrar trace distribuído da execução agentic.


---

# 06 — Governança, gates e políticas

## Objetivo

Transformar recomendações em regras verificáveis.

## Tipos de gate

### Requirement Gate

Bloqueia arquitetura se houver lacuna crítica.

```yaml
required:
  - business_goal
  - affected_users
  - acceptance_criteria
  - critical_nfrs
```

### Architecture Gate

Exige:

- alternativas;
- trade-offs;
- ADR;
- modelo de dados;
- falhas e mitigação;
- observabilidade;
- rollout/rollback.

### Security Gate

Exige:

- threat model;
- dados sensíveis classificados;
- autenticação/autorização;
- secrets;
- dependências;
- vulnerabilidades high/critical zeradas ou excepcionadas.

### Quality Gate

Exige:

- testes unitários;
- integração;
- contrato;
- regressão;
- concorrência quando aplicável;
- cobertura mínima quando definida por política.

### Production Readiness Gate

Exige:

- SLO/SLI;
- métricas;
- logs estruturados;
- traces;
- alertas;
- rollback;
- runbook;
- capacity plan.

## Policy-as-Code

Use OPA/Rego ou mecanismo equivalente para decisões formais:

```rego
package squad.gates

default allow = false

allow if {
  input.tests.pass == true
  input.security.high_findings == 0
  input.observability.has_sli == true
  input.rollback.defined == true
}
```

## Exceções

Exceções devem ser dados versionados:

```yaml
exception:
  id: EXC-2026-001
  gate: security-high-finding
  reason: falso positivo aprovado pelo AppSec
  owner: appsec-team
  expires_at: 2026-12-31
```

## Auditoria mínima

Cada execução deve registrar:

- versão da base da squad;
- overlay usado;
- runtimes acionados;
- ferramentas chamadas;
- agentes ativados;
- tarefas criadas;
- perguntas ao usuário;
- gates aprovados/reprovados;
- evidências;
- decisões e ADRs.


---

# 07 — Runtimes, adapters, MCP e A2A

## Runtime abstraction

O domínio deve usar uma interface genérica:

```go
type AgentRuntime interface {
    Start(ctx Context, task Task) (Execution, error)
    Send(executionID string, message Message) error
    Status(executionID string) (Status, error)
    Result(executionID string) (Result, error)
    Cancel(executionID string) error
}
```

## Adapters

### Claude Adapter

Pode mapear tasks para:

- Claude Code subagents;
- Claude Managed Agents;
- skills;
- hooks;
- filesystem artifacts.

### Codex Adapter

Pode mapear tasks para:

- Codex thread;
- Codex SDK;
- AGENTS.md;
- harness local;
- execução em sandbox.

### Devin Adapter

Pode mapear tasks para:

- Devin session;
- Playbooks;
- AGENTS.md;
- repositórios selecionados;
- structured output.

### A2A Adapter

Pode mapear tasks para:

- Agent Card discovery;
- Task lifecycle;
- Message;
- Artifact;
- input-required;
- completed/failed/canceled.

## MCP

Use MCP para Agent → Tool:

```text
Agent → MCP Server → GitHub/Jira/Grafana/DB/Internal API
```

## A2A

Use A2A para Agent → Agent:

```text
Harness → A2A AgentCard → Remote Agent Task → Artifact
```

## Regra de uso

- Use adapter direto quando o runtime é controlado pela sua plataforma.
- Use MCP para ferramentas.
- Use A2A para agentes remotos/distribuídos.
- Não faça A2A ser dependência obrigatória da V1 se você ainda não tem agentes remotos reais.

## Cross-runtime review

Uma prática recomendada para reduzir correlação de erro:

```yaml
review_policy:
  require_different_runtime_from_author: true
```

Exemplo:

```text
Codex implementa → Claude revisa
Claude arquiteta → Codex desafia
Devin investiga repo → Claude sintetiza
```


---

# 08 — Implementação prática

## MVP recomendado

Não comece com A2A, 100 repositórios e múltiplos vendors. Comece com contratos e workflow local.

### Fase 0 — Contratos

Defina:

- `Agent`
- `Task`
- `Artifact`
- `Workflow`
- `Gate`
- `Evidence`
- `Runtime`

### Fase 1 — Base universal

Crie:

```text
.squad/base/agents
.squad/base/workflows
.squad/base/contracts
.squad/base/policies
```

### Fase 2 — Execução Claude-first

Use Claude Code ou Managed Agents como primeiro runtime, mas mantenha a source of truth em `.squad`.

### Fase 3 — Gates determinísticos

Implemente validação em código/OPA:

- schema validation;
- required artifacts;
- tests pass;
- evidence exists;
- questions answered;
- approvals.

### Fase 4 — Adapter Codex

Adicione Codex para implementação/review.

### Fase 5 — Adapter Devin

Adicione Devin para investigação autônoma em repositórios grandes.

### Fase 6 — Catálogo enterprise

Integre com Backstage ou catálogo equivalente.

### Fase 7 — MCP

Crie servidores MCP para GitHub/Jira/Grafana/Datadog/Confluence/etc.

### Fase 8 — A2A

Use A2A quando houver agentes remotos de outros domínios/times/vendors.

## Métricas

### Qualidade

- bugs encontrados pelo reviewer;
- gates que falham corretamente;
- regressões evitadas;
- perguntas bloqueantes detectadas;
- retrabalho por interpretação errada.

### Eficiência

- tokens por entrega;
- tempo até plano inicial;
- tempo até PR;
- número de agentes acionados;
- custo por workflow.

### Governança

- percentual de execuções com evidência completa;
- exceções vencidas;
- políticas violadas;
- rastreabilidade até Jira/PR/Incidente.

## Primeira demanda piloto

Escolha uma demanda real mas controlada:

- impacto médio;
- poucos repositórios;
- requisitos incompletos;
- necessidade de arquitetura;
- testes possíveis;
- baixo risco regulatório.

Execute o fluxo completo e meça.


---

# 09 — Referências

## Referências principais

- Anthropic — Managed Agents / Multi-agent: https://platform.claude.com/docs/en/managed-agents/multi-agent
- Anthropic Engineering — Managed Agents meta-harness: https://www.anthropic.com/engineering/managed-agents
- Claude Code — Subagents: https://code.claude.com/docs/en/subagents
- Claude Code — Context window: https://code.claude.com/docs/en/context-window
- Anthropic — Skills, hooks, rules, subagents: https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more
- OpenAI Agents SDK — Multi-agent orchestration: https://openai.github.io/openai-agents-python/multi_agent/
- OpenAI Agents SDK — Handoffs: https://openai.github.io/openai-agents-python/handoffs/
- OpenAI — Unlocking the Codex harness: https://openai.com/index/unlocking-the-codex-harness/
- OpenAI Codex SDK: https://github.com/openai/codex/blob/main/sdk/python/README.md
- Devin — AGENTS.md: https://docs.devin.ai/onboard-devin/agents-md
- Devin — Playbooks: https://docs.devin.ai/pt-BR/product-guides/creating-playbooks
- A2A Specification: https://a2a-protocol.org/latest/specification/
- Google Developers Blog — A2A announcement: https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/
- MCP Specification: https://modelcontextprotocol.io/specification/2026-07-28
- MCP Tools: https://modelcontextprotocol.io/specification/2026-07-28/server/tools
- MCP Resources: https://modelcontextprotocol.io/specification/2026-07-28/server/resources
- Backstage System Model: https://backstage.io/docs/features/software-catalog/system-model/
- Backstage Descriptor Format: https://backstage.io/docs/features/software-catalog/descriptor-format/
- Backstage Technical Overview: https://backstage.io/docs/overview/technical-overview/
- Open Policy Agent Docs: https://openpolicyagent.org/docs
- Open Policy Agent Policy Language: https://openpolicyagent.org/docs/policy-language
- OpenTelemetry Docs: https://opentelemetry.io/docs/
- OpenTelemetry Context Propagation: https://opentelemetry.io/docs/concepts/context-propagation/
- Temporal Workflow Execution: https://docs.temporal.io/workflows
- Google SRE Book: https://sre.google/sre-book/table-of-contents/
- SWE-agent paper: https://arxiv.org/abs/2405.15793
- SWE-bench Verified: https://www.swebench.com/verified.html
- MetaGPT paper: https://arxiv.org/abs/2308.00352
- OpenHands paper: https://arxiv.org/abs/2407.16741
- AFlow paper: https://proceedings.iclr.cc/paper_files/paper/2025/hash/5492ecbce4439401798dcd2c90be94cd-Abstract-Conference.html
