# Brief para as telas (Fase 8)

Leia antes: `CLAUDE.md`, `design-system/DESIGN_SYSTEM.md` (§4 e §10), `docs/REQUISITOS.md` (RFs da sua tela e §6 rotas), `docs/ESTADOS-E-FLUXOS.md` (§2), `docs/BRIEF-COMPOSTOS.md` (regras de visual/a11y continuam valendo), e a API (props) de **cada** composto que for usar em `src/components/patterns/` e `src/components/layout/`. Leia também `src/mocks/services/fakeApi.ts` (o que cada chamada devolve) e `src/features/shell/` (exemplo de contêiner).

## O que é uma tela

Uma tela **só monta** compostos e átomos existentes e liga-os aos dados. Ela é o **contêiner** (o único lugar com `fakeApi`, roteador e URL); os compostos continuam só com props.

- **Arquivos:** `src/features/<modulo>/Tela<Nome>.tsx` (`"use client"`) + partes pequenas da mesma tela no mesmo diretório. A rota `src/app/(dashboard)/<rota>/page.tsx` é Server Component: exporta `metadata` (título pt-BR) e renderiza a tela; se a tela usa `useSearchParams`/`useParametrosUrl`, envolva em `<Suspense fallback={<PageSkeleton variante="…" />}>`. Em rota dinâmica, `params` é `Promise` (Next 16): `const { id } = await params`.
- **Cabeçalho:** `PageHeader` com `titulo` e `acaoPrimaria` (ex.: `AcaoLink` de `@/features/shell/AcaoLink`, ou `Button` com callback; diálogos ficam fora, controlados pela tela). Detalhes: `<DefinirTrilha rotulo={codigo} />` (`@/features/shell/trilha`).
- **Estilo:** só classes de layout com tokens (`grid`, `flex`, `gap-*`, `col-span-*`, breakpoints `md:`/`xl:`). Nada de cor/borda/sombra nova na tela: aparência vem dos compostos (`Card`, `ChartCard`…). Se faltar um composto de verdade, crie-o em `src/components/patterns/` **com** história (`Padrões/<Nome>`: Normal, Carregando, Vazio, Erro, DadosExtremos) e teste, só props, e diga no relatório. Não duplique estilo entre telas (Gate 8).
- **Menos é mais (regra do Lauro):** título que diz o que é; sem `descricao` no `PageHeader`, sem eyebrows, sem subtítulo em cada card, sem textos de ajuda que não mudam a decisão. Sem indicadores visíveis de atalho (⌘K, teclas). Detalhe extra vai para `sr-only` ou tooltip.

## Dados (já prontos, em `src/features/dados/`)

- **Leitura:** `useConsulta(useCallback(() => fakeApi.x(filtros), [deps]))` → `{ estado: Recurso<T>, recarregar }`. Relê sozinha após qualquer escrita. Renderize com `EstadoRecurso` ou com o `estado` dos compostos que já recebem `Recurso<T>`; `onTentarNovamente={recarregar}`.
- **Escrita:** `executarEscrita(() => fakeApi.y(...), { sucesso: "Pagamento registrado" })` ou `useEscrita()` (expõe `estado: { fase: "idle" | "enviando" | "erro" }` para botões/diálogos). Já faz toast, "Desfazer" (RF-04) e invalida as consultas (tela, badges, notificações). Use `silenciarErro: true` quando o erro é mostrado no próprio formulário/diálogo. Formulários recebem `EnvioFormulario` (`FormSection.tsx`): monte-o a partir do resultado.
- **URL (RF-06):** `useParametrosUrl()` → `ler`, `lerLista`, `definir({ chave: valor })`, `limpar()`. Filtros, ordem, página e visualização vivem na URL; preferências de visualização/densidade persistem com `usePreferencia` (`@/lib/preferencias`) e a URL tem prioridade. Busca com debounce `DEBOUNCE_BUSCA_MS`.
- **Persona (RF-08):** `fakeApi.getPerfil()` dá o usuário atual (`papel`). Recorte padrão de "corretor" = só os dele (ex.: "Meus leads"); gestor/financeiro veem tudo.
- **Regras:** o que é permitido vem do domínio (`transicoes` que o `fakeApi.getX` já devolve, `transicoesPermitidasLead`, `podeTransicionarLead`, `Permissao`…). Proibido `if (status === …)` decidindo regra na tela. Mapear enum → rótulo/tom (`rotulos.ts`) pode.
- Formatação pt-BR: `@/lib/format`. Ilustrações: `@/assets/svg/*`. Ícones: `lucide-react` via `Icon`.

## Estados obrigatórios (RNF-09)

Cada bloco da tela mostra: carregando (skeleton com a forma final), vazio (`EmptyState` com ação clara), erro (`ErrorState` com "Tentar de novo"), conteúdo e dados extremos (texto longo, muitos itens, zero) sem quebrar. `naoEncontrado` em detalhe = estado de erro próprio com link de volta, não tela branca.

## Responsivo e acessibilidade

360 / 768 / 1280 / 1920 px sem rolagem horizontal da página (tabelas/kanban rolam no próprio contêiner). Um `h1` por tela (o do `PageHeader`); seções com `h2` (pode ser `sr-only` quando o card já tem título visível). Teclado completo, foco visível, anúncios por `role="status"` (contagem de resultados), alvos 40 px (44 px mobile).

## Testes

`src/features/<modulo>/Tela<Nome>.test.tsx` (Vitest + Testing Library): use `__reiniciarParaTeste({ agora })` do fakeApi (sem latência, sem persistência) e faça `vi.mock("next/navigation", …)` com `useRouter`/`usePathname`/`useSearchParams` falsos. Cubra: carrega e mostra conteúdo; erro com `taxaErro: 1` e "Tentar de novo"; o fluxo principal da tela (ex.: registrar pagamento → toast → indicador muda). Stubs de `ResizeObserver`/`matchMedia` no próprio teste se faltarem.

## Verificação antes de terminar

`npx tsc --noEmit`, `npx eslint src/features/<modulo> src/app` (e arquivos de padrões que criou), `npx vitest run src/features/<modulo>`, `npx prettier --write <seus arquivos>`. **Não** rode `next build`/`next dev`, `storybook`, `playwright` nem `prettier --write .` (há agentes em paralelo; erros de tsc/eslint em arquivos de outros agentes não são seus). Não edite arquivos fora dos seus (domínio, fakeApi, átomos, `src/features/dados`, `src/features/shell`, tokens, configs): precisa? descreva no relatório. Não faça commit.

## Relatório final (máx. 15 linhas)

Arquivos criados, RFs atendidos (e os S não atendidos, com motivo), nº de testes, compostos novos, problemas encontrados em compostos/fakeApi/domínio e pedidos de mudança.
