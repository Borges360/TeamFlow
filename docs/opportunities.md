# Oportunidades de evolução do teamFlow

Estas oportunidades foram observadas durante a implementação da distribuição npm
0.1.0. Não fazem parte da implementação atual.

## 1. Isolar base gerenciada e customizações — P1 (alto)

- Problema observado: arquivos universais e contexto `.project/` convivem no mesmo Git checkout.
- Impacto: uma customização legítima impede update automático ou exige merge manual amplo.
- Oportunidade: definir camadas/manifest de arquivos gerenciados, overlays locais e política de merge por tipo.
- Benefício esperado: updates frequentes sem sobrescrever contexto do consumidor.
- Complexidade: alta.
- Risco: alto; uma classificação errada pode perder ou mascarar customizações.
- Prioridade: P1 - alto.

## 2. Reserva e governança da identidade npm — P1 (alto)

- Problema observado: `teamflow` estava livre na consulta, mas não reservado.
- Impacto: package substitution, confusão de dependência ou perda do nome antes do lançamento.
- Oportunidade: reservar o nome, configurar owners mínimos, 2FA, Trusted Publisher e política de acesso; avaliar scope oficial se necessário.
- Benefício esperado: identidade verificável e menor risco de supply chain.
- Complexidade: baixa.
- Risco: baixo, dependente de autoridade externa.
- Prioridade: P1 - alto.

## 3. Assinatura de tags e verificação criptográfica — P2 (médio)

- Problema observado: tag anotada/protegida melhora governança, mas não prova assinatura do mantenedor no cliente.
- Impacto: comprometimento da conta/repositório ainda pode produzir uma tag aparentemente válida.
- Oportunidade: política de tags assinadas e verificação Sigstore/Git, com identidade e rotação documentadas.
- Benefício esperado: autenticação forte da release Git além de HTTPS/provenance npm.
- Complexidade: média.
- Risco: médio; gestão de chaves/identidades pode bloquear releases.
- Prioridade: P2 - médio.

## 4. Comando `doctor` — P2 (médio)

- Problema observado: diagnóstico de Git, Node, origem, tag, dirty state e configuração exige comandos manuais.
- Impacto: suporte lento e mensagens fragmentadas antes de install/update.
- Oportunidade: comando somente leitura `teamflow doctor` com saída estruturada e redigida.
- Benefício esperado: onboarding e troubleshooting mais rápidos.
- Complexidade: baixa.
- Risco: baixo; deve evitar vazar caminhos/URLs privados.
- Prioridade: P2 - médio.

## 5. `status` e plano de update sem mutação — P2 (médio)

- Problema observado: o usuário só descobre incompatibilidades ao executar update.
- Impacto: baixa previsibilidade operacional e mais tentativas manuais.
- Oportunidade: `teamflow status`/`update --check` para comparar versões, origem e customizações sem fetch/checkout mutável.
- Benefício esperado: planejamento e automação segura de frotas.
- Complexidade: média.
- Risco: baixo.
- Prioridade: P2 - médio.

## 6. Rollback explícito — P2 (médio)

- Problema observado: 0.1.0 tenta rollback apenas durante falha imediata; não há comando pós-update.
- Impacto: regressão descoberta depois exige conhecimento Git.
- Oportunidade: registrar histórico mínimo de releases e oferecer rollback explícito para tag anterior, sempre com árvore limpa e confirmação.
- Benefício esperado: recuperação operacional mais rápida e auditável.
- Complexidade: média.
- Risco: médio; compatibilidade de configuração pode impedir downgrade.
- Prioridade: P2 - médio.

## 7. Validação de compatibilidade entre base e contexto — P2 (médio)

- Problema observado: não existe contrato machine-readable de compatibilidade entre versão do teamFlow e formatos `.project/`.
- Impacto: uma release estrutural pode exigir migração manual descoberta tardiamente.
- Oportunidade: schema/version range de contexto, release notes de breaking changes e migradores explicitamente revisados.
- Benefício esperado: upgrades previsíveis e backward compatibility mensurável.
- Complexidade: alta.
- Risco: médio.
- Prioridade: P2 - médio.

## 8. Bootstrap guiado e validação de adoção — P2 (médio)

- Problema observado: após o clone ainda há substituição manual extensa de exemplos `.project/`.
- Impacto: adoção lenta, placeholders esquecidos e erros humanos.
- Oportunidade: avaliar `init` guiado que apenas gera configuração local validável, sem alterar comportamento de agentes.
- Benefício esperado: primeira squad operacional com menos passos e evidência de completude.
- Complexidade: média.
- Risco: médio; defaults não podem virar fatos empresariais inventados.
- Prioridade: P2 - médio.

## 9. Métricas locais opt-in da própria CLI — P3 (baixo)

- Problema observado: não há dados agregados sobre duração/falhas de bootstrap e update.
- Impacto: priorização de ergonomia depende de relatos manuais.
- Oportunidade: logs locais estruturados e redigidos, opt-in explícito para telemetria externa futura.
- Benefício esperado: troubleshooting e melhoria orientada a evidência.
- Complexidade: média.
- Risco: médio por privacidade e paths sensíveis.
- Prioridade: P3 - baixo.

## 10. Pacotes de contexto para reduzir tokens — P3 (baixo)

- Problema observado: adoções grandes podem carregar documentação redundante ou desatualizada.
- Impacto: maior consumo de tokens, latência e menor determinismo dos agentes.
- Oportunidade: índices gerados e bundles mínimos versionados por workflow/risco, preservando fontes e freshness.
- Benefício esperado: menor custo de contexto e decisões mais reproduzíveis.
- Complexidade: média.
- Risco: médio; sumarização excessiva pode omitir políticas mandatórias.
- Prioridade: P3 - baixo.
