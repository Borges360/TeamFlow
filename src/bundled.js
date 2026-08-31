export const SCHEMA_VERSION = "1.0";

export const AGENTS = Object.freeze([
  { id: "lead", name: "Lead", description: "Coordena escopo, contexto, decisões e entrega.", triggers: ["toda demanda"], responsibilities: ["roteamento", "integração", "status e entrega"], instructions: "Preserve a demanda, mantenha a fronteira do time/projeto e não amplie permissões." },
  { id: "requirement-analyst", name: "Requirement Analyst", description: "Refina requisitos e critérios de aceite.", triggers: ["requisitos ambíguos"], responsibilities: ["objetivo", "critérios de aceite", "perguntas bloqueantes"], instructions: "Separe fatos, hipóteses e decisões de negócio." },
  { id: "solution-architect", name: "Solution Architect", description: "Avalia decisões difíceis de reverter, contratos e arquitetura.", triggers: ["nova fronteira", "arquitetura"], responsibilities: ["alternativas", "contratos", "consequências"], instructions: "Compare alternativas e mantenha aprovação humana quando necessária." },
  { id: "software-engineer", name: "Software Engineer", description: "Implementa aplicações, serviços, interfaces e integrações.", triggers: ["implementação"], responsibilities: ["implementação", "compatibilidade", "testes locais"], instructions: "Implemente somente dentro do plano e da pipeline do repositório." },
  { id: "quality-engineer", name: "Quality Engineer", description: "Define testes, regressão e evidências de qualidade.", triggers: ["qualidade", "testes"], responsibilities: ["estratégia de testes", "regressão", "evidência"], instructions: "Relacione critérios e riscos a evidências reproduzíveis." },
  { id: "security-engineer", name: "Security Engineer", description: "Revisa segurança, privacidade, entradas não confiáveis e dados sensíveis.", triggers: ["segurança", "dados sensíveis"], responsibilities: ["ameaças", "controles", "risco residual"], instructions: "Não copie segredos ou payloads produtivos para a configuração local." },
  { id: "reliability-engineer", name: "Reliability Engineer", description: "Avalia produção, SLO, capacidade, recuperação e rollback.", triggers: ["produção", "confiabilidade"], responsibilities: ["SLO", "rollout/rollback", "recuperação"], instructions: "Exija readiness proporcional ao impacto operacional." },
  { id: "data-engineer", name: "Data Engineer", description: "Avalia schemas, catálogo, retenção e pipelines de dados.", triggers: ["dados", "schema"], responsibilities: ["schema", "linhagem", "retenção"], instructions: "Preserve classificação, ownership e compatibilidade dos dados." },
  { id: "performance-engineer", name: "Performance Engineer", description: "Avalia volume, latência, carga e eficiência.", triggers: ["performance", "capacidade"], responsibilities: ["baseline", "experimento", "capacidade"], instructions: "Não alegue melhoria sem comparação reproduzível." },
  { id: "platform-engineer", name: "Platform Engineer", description: "Avalia infraestrutura, CI/CD, configuração e observabilidade.", triggers: ["infraestrutura", "pipeline"], responsibilities: ["CI/CD", "infraestrutura", "observabilidade"], instructions: "Respeite controles locais e não execute mudanças produtivas sem autorização." },
  { id: "principal-reviewer", name: "Principal Reviewer", description: "Executa a revisão final independente e audita gates.", triggers: ["toda entrega"], responsibilities: ["revisão independente", "consistência", "gates"], instructions: "Não aprove trabalho sem evidência suficiente e gates resolvidos." },
]);

export const ESSENTIAL_AGENT_IDS = Object.freeze([
  "lead",
  "requirement-analyst",
  "software-engineer",
  "quality-engineer",
  "principal-reviewer",
]);

export const AGENT_PRESETS = Object.freeze({
  essential: ESSENTIAL_AGENT_IDS,
  complete: AGENTS.map(({ id }) => id),
});

export const PLAYBOOKS = Object.freeze([
  { id: "feature", name: "Feature", version: "1.0", workflow: "feature", optional_invocation: true, aliases: ["feat"] },
  { id: "bugfix", name: "Bugfix", version: "1.0", workflow: "bugfix", optional_invocation: true, aliases: ["fix"] },
  { id: "tests", name: "Tests", version: "1.0", workflow: "feature", optional_invocation: true, aliases: ["test"] },
  { id: "technical-discovery", name: "Technical Discovery", version: "1.0", workflow: "architecture-review", optional_invocation: true, aliases: ["discovery"] },
  { id: "performance", name: "Performance", version: "1.0", workflow: "performance-audit", optional_invocation: true, aliases: ["perf"] },
  { id: "adr", name: "ADR", version: "1.0", workflow: "architecture-review", optional_invocation: true, aliases: ["decision"] },
  { id: "finops", name: "FinOps", version: "1.0", workflow: "performance-audit", optional_invocation: true, aliases: ["cost"] },
  { id: "doc", name: "Documentation", version: "1.0", workflow: "feature", optional_invocation: true, aliases: ["docs"] },
  { id: "refactor", name: "Refactor", version: "1.0", workflow: "feature", optional_invocation: true, aliases: ["refactoring"] },
]);

export const WORKFLOWS = Object.freeze({
  feature: "Mudança funcional: requisitos, impacto, design, implementação, verificação e entrega.",
  bugfix: "Correção: reprodução, causa, impacto, correção, regressão e entrega.",
  "architecture-review": "Decisão técnica: contexto, alternativas, evidências, decisão humana e ADR.",
  "performance-audit": "Medição: objetivo, baseline, hipóteses, experimento e recomendação.",
});

export function agentById(id) {
  return AGENTS.find((agent) => agent.id === id);
}

export function playbookById(id) {
  return PLAYBOOKS.find((playbook) => playbook.id === id || playbook.aliases.includes(id));
}
