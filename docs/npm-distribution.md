# Distribuição do TeamFlow

**Estado:** TeamFlow permanece interno e sem distribuição npm neste plano, conforme A22. O manifesto marca o pacote como privado e o workflow de release valida o pacote sem publicá-lo.

Não use `npx teamflow`, `npm install -g teamflow` nem `npm publish`. Não há registry público, pacote publicado ou autorização de publicação nesta decisão.

## Validação interna

O workflow de release, quando executado no host, valida versão/tag, testes, conteúdo do pacote e sua execução em um diretório limpo. Essa validação não publica nem cria um artefato público. O fluxo hospedado não foi executado nesta entrega local.

Para desenvolvimento a partir deste checkout, siga [CLI local, times, projetos e workspaces](local-teams-cli.md).
