# Distribuição npm e CLI do teamFlow

## Arquitetura e fonte de verdade

O GitHub `Borges360/TeamFlow` permanece canônico. Cada publicação npm aponta para
uma tag Git anotada e imutável com a mesma versão:

| Elemento | Regra para 0.1.1 |
|---|---|
| Produto | `teamFlow 0.1.1` |
| Pacote e CLI npm | `teamflow@0.1.1` (`npm@11.9.0`, mínimo 11.5.1) |
| Metadata canônica da release | `package.json` `version: 0.1.1` |
| Espelhos de compatibilidade | `squad.yaml` e `.squad/manifest.yaml`, verificados por script |
| Git tag | tag anotada `v0.1.1` |
| GitHub Release | release publicada a partir de `v0.1.1` |

O pacote npm inclui a CLI (`bin/`, `src/`), a base imutável `.squad/`, o entrypoint
`AGENTS.md`, os índices e a documentação local necessária. Configuração efetiva,
catálogo, projetos, deliveries e evidências continuam fora de `node_modules` em
`TEAMFLOW_HOME`. Não há dependência runtime nem `postinstall`.

## Install

```bash
npx teamflow install [diretório]
```

Para forçar a CLI mais recente publicada, use `npx teamflow@latest install`.

O destino padrão é `./teamflow`. A CLI:

1. valida Git e permissão de escrita;
2. recusa arquivo ou diretório não vazio, salvo uma instalação oficial, limpa e já na mesma versão;
3. clona por HTTPS em diretório temporário exclusivo e somente então promove para o destino ainda vazio;
4. fixa `--branch v<versão-da-CLI> --depth 1 --no-recurse-submodules`;
5. valida raiz, remote `origin`, tag anotada exata contra o remote oficial e working tree limpa;
6. remove somente seu diretório temporário em falha; conteúdo que apareça no destino durante o download é preservado e aborta a promoção.

Nenhum arquivo do repositório baixado é executado pela CLI.

## Update

```bash
cd teamflow
npx teamflow update
```

Para forçar a CLI mais recente publicada, use `npx teamflow@latest update`.

Ou:

```bash
npx teamflow@latest update caminho/para/teamflow
```

A raiz Git é descoberta a partir do caminho informado. Antes de qualquer fetch,
a CLI valida o remote oficial, neutraliza hooks/configuração Git global executável,
rejeita configuração local capaz de executar/redirecionar comandos, exige working
tree completamente limpa (incluindo untracked), comprova a tag SemVer anotada e o
commit corrente contra o remote oficial e compara a versão instalada com a versão
da CLI.

- Mesma versão: sucesso idempotente, sem alteração.
- Instalação mais nova: downgrade recusado.
- Instalação mais antiga: fetch somente da tag alvo e checkout destacado.
- Checkout/validação falha: tentativa de retorno ao commit anterior, sem
  `reset --hard` e sem `clean`.
- Arquivo ignorado local colide com um path gerenciado na release alvo: aborta
  antes do checkout e lista a colisão.
- Commits/customizações/merge pendente: atualização interrompida; a integração é manual.

Para instalações customizadas, crie uma branch própria e mantenha os commits. Ao
atualizar, integre manualmente a nova tag (`v<versão>`) conforme a política do seu
projeto. A CLI não tenta adivinhar como mesclar políticas ou contexto local.

## Publicação e Trusted Publishing

Esta configuração prepara, mas não executa, a publicação. Checklist do mantenedor:

1. decidir/adicionar a licença jurídica; `UNLICENSED` é deliberado enquanto isso;
2. confirmar que `teamflow` continua livre e reservar/controlar o nome no npm;
3. proteger `main` e tags `v*` no GitHub e habilitar releases imutáveis;
4. configurar em npmjs.com o Trusted Publisher para:
   - owner: `Borges360`;
   - repository: `TeamFlow`;
   - workflow: `release.yml`;
   - environment: `npm` (se configurado no GitHub);
5. restringir publicação tradicional por token e exigir 2FA conforme a política do owner;
6. revisar/mergear a release em `main`, criar a tag anotada `v0.1.1` alcançável por
   `main` e publicar a GitHub Release;
7. acompanhar `.github/workflows/release.yml`, que valida formato/anotação/ancestralidade
   em `main`, executa toda a pipeline Python/Node, testa o tarball e publica com OIDC/provenance.

Comandos locais antes da tag:

```bash
npm ci --ignore-scripts
npm run check
npm pack --dry-run
npm publish --dry-run
npm run test:package
```

Depois de criar a tag anotada localmente, e antes de publicar a GitHub Release,
execute `npm run release:verify -- v0.1.1` no checkout dessa tag. Antes da tag
existir, a falha desse comando é intencional.

Não reutilize nem mova uma tag após publicação. Se uma versão estiver incorreta,
corrija e publique um novo PATCH SemVer.

## Segurança de supply chain

Controles implementados:

- registry oficial fixado por `publishConfig`;
- package allowlist e zero dependências runtime;
- Git executado sem shell e sem credenciais gravadas;
- hooks e configuração Git global/sistema são neutralizados; variáveis herdadas
  capazes de alterar Git/CA/askpass são removidas; configuração local com hooks,
  filtros, redirects, qualquer `http.*`, credentials ou proxy é recusada;
- origem GitHub e tag/commit correntes são validados contra o remote oficial antes de update;
- tag alvo derivada da versão do pacote, exigida como anotada e comparada ao remote;
- working tree verificada antes/depois da transição;
- publicação CI por credencial OIDC curta e provenance;
- GitHub Actions de terceiros fixadas por commit SHA;
- CI recusa divergência entre pacote, manifestos e release tag.

Riscos residuais:

- o nome npm pode ser tomado antes da primeira publicação;
- `publishConfig.registry` fixa o destino da publicação, mas não controla o registry
  configurado no computador do consumidor nem impede um pacote homônimo local;
- tags anotadas não são necessariamente assinadas; proteção/imutabilidade é externa;
- HTTPS/GitHub/npm continuam sendo dependências de disponibilidade e confiança;
- `UNLICENSED` restringe adoção/redistribuição até decisão jurídica;
- customizações locais não têm merge/rollback de domínio automatizados;
- provenance liga pacote, workflow e fonte, mas não substitui revisão de código.

As práticas de Trusted Publishing e provenance seguem a documentação oficial do
npm: <https://docs.npmjs.com/trusted-publishers/> e
<https://docs.npmjs.com/generating-provenance-statements/>.

## Compatibilidade

A CLI usa somente Node.js stdlib e Git, sem comandos shell específicos. A matriz
CI cobre versões mínimas em `ubuntu-latest`, `macos-latest` e `windows-latest`.
O workflow de publicação roda em runner GitHub hospedado, requisito atual do OIDC
do npm. Sistemas sem Git ou Node suportado recebem erro acionável.

Em ambientes corporativos com registry npm substituído, confirme a origem do pacote
e sua provenance ou execute com o registry oficial explicitamente configurado. Essa
verificação é complementar à reserva do nome `teamflow`; não a substitui.
