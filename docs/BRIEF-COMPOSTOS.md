# Brief para criação de compostos (Fase 6)

Leia antes: `CLAUDE.md`, `design-system/DESIGN_SYSTEM.md` (§4 tokens e §10 princípios), `docs/ESTADOS-E-FLUXOS.md` (§2 regras e §3.6 estado de tela), `docs/BRIEF-ATOMOS.md` (as regras dos átomos continuam valendo) e os átomos em `src/components/ui/`. Use os requisitos de `docs/REQUISITOS.md` (cite RF-xx no comentário do componente).

## Onde e como

- **Arquivos:** `src/components/patterns/<Nome>.tsx` (um composto por arquivo; subcomponentes pequenos do mesmo composto podem ficar no mesmo arquivo), `<Nome>.stories.tsx` (título `Padrões/<Nome>`) e `<Nome>.test.tsx`. Não edite arquivos fora dos seus (nada de `globals.css`, tokens, `package.json`, `eslint.config.mjs`, átomos, domínio). Precisa de algo neles? **Não mexa**: descreva no relatório.
- **Use só átomos + domínio (tipos) + mock nas histórias.** Átomos: `Button`, `Badge`/`Tag`, `Card`, `Avatar`, `Tooltip`, `Popover`, `DropdownMenu`, `Dialog`, `Drawer`, `AlertDialog`, `Tabs`, `SegmentedControl`, `Pagination`, `Skeleton`, `Spinner`, `Progress`, `Toast`, `Table`, `Input`, `Select`, `Combobox`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `Field`, `Textarea`, `Kbd`, `Divider`, `Typography`, `Icon`. Leia a API de cada átomo antes de usar.
- **Já prontos para você usar:** `EmptyState`, `ErrorState`, `EstadoRecurso` (renderiza os 5 estados de um `Recurso<T>`), `PropertyImage`, `rotulos.ts` (rótulo pt-BR + tom do Badge de cada enum: `STATUS_IMOVEL_UI`, `ETAPA_UI`, `STATUS_CONTRATO_UI`, `STATUS_PARCELA_UI`…). Formatadores pt-BR em `@/lib/format` (`formatMoeda`, `formatArea`, `formatData`, `formatRelativo`, `formatVariacao`, `formatPercentual`, `formatTelefone`…). Ilustrações em `@/assets/svg/*`.
- Dependências disponíveis: `recharts`, `@dnd-kit/core`/`sortable`, `@tanstack/react-table`, `cmdk`, `react-hook-form` + `@hookform/resolvers` + `zod`, `radix-ui`, `lucide-react`, `motion`.

## Regra principal: só props (Gate 6)

- **Nenhuma lógica de tela dentro dos compostos.** Nada de `fakeApi`, `useRecurso`, `fetch`, `localStorage`, roteador ou URL. Dados, estado assíncrono e callbacks chegam por props.
- **Estado assíncrono é `Recurso<T>`** (`@/lib/recurso`), nunca booleanos (`isLoading`, `hasError`). Compostos de painel/coleção recebem `estado: Recurso<T>` e `onTentarNovamente?`, e usam `EstadoRecurso`. Cards de item único exportam um `<Nome>Skeleton` com a forma final.
- **A UI pergunta, não decide (ESTADOS §2 regra 3).** O composto **não** sabe quais transições são permitidas: recebe isso pronto. Ex.: `destinos: { etapa: Etapa; permissao: Permissao }[]`, `podeSoltar(id, coluna) => Permissao`, `podeRegistrar: Permissao`, status de parcela já derivado. Permissão negada = controle desabilitado com o `motivo` visível (tooltip ou texto). Proibido `if (status === "ativo")` para decidir regra; mapear enum → rótulo/tom (`rotulos.ts`) é apresentação e pode.
- **Nunca mude estado de entidade.** O composto emite intenção (`onMover(leadId, para)`, `onRegistrarPagamento(numero)`, `onAlternarFavorito(id)`), quem chama aplica pelo domínio. Estado local de UI puro (aberto/fechado, slide atual, arraste em andamento, texto digitado) pode ficar no componente; quando representar fases, use união discriminada.
- Nas **histórias**, monte as props a partir do mock: `BASE_HISTORIAS`, `CASOS_HISTORIAS`, `AGORA_HISTORIAS`, `HOJE_HISTORIAS` de `@/mocks/data/historias`, e funções do domínio (`@/domain`: `transicoesPermitidasLead`, `podeTransicionarLead`, `statusParcela`, `statusExibicao`, `calcularDashboard`, `funilDeLeads`…). Callbacks com `fn()` de `storybook/test`.

## Histórias obrigatórias por composto (Gate 6)

`Normal`, `Carregando`, `Vazio`, `Erro`, `DadosExtremos` (texto longo, valores máximos/mínimos, muitos itens, zero) e as variantes do próprio composto. Quando um estado não se aplica (ex.: `ConfirmDestructive` não carrega dados), cubra o equivalente (ex.: `Processando`, `ErroAoConfirmar`) e diga no relatório. Histórias com `play` para interações importantes são bem-vindas.

## Visual, responsivo e acessibilidade

- Só tokens (as regras de lint dos átomos valem). Gráficos: séries `var(--chart-1)` … `var(--chart-5)` (classes `fill-chart-1`, `bg-chart-1`…), grade com `var(--border)`, eixos/texto com `var(--text-muted)`; ocre nunca em texto. Valores e números com `tnum` e alinhados à direita em tabelas.
- **Responsivo em 360 / 768 / 1280 / 1920 px**: sem rolagem horizontal da página em 360 px (tabelas e kanban rolam dentro do próprio contêiner, com `tabIndex={0}` e rótulo na região rolável). Alvos de 40 px (44 px em mobile).
- **Teclado completo** (padrão WAI-ARIA de cada widget), foco visível com `--ring`, nome acessível em pt-BR, cor nunca é o único sinal, `role="status"` para anúncios (contagem de resultados, "movido para…"). Arrastar sempre tem alternativa ("Mover para…").
- Movimento: só tokens `--dur-*`/easings, e funcionar com `prefers-reduced-motion`.

## Testes (Vitest + Testing Library + user-event)

Comportamento: renderiza os estados do `Recurso`, callbacks com os argumentos certos, teclado (setas/Enter/Espaço/Esc conforme o widget), nome acessível, permissão negada desabilita e mostra o motivo. Não teste estilo. Em jsdom, `ResizeObserver` e `matchMedia` podem faltar: crie stubs no próprio teste.

## Verificação antes de terminar

`npx tsc --noEmit`, `npx eslint src/components/patterns`, `npx vitest run src/components/patterns/<seus arquivos>`, `npx prettier --write <seus arquivos>`. **Não** rode `storybook build`, `test:stories`, `playwright` nem `prettier --write .` (outros agentes trabalham em paralelo; erros de tsc/eslint em arquivos de outros agentes não são seus — ignore-os). Não faça commit.

## Relatório final (máx. 12 linhas)

Compostos criados, API (props principais), histórias e nº de testes, decisões relevantes, e pedidos de mudança em arquivo compartilhado.
