# Brief para trabalho braçal da Fase 7 (shell)

Leia antes: `CLAUDE.md`, `design-system/DESIGN_SYSTEM.md` (§4 e §10), `docs/BRIEF-COMPOSTOS.md` (as regras de histórias e testes dos compostos valem aqui) e **todos** os arquivos de `src/components/layout/` e `src/features/shell/`.

## O que existe

- `src/components/layout/` (componentes do shell, **só props**): `AppShell`, `Sidebar` (prop `tom: "clara" | "marca"`), `NavegacaoPrincipal`, `MobileNav` (drawer à esquerda), `Topbar` (slots `busca`, `notificacoes`, `tema`, `usuario`), `SearchTrigger`, `NotificationCenter` (`estado: Recurso<Notificacao[]>`), `ThemeMenu`, `UserMenu` (`usuario: Recurso<Pessoa>`), `PageHeader` (+ `MobileActionBar` por portal abaixo de 768 px), `PageSkeleton`, `SkipLink`, `TransicaoDeRota`, `navegacao.ts` (`NAV_PRINCIPAL`, `NAV_RODAPE`, `rotaAtiva`, `trilhaDaRota`, `rotaDaEntidade`).
- `src/features/shell/PainelShell.tsx`: contêiner que liga tudo a `usePathname`, next-themes, `usePreferencia` (`src/lib/preferencias.ts`) e `fakeApi`.
- Domínio: `src/domain/notificacoes/notificacoes.ts` (`listarNotificacoes`, `contadoresNavegacao`, `nomeDaEntidade`, `naoLidas`).
- `src/lib/motion.ts` (`segundos`, `bezier`, `transicaoDeTokens`, `useTransicaoToken`).
- Rotas placeholder em `src/app/(dashboard)/**` (Dashboard `/`, `/imoveis`, `/imoveis/novo`, `/imoveis/[id]`, `/imoveis/[id]/editar`, `/leads`, `/leads/[id]`, `/contratos`, `/contratos/[id]`, `/financeiro`, `/configuracoes`, `/design-system/colors`, `/design-system/illustrations`).

## Regras

- Não edite arquivos fora dos seus. Precisa mudar um componente? **Não mexa**: descreva no relatório (com o motivo).
- Mock nas histórias: `BASE_HISTORIAS`, `AGORA_HISTORIAS` de `@/mocks/data/historias`; funções do domínio (`listarNotificacoes`, `contadoresNavegacao`) para montar props reais. Callbacks com `fn()` de `storybook/test`.
- Histórias com `next/link`: o Storybook usa `@storybook/nextjs-vite` com `appDirectory: true`; para fixar a rota use `parameters: { nextjs: { navigation: { pathname: "/imoveis" } } }`.
- Só tokens; sem valores arbitrários do Tailwind; pt-BR em tudo.
- Verificação: `npx tsc --noEmit`, `npx eslint <seus arquivos>`, `npx vitest run <seus arquivos>`, `npx prettier --write <seus arquivos>`. **Não** rode `storybook build`, `playwright`, `next build`/`next dev`, nem `prettier --write .`. Não faça commit.
- Relatório final (máx. 12 linhas): arquivos criados, nº de histórias/testes, problemas encontrados nos componentes (bugs, a11y), pedidos de mudança.
