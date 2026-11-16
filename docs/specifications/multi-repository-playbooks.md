# Especificação histórica — playbooks operacionais da Squad Agêntica

> Superseded in 0.1.1 by the optional nine-playbook catalog, standardized `playbook-*.md` paths, semantic workflow routing and technical discovery in `.squad/playbooks/README.md`. Eight-playbook constraints below describe the earlier baseline only.

- Status: `implemented` no template `1.2.0`
- Natureza: manutenção estrutural do produto squad-agentica; não é um delivery de projeto.
- Catálogo público: `/feature`, `/bugfix`, `/tests`, `/performance`, `/adr`, `/finops`, `/doc` e `/refactor`.

## 1. Objetivo

Facilitar o trabalho diário do desenvolvedor com oito playbooks de intenção clara. O desenvolvedor informa o objetivo e critérios específicos; o playbook aplica automaticamente as regras comuns de descoberta, análise de impacto, workspace, branch, pipeline, documentação, evidência e revisão.

```text
/feature adicionar consulta de contratos por CPF
/bugfix corrigir timeout na API de pagamento
/tests criar regressão para DEM-123
/performance investigar p95 da consulta de catálogo
/adr avaliar cache distribuído para catálogo
/finops reduzir custo do processamento noturno sem violar o SLA
/doc documentar setup e troubleshooting
/refactor separar validação de contrato do controller
```

Playbook não é um novo agente, workflow completo duplicado ou prompt extenso. É uma receita operacional parametrizada e carregada somente quando selecionada.

## 2. Comportamento comum

Todo playbook deve:

1. preservar a demanda e gerar demand ID;
2. descobrir instruções locais, stack, catálogo, branch model e CI/CD;
3. identificar aplicações, bibliotecas, infraestrutura, configuração, testes, observabilidade e documentação afetados;
4. classificar repositórios como `observed`, `affected`, `changed` ou `follow_up`;
5. verificar acesso, owner e write boundary;
6. clonar ou reutilizar checkouts seguros fora do repositório da squad;
7. preparar branch por repositório alterado, seguindo regras locais;
8. apresentar as peças a alterar antes da escrita;
9. executar pipeline e validações aplicáveis por repositório;
10. registrar evidências, limitações e decisões humanas.

Quando permitido pelo repositório, o default é `feature/<demand-id>-<slug>` a partir de `develop`. O playbook não autoriza push, PR, merge, deploy, release, force-push ou operação destrutiva.

## 3. Catálogo público

### PB-01 — `/feature`

Implementa funcionalidade nova ou alteração funcional.

Entradas:

- objetivo obrigatório;
- critérios de aceite, escopo/repositório e restrições opcionais.

Fluxo específico:

1. transformar critérios conhecidos em requisitos verificáveis;
2. identificar comportamento, contratos, dados e consumidores afetados;
3. decidir se design/ADR/revisores especializados são necessários;
4. implementar código, testes e documentação nos repositórios proprietários;
5. executar integração e pipelines aplicáveis.

Não deve incluir refatoração ampla, atualização de dependências ou migração adjacente sem justificar a necessidade no change plan.

### PB-02 — `/bugfix`

Investiga e corrige um defeito.

Fluxo específico:

1. registrar sintomas, ambiente e comportamento esperado;
2. reproduzir ou reunir evidência observável;
3. formular e testar hipóteses;
4. identificar a menor causa sustentada;
5. criar teste de regressão quando tecnicamente aplicável;
6. corrigir e executar regressão proporcional.

Não aceita “corrigir por tentativa” nem apresenta hipótese como causa confirmada. Sem reprodução possível, o resultado pode ser diagnóstico, instrumentação ou `EVIDÊNCIA INSUFICIENTE`.

### PB-03 — `/tests`

Cria, corrige ou amplia testes.

Tipos suportados conforme risco: unidade, componente, integração, contrato, E2E, acessibilidade, segurança, performance e resiliência.

O playbook deve:

- localizar o proprietário dos testes, inclusive repositório separado;
- ligar cenários a requisito, risco ou regressão;
- definir ambiente, dados e oráculos/assertivas;
- evitar duplicação e teste que apenas replica implementação;
- executar os testes e reter resultado;
- distinguir teste não executado, falho, flaky e bloqueado.

### PB-04 — `/performance`

Diagnostica ou melhora latência, throughput, capacidade, uso de recursos ou estabilidade sob carga.

Entradas mínimas:

- comportamento/métrica alvo;
- ambiente ou fonte de medição;
- workload conhecido ou a descobrir.

Fluxo específico:

1. definir métrica, unidade, percentil, janela e critério de sucesso;
2. capturar baseline antes de otimizar;
3. identificar gargalo com profiling, tracing, métricas ou benchmark controlado;
4. propor alternativas e seus efeitos sobre correção/custo;
5. alterar somente com hipótese mensurável;
6. repetir o mesmo cenário e comparar variabilidade.

Não extrapola benchmark local para produção nem recomenda otimização sem baseline. Mudanças de capacidade/custo podem ativar `/finops` como análise auxiliar.

### PB-05 — `/adr`

Produz e mantém Architecture Decision Records.

Fluxo específico:

1. formular a pergunta de decisão;
2. registrar contexto, restrições, evidências e incertezas;
3. comparar alternativas, inclusive manter o estado atual;
4. documentar decisão proposta e consequências;
5. escolher repositório/caminho canônico;
6. atualizar índice e relações de supersessão.

O agente cria ADR como `proposed`. Somente owner humano autorizado muda para `accepted`, `rejected` ou aprova exceção.

Destino: repositório documental configurado para decisão transversal; caso contrário, convenção do repositório proprietário ou fallback `docs/architecture/decisions/`.

### PB-06 — `/finops`

Analisa ou implementa melhoria de custo de cloud, infraestrutura, dados, licenças ou consumo operacional sem tratar custo isoladamente.

Fluxo específico:

1. definir fonte, período, moeda, escopo e owner do custo;
2. estabelecer baseline e drivers de custo;
3. relacionar custo a utilização, capacidade, SLA/SLO, risco e crescimento;
4. comparar alternativas como rightsizing, scheduling, storage tiering, retenção, arquitetura ou compromisso de uso;
5. estimar benefício com premissas e intervalo, sem apresentar estimativa como economia realizada;
6. implementar somente alterações autorizadas e validar qualidade/desempenho;
7. definir janela de verificação posterior.

Compromissos financeiros, reservas, contratos, desligamento de recursos e mudança produtiva exigem decisão humana. Informação financeira sem fonte recebe `EVIDÊNCIA INSUFICIENTE`.

### PB-07 — `/doc`

Cria ou atualiza documentação permanente do projeto: setup, desenvolvimento, arquitetura, API, operação, troubleshooting, runbook ou referência.

Fluxo específico:

1. classificar documento, público e owner;
2. localizar fonte de verdade e convenção existente;
3. escolher repositório e caminho canônico;
4. produzir conteúdo sustentado por código/configuração/fontes;
5. validar links, exemplos e comandos quando seguro;
6. atualizar índice e registrar referência no delivery.

Se houver repositório documental configurado, usá-lo para documentação compartilhada. Sem ele, usar a convenção do proprietário ou fallback `docs/`. Documentação permanente não fica somente em `deliveries/`.

### PB-08 — `/refactor`

Melhora estrutura interna preservando comportamento funcional intencionalmente.

Fluxo específico:

1. declarar problema estrutural e benefício esperado;
2. definir invariantes de comportamento e escopo proibido;
3. obter baseline de testes ou caracterização;
4. realizar mudanças pequenas/revisáveis;
5. executar regressão e comparar interfaces/contratos;
6. separar qualquer alteração funcional descoberta.

Se não houver proteção suficiente contra regressão, ativar `/tests` primeiro ou retornar o risco para decisão humana. Não misturar refactor oportunista amplo com feature/bugfix.

## 4. Composição

Um playbook é principal; os demais podem ser análises auxiliares explícitas:

```text
/feature
  ├── /tests
  ├── /doc
  ├── /adr       quando a decisão for consequencial
  ├── /performance quando existir requisito mensurável
  └── /finops    quando custo for material
```

Regras:

- composição não amplia write scope automaticamente;
- `/refactor` não entra silenciosamente em `/feature` ou `/bugfix`;
- `/performance` exige baseline;
- `/finops` exige fonte de custo e protege SLA/qualidade;
- `/adr` não autoaprova decisão;
- `/doc` não inventa comportamento;
- `/tests` não altera produção para tornar cenário executável.

## 5. Mecanismos internos, não playbooks públicos

Os itens seguintes são políticas/contratos compartilhados:

- descoberta de repositórios;
- preparação do workspace;
- criação/validação de branches;
- change plan multi-repositório;
- descoberta/execução de pipeline;
- roteamento documental;
- coordenação de integração;
- evidence/gates/principal review.

Isso evita comandos públicos como `/workspace-bootstrap` ou `/pipeline-fix` e mantém o catálogo centrado no trabalho diário desejado.

## 6. Contrato comum

```yaml
id: performance
version: "1.0"
aliases: [perf]
summary: Diagnosticar ou melhorar desempenho com baseline comparável
invocation: /performance <objetivo>
workflow: performance-audit
arguments:
  required: [objective]
  optional: [repository, metric, environment, workload, flags]
side_effect_class: conditional-write
permissions:
  may_write_files: true
  may_create_local_branch: true
  may_push: false
  may_merge: false
  may_deploy: false
loads: []
outputs: []
```

Seções obrigatórias: quando usar/não usar, entradas, descoberta autônoma, perguntas bloqueantes, preconditions, passos, decisões semânticas, checks determinísticos, falhas/recuperação, saídas/evidências e conclusão.

O registry mantém metadados compactos; o conteúdo completo é carregado apenas quando selecionado.

## 7. Workspace e múltiplos repositórios

Checkouts ficam fora do template:

```text
<workspace-da-demanda>/repositories/
├── application-a/
├── application-b/
├── infrastructure/
├── integration-tests/
└── engineering-docs/
```

Antes de reutilizar checkout: verificar remote, branch, revisão, alterações desconhecidas e operações Git em andamento. Nunca limpar ou sobrescrever trabalho automaticamente.

Cada repositório `changed` possui owner, base/revisão, branch ou exceção, write boundary, pipeline, evidência, integração e rollback próprios.

## 8. Documentação

Ordem de destino:

1. convenção do repositório proprietário;
2. repositório documental configurado para conteúdo compartilhado;
3. fallback `docs/` no proprietário;
4. ADR sem convenção: `docs/architecture/decisions/`.

O delivery referencia o artefato definitivo:

```yaml
document:
  repository_id: customer-api
  path: docs/architecture/decisions/ADR-0042-cache.md
  branch: feature/DEM-123-cache
  status: proposed
```

## 9. Estrutura proposta

```text
.squad/
├── playbooks/
│   ├── feature.md
│   ├── bugfix.md
│   ├── tests.md
│   ├── performance.md
│   ├── adr.md
│   ├── finops.md
│   ├── doc.md
│   └── refactor.md
├── contracts/playbook.md
├── registries/playbooks.yaml
└── templates/playbook-result.md
```

## 10. Validações

1. Registry contém exatamente os oito playbooks públicos aprovados.
2. IDs, aliases e versões são únicos; paths/referências existem.
3. Campos e seções obrigatórios estão presentes.
4. Efeito colateral e permissões são coerentes.
5. Nenhum playbook autoriza push, merge, deploy ou release.
6. `/performance` exige baseline e cenário comparável.
7. `/finops` exige fonte de custo, período, moeda e proteção de qualidade/SLA.
8. `/adr` exige owner e não aceita automaticamente.
9. `/doc` resolve repositório/caminho permanente fora de `deliveries/`.
10. `/refactor` registra invariantes/testes e não inclui mudança funcional silenciosa.
11. `/bugfix` exige reprodução/evidência ou declara insuficiência.
12. Cada repositório alterado possui branch, write boundary, pipeline e evidência.

## 11. Evals

Casos inicialmente `specification_only`:

- `/feature` simples e multi-repositório;
- `/bugfix` sem reprodução não inventa causa;
- `/tests` encontra repositório de testes separado;
- `/performance` rejeita conclusão sem baseline;
- `/adr` permanece `proposed` sem owner;
- `/finops` não trata estimativa como economia realizada nem reduz SLA silenciosamente;
- `/doc` usa repositório documental ou fallback `docs/`;
- `/refactor` bloqueia mudança funcional não autorizada;
- checkout sujo não é sobrescrito;
- repositório sem `develop` segue regra local.

Pilotos comparam as mesmas demandas/runtime/modelo/ferramentas/orçamento, medindo digitação, tempo até plano, completude, perguntas, erros, intervenção, sucesso e tokens/custo/latência reportados. Até então, ganhos são hipóteses.

## 12. Critérios de aceite

- AC-01: catálogo público possui exatamente os oito playbooks solicitados.
- AC-02: invocação curta é suficiente para iniciar o fluxo.
- AC-03: análise de impacto precede escrita.
- AC-04: repositórios são preparados fora da squad.
- AC-05: branch/pipeline são tratadas por repositório e regras locais prevalecem.
- AC-06: documentação permanente vai ao repositório correto ou `docs/`.
- AC-07: múltiplas aplicações, infra e testes podem participar.
- AC-08: ações externas/destrutivas não recebem autorização implícita.
- AC-09: conteúdo do playbook é carregado sob demanda.
- AC-10: performance e FinOps exigem baselines/fontes verificáveis.
- AC-11: contratos, registry e referências são validados.
- AC-12: benefício só é afirmado após piloto comparável.

## 13. Ordem de implementação

1. Contrato, registry e mecanismos internos de workspace/documentação/multi-repositório.
2. `/feature`, `/bugfix`, `/tests` e `/refactor`.
3. `/doc` e `/adr`.
4. `/performance` e `/finops`, com contratos de baseline/medição.
5. Validator e evals adversariais.
6. Piloto controlado antes de alegar benefícios.

## 14. Decisões humanas

Regra de negócio; write scope; aprovação de ADR; risco/exceções; fonte e compromisso financeiro; alteração de SLA; segredos/dados regulados/produção; push/PR/merge/deploy/release; mudanças irreversíveis.

## 15. Fora de escopo

- playbooks públicos adicionais nesta versão;
- playbook por linguagem/framework;
- orquestrador próprio;
- substituição de pipelines;
- clone dentro do template;
- operações externas nesta especificação;
- promessa de economia, custo ou performance sem medição.
