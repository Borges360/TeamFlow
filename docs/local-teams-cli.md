# CLI local, times, projetos e workspaces

`teamflow` é uma CLI Node local, sem dependências runtime. A distribuição npm não está habilitada neste plano. A CLI mantém estado privado fora dos checkouts de produto e não instala nem atualiza uma cópia Git de si própria.

## Home persistente

```text
.teamFlow/
├── internal/
│   ├── bases/<version>-<manifest-hash>/
│   ├── repository-cache/<remote-digest>.git/
│   └── locks/
└── teams/<team-id>/projects/<project-id>/
    ├── state/
    │   ├── repositories/ demands/ worktrees/ locks/ history/
    │   └── team-snapshot.json
    └── workspace/
        ├── deliveries/
        └── repositories/
```

No Windows o home padrão é `%USERPROFILE%\.teamFlow`; nos demais sistemas é `$HOME/.teamFlow`. Use `TEAMFLOW_HOME` ou `--home <path>` para sobrescrever.

Cada projeto fixa uma base por versão e hash. `project upgrade-base` é a única forma de avançar esse pin; o histórico preserva a referência anterior e `project rollback-base` exige chave e motivo. Projetos antigos são adaptados somente quando acessados: o CLI não clona, move ou apaga seus arquivos, inclusive deliveries legados.

## Execução a partir do checkout

```bash
npm ci --ignore-scripts
node bin/teamflow.js setup --dry-run
node bin/teamflow.js project path customer --team platform
```

`project path` imprime o workspace que deve ser aberto pelo usuário. Não existe `project activate` nem arquivo global de projeto ativo. Não use `npx` nem instalação npm global: o produto permanece interno e sem rota npm neste plano.

## Repositórios persistentes

```bash
teamflow repository add customer-api --project customer --team platform --remote https://scm.example/customer-api.git
teamflow repository attach customer-api --project customer --team platform --path /existing/customer-api
teamflow repository status --project customer --team platform
teamflow repository sync customer-api --project customer --team platform
teamflow repository detach customer-api --project customer --team platform
```

`add` cria ou reutiliza cache bare pelo digest do remote e cria um checkout persistente em `workspace/repositories/`. `attach` apenas valida o checkout externo e clona uma cópia gerenciada; nunca move nem altera a origem. `sync` recusa checkout dirty ou operação Git pendente. `detach` só remove o binding e mantém checkout/cache para limpeza explícita do usuário.

## Demandas e worktrees

```bash
teamflow demand create DEM-42 --project customer --team platform --title "Ajustar filtro" --file demanda.txt
teamflow demand list --project customer --team platform
teamflow demand exec DEM-42 --project customer --team platform -- codex
```

O texto recebido por `--text` ou `--file` é preservado literalmente. `exec` cria/reutiliza worktrees em `state/worktrees/<demand-id>/`, gera um `AGENTS.md` que aponta à base pinada e inicia o runtime nessa raiz sem shell. O ambiente inclui apenas caminhos `TEAMFLOW_*`, nunca credenciais.
