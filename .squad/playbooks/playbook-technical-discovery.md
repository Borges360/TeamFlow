---
{"schema_version":"1.1","id":"technical-discovery","name":"Technical Discovery","version":"1.0","optional_invocation":true,"aliases":["discovery"],"path":".squad/playbooks/playbook-technical-discovery.md","primary_workflow":"architecture-review","side_effect_class":"read-only","invocation_examples":["Use o playbook technical-discovery para comparar alternativas.","Use .squad/playbooks/playbook-technical-discovery.md.","Investigue as alternativas antes de escolher a solução."],"always_required":{"roles":[],"artifacts":[],"gates":[]},"conditional_activation":[],"outputs":[],"stop_conditions":[],"permissions":{"requires_repository_read":true,"may_write_files":false,"may_create_local_branch":false,"may_push":false,"may_merge":false,"may_deploy":false,"may_release":false,"may_delete":false}}
---
# Playbook: technical discovery

## Purpose
Comparar alternativas quando o resultado de negócio é conhecido, mas a solução técnica ainda não foi escolhida ou faltam dados para uma decisão segura.
## When to use
Use explicitamente ou por roteamento semântico quando alternativas relevantes mudam arquitetura, custo, escopo, segurança ou risco.
## Do not use when
Não usar como etapa obrigatória de toda feature e não implementar produto, criar infraestrutura nem presumir aprovação humana.
## Inputs and autonomous discovery
Preservar demanda, objetivo, hipóteses e alternativas; descobrir jornadas, sistemas, APIs, dados, consumidores, restrições e decisão técnica pendente.
## Blocking questions
Perguntar apenas quando a resposta altera arquitetura, custo, escopo, segurança, risco ou critério de aceite.
## Preconditions
Resultado de negócio, autoridade de decisão e fronteira de investigação estão explícitos.
## Operational steps
Mapear estado atual e alternativas → levantar volume, crescimento, cardinalidade, seletividade, concorrência, latência, disponibilidade, custo, compatibilidade, segurança, observabilidade, rollout e rollback → ativar revisões condicionais → comparar inclusive manter o estado atual → recomendar com evidências.
## Semantic decisions
Não escolher entre alternativas mutuamente exclusivas sem critérios suficientes ou decisão humana; registrar premissas, incertezas, riscos e consequências.
## Deterministic checks
Verificar fontes, datas, alternativas, critérios, evidências, lacunas e autoridade da decisão.
## Failure, cancellation and recovery
Encerrar em solução escolhida por autoridade humana, ADR proposto, `NEEDS_USER_INPUT`, evidência insuficiente ou nenhuma solução viável.
## Outputs and evidence
Recomendação, matriz de alternativas, premissas, riscos, evidências, perguntas materiais e ADR proposto quando aplicável.
## Completion criteria
A decisão está pronta para autoridade humana ou o bloqueio/evidência insuficiente está explicitamente demonstrado; nenhuma implementação foi executada.
