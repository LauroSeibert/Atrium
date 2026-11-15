# Atrium — Design System

> Fonte da verdade: [`tokens.json`](./tokens.json) (formato W3C Design Tokens).
> `src/styles/tokens.css` é **gerado** (`npm run tokens`) e é o único arquivo do código com cores literais.
> Referência visual: rota **`/design-system/colors`**.

## 1. Regra de ouro

O código usa **apenas tokens semânticos** (`--bg`, `--text`, `--primary`…) ou as classes Tailwind ligadas a eles (`bg-surface`, `text-text-muted`, `border-border-strong`…).
Escalas (`--green-500`) e cores de marca (`--brand-green`) existem para ilustração, gráficos e casos documentados, nunca para UI comum.
O Tailwind teve os defaults de cor, raio, sombra, fonte e easing zerados: valores fora do sistema nem geram utilitário.

`npm run check:hex` falha se aparecer qualquer cor literal (hex, `rgb()`, `hsl()`, `oklch()`…) em `src/` ou `public/` fora de `tokens.css`.

## 2. Marca: neutros + um acento

> Refinamento de design (pós-Fase 9, `docs/BRIEF-REDESIGN.md`): saíram o bege e o ocre. A estrutura é feita de cinzas, bordas e tipografia; o verde perene é o **único acento**.

| Cor          | HEX       | Onde entra                                                                                                             |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------- |
| Branco       | `#FFFFFF` | Fundo (`--bg`) e superfícies (`--surface`)                                                                             |
| Cinzas       | escala    | `--bg-subtle` (sidebar, cabeçalho de tabela), `--surface-muted` (hover, chips, item ativo), `--border`, `--text-muted` |
| Grafite      | `#171717` | Texto principal                                                                                                        |
| Verde perene | `#023933` | Ação primária, seleção, indicador ativo, links, ícone do item ativo. Nunca área grande                                 |

Cores de estado (sucesso, alerta, erro) só para estados reais. No tema escuro o fundo é preto neutro (`#0A0A0A`), as superfícies sobem em degraus de cinza e o verde clareia (`#5CC2AD`) para virar a ação.

## 3. Escalas

`green` gerada em OKLCH preservando o matiz (`scripts/tokens.mjs`), âncora `green-900 = #023933`. `neutral` é cinza puro (croma 0). Escalas servem a ilustração e documentação; a UI usa os semânticos.

## 4. Tokens semânticos — quando usar

| Token                                                          | Use para                                                                                                                 | Não use para                                                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--bg`                                                         | Fundo da página                                                                                                          | Cards                                                                                                                                            |
| `--bg-subtle`                                                  | Sidebar, faixas de seção, cabeçalho de tabela                                                                            | Texto                                                                                                                                            |
| `--surface`                                                    | Cards, tabelas, painéis                                                                                                  | Fundo da página                                                                                                                                  |
| `--surface-raised`                                             | Popover, menu, modal, toast                                                                                              | Cards comuns                                                                                                                                     |
| `--surface-muted`                                              | Chips, tags, avatar sem foto, destaque                                                                                   | Áreas grandes, **fundo de inputs/controles** (borda < 3:1), **texto de status** (success/warning < 4,5:1; chips de status usam o próprio `*-bg`) |
| `--border`                                                     | **Divisórias decorativas** (linhas entre itens, contorno de card)                                                        | Contorno de input/checkbox (< 3:1)                                                                                                               |
| `--border-strong`                                              | **Inputs, selects, checkboxes, radios, toggles**, hover de card                                                          | Divisórias (pesado demais)                                                                                                                       |
| `--text`                                                       | Texto principal, títulos                                                                                                 | —                                                                                                                                                |
| `--text-muted`                                                 | Rótulos, ajuda, metadados                                                                                                | Texto essencial longo                                                                                                                            |
| `--primary` / `--primary-hover`                                | Botão primário, links, item ativo, ícone de ação                                                                         | Fundos grandes                                                                                                                                   |
| `--on-primary`                                                 | Texto/ícone sobre `--primary`                                                                                            | Texto sobre fundo claro                                                                                                                          |
| `--ring`                                                       | Anel de foco: `outline: 2px solid var(--ring); outline-offset: 2px` (o offset é obrigatório: `ring` × `primary` < 3:1)   | Bordas comuns                                                                                                                                    |
| `--success/-bg`, `--warning/-bg`, `--danger/-bg`, `--info/-bg` | Badges, alertas, validação. Texto colorido sobre `-bg` **ou** sobre `surface`                                            | Decoração (cor sempre acompanhada de ícone/texto)                                                                                                |
| `--accent-ochre`                                               | Séries de gráfico, preenchimentos                                                                                        | Texto                                                                                                                                            |
| `--chart-1` … `--chart-5`                                      | Séries de gráfico (barra, linha, fatia), ≥ 3:1 sobre `surface`/`surface-raised` nos dois temas; 1 = vendas, 2 = locações | Texto; cor como único sinal (sempre legenda/rótulo e tabela alternativa)                                                                         |

## 5. Contraste (Gate 1)

Todas as combinações usadas estão em [`contrast.json`](./contrast.json) e são verificadas nos **dois temas** por `npm run check:contrast` (todas aprovadas; o número exato aparece na página de cores).

- Texto: **≥ 4,5:1** (WCAG 2.2, 1.4.3).
- Bordas de controles e foco: **≥ 3:1** (1.4.11).
- Divisórias decorativas (`--border`) são isentas: não identificam controles.
- Cores com alpha são compostas sobre o fundo antes do cálculo; fundos translúcidos são recusados pelo script.
- Proibições de uso (combinações que **não** passam) ficam em `contrast.json → decorative`.

### Correções técnicas sobre o guia original

Registradas em [`adjustments.json`](./adjustments.json) e exibidas na página de cores.

| Token                      | Antes     | Depois    | Motivo                                                                               |
| -------------------------- | --------- | --------- | ------------------------------------------------------------------------------------ |
| `--border-strong` (claro)  | `#CFC0A3` | `#95876C` | 1,58:1 sobre `bg-subtle`; input precisa de 3:1                                       |
| `--text-muted` (claro)     | `#5E6E6A` | `#546360` | 3,92:1 sobre `surface-muted`                                                         |
| `--ring` (claro)           | `#2F8F83` | `#26887C` | 2,95:1 sobre `surface-muted`                                                         |
| `--border-strong` (escuro) | —         | `#608983` | Não existia; `--border` escuro tem 1,34:1. Precisa de 3:1 também em `surface-raised` |
| Ocre                       | `#C58A3E` | `#B87D30` | 2,61:1 sobre `bg-subtle`; série de gráfico precisa de 3:1                            |
| Estados (escuro)           | —         | 8 tokens  | Não existiam; todos ≥ 4,5:1                                                          |
| `--surface-raised`         | —         | novo      | Elevação no escuro = cor + borda                                                     |

## 6. Tipografia, espaço, forma e movimento

> Nomes no CSS: os tokens de forma/movimento usam prefixos próprios em `tokens.css` (`--corner-*`, `--elevation-*`, `--easing-*`, `--weight-*`, `--line-height-*`, `--letter-spacing-*`) e o Tailwind os expõe com os nomes do guia (`--radius-*`, `--shadow-*`, `--ease-*`, `--font-weight-*`, `--leading-*`, `--tracking-*`). Isso evita variáveis que apontam para si mesmas. Os defaults do Tailwind nesses namespaces foram zerados, e `transition` usa `--dur-base` + `ease-standard`.

- **Fonte:** Geist via `next/font` (`--font-sans`) e Geist Mono (`font-mono`) só para identificadores (AT-0042, CT-2026-0023). Números de tabela/KPI com a classe `tnum` (`font-feature-settings: "tnum"`).
- **Escala (1.2):** `text-xs 12` · `text-sm 14` · `text-base 16` · `text-lg 18` · `text-xl 24` · `text-2xl 32` · `text-3xl 40`. Corpo 14 px com `line-height 1.5`; títulos `1.2`, `tracking-tight` (−0,02em). Título de página 24 px (32 no desktop); título de seção/painel 16 px semibold; rótulos 12–14 px `text-muted`.
- **Espaçamento:** grade de 4 px (`--spacing: 4px` → `p-1 = 4`, `p-2 = 8`, `p-3 = 12`, `p-4 = 16`, `p-6 = 24`, `p-8 = 32`, `p-12 = 48`, `p-16 = 64`). Prefira esses passos.
- **Raio:** `rounded-sm 6` · `rounded-md 8` (controles) · `rounded-lg 12` (painéis, fotos) · `rounded-xl 16` · `rounded-full`.
- **Sombra:** `shadow-1/2/3` neutras e leves. Profundidade vem de borda e superfície: painéis não têm sombra; `shadow-2/3` só em camadas flutuantes (menu, popover, modal, toast); `shadow-1` em botão secundário e no segmento ativo.
- **Duração:** `--dur-fast 120ms` · `--dur-base 200ms` · `--dur-slow 320ms` · `--dur-page 450ms`. Com `prefers-reduced-motion`, todas viram 1 ms. Laços: `--loop-shimmer 1400ms` (skeleton); não vira 1 ms, o laço é desligado.
- **Easing:** `ease-standard`, `ease-enter`, `ease-exit`, `ease-spring`.
- **Peso:** `font-regular 400` · `font-medium 500` · `font-semibold 600` · `font-bold 700`. **Tracking:** `tracking-tight` · `tracking-normal` · `tracking-wide` (eyebrows em caixa alta).
- **Z-index:** `--z-base 0` · `--z-sticky 10` · `--z-dropdown 20` · `--z-overlay 30` · `--z-modal 40` · `--z-popover 45` (popover, menu, select, tooltip: abrem dentro de modais) · `--z-toast 50`.

## 7. Logo

O átrio da _domus_ romana visto de cima: o ladrilho é a casa, o quadrado com diagonais é o telhado de quatro águas (compluvium) e o quadrado central é o _impluvium_, o espelho d'água que recebe a chuva.

- Componente: `src/components/brand/AtriumLogo.tsx` (`<AtriumMark />` e `<AtriumLogo />`), usa `--primary`/`--on-primary` e se adapta ao tema sozinho.
- Arquivos avulsos: [`brand/atrium-mark.svg`](./brand/atrium-mark.svg) (adapta via `prefers-color-scheme`), [`brand/atrium-logo-light.svg`](./brand/atrium-logo-light.svg), [`brand/atrium-logo-dark.svg`](./brand/atrium-logo-dark.svg).
- Área de respiro mínima: ¼ da altura do símbolo. Tamanho mínimo do símbolo: 16 px.

## 8. Ilustrações

Biblioteca SVG flat/geométrica em `src/assets/svg/` (componentes React), vitrine em **`/design-system/illustrations`**: 8 fachadas (`SvgFachada variant="sobrado"`), 8 cômodos (`SvgComodo`), 4 estados vazios (`SvgVazio`), 6 avatares ilustrados + iniciais (`AvatarIlustrado`, `AvatarIniciais`). `PropertyImage` (`src/components/patterns/`) escolhe a fachada pelo imóvel e tem fallback "Sem ilustração".

- **Paleta própria, semântica e com tema:** `--illus-sky` (céu/fundo), `--illus-ground` (chão), `--illus-wall` (volume principal), `--illus-wall-alt`, `--illus-roof`, `--illus-detail` (janelas/portas), `--illus-ink` (traços), `--illus-accent` (verde-acinzentado, só decorativo). No claro: céu cinza claro, volumes verde perene, detalhes brancos; no escuro inverte (céu grafite, volumes verde claro). Escalas fixas (`--green-*`) não mudam com o tema e não entram nas ilustrações.
- **Contraste:** silhueta (`wall`, `wall-alt`, `roof`) ≥ 3:1 sobre `sky` e detalhes ≥ 3:1 sobre `wall`, nos dois temas (`contrast.json`). O acento é decorativo.
- **Técnica:** raiz comum `Ilustracao` (`role="img"` + `<title>` via `aria-labelledby`, ou `decorativa` → `aria-hidden`); `viewBox` 400×300 (4:3) para cenas, 240×180 para vazios, 64×64 para avatares; sem gradiente, filtro ou texto (exceto as iniciais, que usam `--surface-muted`/`--text` e `--primary`/`--on-primary`). Testes conferem que todo `fill`/`stroke` é `var(--illus-*)` (`paleta.testutil.ts`). Regras para novas peças: `docs/BRIEF-ILUSTRACOES.md`.
- **Otimização:** as peças são JSX escrito à mão com poucas formas e coordenadas inteiras (o equivalente ao resultado do SVGO); não há arquivos `.svg` soltos para otimizar.

## 9. Fluxo para mudar uma cor

1. Edite `design-system/tokens.json`.
2. `npm run tokens` (regenera escalas e `tokens.css`).
3. `npm run check` (tokens em dia, contraste, zero hex, typecheck).
4. Confira `/design-system/colors` nos dois temas.

## 10. Princípios de UI/UX

Referências que guiam as decisões de tela no painel (dashboard de KPIs, lista de imóveis com filtros, kanban de leads, tabela de contratos/pagamentos). Em conflito, vale o token; o princípio explica o porquê.

### 10.1 Heurísticas de Nielsen

[10 Heurísticas de Usabilidade, Nielsen Norman Group](https://www.nngroup.com/articles/ten-usability-heuristics/): dez regras gerais que todo fluxo de interface deve respeitar.

- **Visibilidade do status:** toda lista, kanban e tabela tem estados de carregando (skeleton com a forma final), vazio, erro e sucesso; ações assíncronas mostram progresso no próprio botão e confirmam em toast (`--z-toast`).
- **Prevenção de erros:** ações destrutivas (excluir imóvel, cancelar contrato) pedem confirmação com o nome do item e oferecem "Desfazer" quando possível.
- **Reconhecer em vez de lembrar:** filtros ativos da lista de imóveis aparecem como chips removíveis acima da tabela, com contagem de resultados.
- **Consistência:** o mesmo componente para o mesmo papel (status de lead e de pagamento usam o mesmo `Badge`); nada de hex solto, só tokens semânticos (seção 4).

### 10.2 WCAG 2.2

[WCAG 2.2, W3C](https://www.w3.org/TR/WCAG22/): critérios de acessibilidade, nível AA como mínimo do projeto.

- **Contraste (1.4.3, 1.4.11):** já verificado por `npm run check:contrast` (seção 5); não crie par de cor fora dos tokens sem rodar o gate.
- **Foco visível e não obscurecido (2.4.7, 2.4.11):** sempre `outline: 2px solid var(--ring); outline-offset: 2px`; cabeçalho e coluna fixa (`--z-sticky`) não podem cobrir o elemento focado (use `scroll-margin`).
- **Tamanho do alvo (2.5.8):** o mínimo da norma é 24×24 px; o padrão do projeto é maior: botão `md` com 40 px no desktop e 44 px no mobile. Ícone-botão em linha de tabela também respeita 40 px de área clicável.
- **Erros (3.3.1, 3.3.3):** campo inválido mostra mensagem em texto junto ao campo, com ícone e `aria-describedby`, e a sugestão de correção ("CPF deve ter 11 dígitos"); inputs mantêm `--border-strong`.
- **Mensagens de status (4.1.3):** toasts, "salvo" e a contagem de resultados após filtrar são anunciados por _live region_ (`role="status"`), sem tirar o foco do usuário.
- **Reflow e zoom (1.4.10, 1.4.4):** nada de rolagem horizontal da página em 320 px CSS ou com zoom de 200 %; tabelas largas rolam dentro do próprio contêiner.
- **Arrastar (2.5.7):** todo card do kanban de leads tem alternativa sem arrastar: menu "Mover para…" (teclado e toque). O drag é só atalho.

### 10.3 Laws of UX

[Laws of UX](https://lawsofux.com/): coletânea de princípios de psicologia aplicados a interface.

- **Hick:** menos opções por tela; filtros avançados da lista de imóveis ficam recolhidos em "Mais filtros", e ações secundárias da linha vão para um menu "⋯".
- **Fitts:** alvos frequentes são grandes e próximos; ação principal do formulário fica no rodapé do cartão, alinhada à direita, com altura 40/44 px.
- **Von Restorff:** um destaque por vista, ou seja, um único botão primário (`--primary`, a cor dos 10% do 60-30-10). Demais ações são secundárias ou fantasma; o KPI crítico (ex.: pagamentos em atraso) é o único com cor de alerta no valor. A seta de variação (▲▼) de cada KPI usa cor de sucesso/erro, sempre com ícone e texto, e não conta como destaque.
- **Proximidade e Região comum:** campos relacionados ficam agrupados no mesmo card (`rounded-lg`) com espaço interno maior que o espaço entre grupos; KPIs de um mesmo tema compartilham um bloco.

### 10.4 Movimento

[Material Design 3: Motion](https://m3.material.io/styles/motion/overview) e [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion): movimento com propósito, curto e interrompível.

- **Propósito:** anime só para explicar mudança (card que muda de coluna, painel que abre, toast que entra). Nada de animação decorativa em tabelas ou KPIs.
- **Curto:** hover e foco em `--dur-fast`; transições de componente em `--dur-base` com `ease-standard`; entrada com `ease-enter`, saída com `ease-exit`; `--dur-page` só para troca de página.
- **Interrompível:** animar `opacity`/`transform`, nunca bloquear a interação enquanto anima.
- **Reduzir movimento:** respeite `prefers-reduced-motion`; os tokens de duração já viram 1 ms, então use sempre os tokens, nunca `ms` literal. Laços param (`animation-iteration-count: 1` global; o Spinner, com `data-giro`, segue girando por ser status essencial), o shimmer some e hovers não deslocam (`motion-reduce:hover:translate-y-0`).

#### Catálogo de movimento (Fase 9)

| Contexto                        | Efeito                                                                                                                                                                                                           | Token                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Troca de módulo                 | `animate-page-in` (fade + 8 px) no `template.tsx`                                                                                                                                                                | `--dur-slow`, enter                 |
| Conteúdo carregado              | raiz do conteúdo (não o skeleton) com `animate-fade-in`; não repete no refetch                                                                                                                                   | `--dur-base`, enter                 |
| Skeleton                        | `animate-shimmer`: faixa clara atravessa (`bg-subtle`; no escuro `border-strong`/25), só `transform`                                                                                                             | `--loop-shimmer`                    |
| Botão                           | `active:scale-98`                                                                                                                                                                                                | `--dur-fast`                        |
| Card interativo                 | borda passa a `border-strong`; card de imóvel: foto aproxima 2 % e o título sublinha                                                                                                                             | `--dur-base`/`--dur-slow`, standard |
| Popover, menu, select, combobox | `scale-in`/`scale-out` a partir da origem do gatilho (`origin-(--radix-…-transform-origin)`); chevron do select gira                                                                                             | `--dur-base` / `--dur-fast`         |
| Dialog / Drawer                 | overlay em fade; conteúdo `scale-in` ou slide lateral; saída mais curta                                                                                                                                          | `--dur-base`–`--dur-slow`           |
| Toast                           | entra `slide-in-up`, sai em fade; arrastar para a direita segue o dedo e sai deslizando                                                                                                                          | `--dur-base` / `--dur-fast`         |
| Abas                            | painel novo `animate-fade-in`; sublinhado troca de cor com transição                                                                                                                                             | `--dur-base`                        |
| Checkbox, radio, favoritar      | só transição de cor/fundo; sem keyframe (repetiria em todos os itens marcados na carga)                                                                                                                          | `--dur-fast`                        |
| Sidebar                         | largura animada; rótulos e logo entram em fade ao expandir; indicador ativo desliza (`layoutId`)                                                                                                                 | `--dur-base` / `--dur-slow`         |
| Kanban                          | vizinhos deslizam no arraste; card levantado com `rotate-1` + `shadow-3`; coluna-alvo destaca; card entra com `scale-in` ao chegar (keyframe usa a propriedade `scale`, que compõe com o `transform` do dnd-kit) | `--dur-base` / `--dur-fast`         |
| Galeria                         | slide novo entra em fade ao trocar de cômodo                                                                                                                                                                     | `--dur-base`                        |
| Tema                            | crossfade via View Transitions (`trocarComTransicao`), pulado com reduced-motion                                                                                                                                 | `--dur-base`                        |

Fora do catálogo, de propósito: count-up de KPI, stagger de cards e reordenação animada de listas (chamam atenção sem explicar mudança).

### 10.5 Refactoring UI

[Refactoring UI, Wathan & Schoger](https://www.refactoringui.com/): táticas práticas de hierarquia visual.

- **Hierarquia por peso e cor, não só tamanho:** valor do KPI em `font-semibold` + `tnum`; rótulo em `--text-muted` e `text-sm`.
- **Menos bordas:** separe linhas da tabela com espaço e `--border` sutil (ou zebra leve), reservando `--border-strong` para controles interativos.
- **Espaço generoso:** prefira `p-6` em cards e `gap-4` entre campos; densidade extra só em tabelas, por opção do usuário.
- **Rebaixar o secundário:** metadados (data de criação, corretor, ID) em `--text-muted`; o que decide a ação (status, valor, vencimento) em texto normal.

### 10.6 Gestalt e grade 4/8 px

[Gestalt: Proximidade, Nielsen Norman Group](https://www.nngroup.com/articles/gestalt-proximity/): itens próximos são percebidos como relacionados.

- **Só valores da grade de 4 px** (`--spacing: 4px`): `p-1/2/3/4/6/8`; sem `13px` ou `margin: 7px`. Prefira múltiplos de 8 entre seções.
- **Espaço interno < espaço externo:** o intervalo entre rótulo e campo é menor que entre um campo e o próximo; entre colunas do kanban, maior que entre cards da mesma coluna.
- **Raio coerente:** card `rounded-lg`, controles `rounded-md`, chips `rounded-full`; aninhado usa raio menor que o pai.
- **Um acento:** fundo e superfícies neutros; `--primary` só onde há ação, seleção ou indicador.

### 10.7 Menos é mais

Cada texto na tela compete pela atenção. Antes de acrescentar um rótulo, subtítulo, _eyebrow_ ou linha de apoio, pergunte se ele muda o que a pessoa decide ou faz; se não muda, corte.

- **Título que diz o que é (ou o que fazer)**, sem subtítulo explicando o óbvio. Uma linha de instrução só quando a ação não é evidente.
- **Itens de lista com nome + no máximo uma linha curta de contexto.** Metadados que não decidem nada saem (ou vão para leitor de tela/tooltip).
- **Nada de repetir:** a trilha não repete o `h1`; o botão não repete o título do card; o avatar basta na topbar (nome e papel ficam no menu).
- **Sem indicadores de atalho na interface** (⌘K, Esc, teclas em menus e na paleta). Os atalhos continuam funcionando e são anunciados com `aria-keyshortcuts`; o átomo `Kbd` fica só para documentação/ajuda.
- **Acessibilidade não é desculpa para poluir:** contexto extra vai em `sr-only`, nunca em texto visível redundante.

### Checklist de revisão de tela

- [ ] Nenhum rótulo, subtítulo ou texto de apoio que não mude a decisão (§10.7).
- [ ] Tem estados de carregando, vazio, erro, sucesso e parcial (dados incompletos ou falha em parte da tela).
- [ ] Completa só com teclado: ordem de tab lógica, foco visível com `--ring`, Esc fecha overlays.
- [ ] Uma única ação primária na vista; as demais são secundárias ou fantasma.
- [ ] A cor nunca é o único sinal: status tem texto e/ou ícone além da cor.
- [ ] Números, valores e datas em tabelas e KPIs usam `tnum` e alinhamento à direita.
- [ ] Alvos clicáveis com 40 px (desktop) e 44 px (mobile); nunca abaixo de 24×24 px.
- [ ] Todo arrastar (kanban, ordenação) tem alternativa "Mover para…".
- [ ] Erros de formulário dizem o que houve e como corrigir, junto do campo.
- [ ] Espaçamentos só da grade de 4 px; sem hex, sem `ms` e sem sombra literais.
- [ ] Metadados em `--text-muted`; movimento só com tokens `--dur-*` e easings, e a tela funciona com `prefers-reduced-motion`.
- [ ] Ações destrutivas pedem confirmação e oferecem desfazer.

## 11. Shell do painel (Fase 7)

Componentes em `src/components/layout/` (catálogo **Shell/** no Storybook), todos só com props; o contêiner `src/features/shell/PainelShell.tsx` liga roteador, tema, preferências e `fakeApi`.

| Peça                             | Comportamento                                                                                                                                                                                                  | Requisitos          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `AppShell`                       | Skip link → sidebar (≥ 1024 px) ou trilho de ícones (768–1023 px) → topbar fixa (56 px) → `<main id="conteudo">` com **largura máx. 1280 px** (`max-w-320`) e padding 16/32/40 px.                             | RNF-01, RNF-03      |
| `Sidebar` + `NavegacaoPrincipal` | Logo, 5 módulos + Configurações no rodapé. Item ativo com `aria-current="page"` e indicador que desliza (`motion` `layoutId`, `--dur-slow`). Recolhível (64 px, só ícones + tooltip, nome acessível completo). | RF-01, RF-60        |
| Badges                           | Leads novos (`info`) e parcelas atrasadas (`danger`), calculados no domínio (`contadoresNavegacao`). Acima de 99 vira "99+"; o número exato fica no nome acessível.                                            | RF-62               |
| `MobileNav`                      | Abaixo de 768 px a navegação vira drawer à esquerda (alvos de 44 px); escolher um item fecha. No tablet, `Sidebar recolhida fixa` (trilho).                                                                    | RF-01, RF-63        |
| `Topbar`                         | Menu (mobile), breadcrumb a partir do 2º nível (no mobile só a página atual), busca ⌘K, notificações, tema e avatar.                                                                                           | RF-02, RF-03, RF-61 |
| `NotificationCenter`             | Sino com contagem de não lidas, lista em popover, "Marcar todas como lidas"; abrir marca como lida. Regra de vencimento/atraso no domínio (`listarNotificacoes`).                                              | RF-64               |
| `UserMenu`                       | Nome e papel, troca de persona de demonstração, Configurações.                                                                                                                                                 | RF-08, RF-50        |
| `PageHeader` + `MobileActionBar` | `h1`, descrição, ações. A ação primária fica no cabeçalho no desktop e numa barra inferior fixa abaixo de 768 px (portal no `body`, área segura do iPhone via `pb-safe`).                                      | RF-61, RF-63        |
| `PageSkeleton`                   | `loading.tsx` de cada rota: forma final de cabeçalho + conteúdo (lista, painel ou detalhe), sem salto de layout.                                                                                               | RNF-07, RNF-09      |
| `TransicaoDeRota`                | `template.tsx` do grupo `(dashboard)`: fade + 8 px ao trocar de módulo (`--dur-slow`, `ease-enter`); com movimento reduzido, 1 ms.                                                                             | Guia §7             |

**Sidebar (refinamento):** fundo cinza suave (`--bg-subtle`), itens de 36 px, item ativo numa pílula `--surface-muted` com o ícone em `--primary` (referência enviada pelo Lauro: suave, sem preenchimento sólido). Contadores só como número discreto; cor de estado apenas no que pede atenção (parcelas atrasadas). A variante `tom="marca"` (sidebar escura) continua no catálogo.

**Persistência (RNF-16):** tema pelo `next-themes`; sidebar recolhida em `localStorage` (`atrium:sidebar-recolhida`) via `usePreferencia` (`src/lib/preferencias.ts`), tolerante a storage bloqueado. **Movimento em JS:** `src/lib/motion.ts` lê `--dur-*`/`--easing-*` do CSS; nenhuma duração literal no `motion`.

**Trilha:** derivada da rota (`trilhaDaRota`); a tela que conhece o nome real do registro usa `<DefinirTrilha rotulo="AT-0012" />` (`src/features/shell/trilha.ts`).

## 12. Padrões do refinamento

- **Nem tudo é card.** `SectionCard variante="painel"` agrupa um objeto (gráfico, formulário, resumo); `variante="aberta"` é título + divisória para listas (agenda, atividades).
- **KPIs em faixa:** `StatGroup` + `StatCard variante="celula"`: um painel, divisórias de 1 px, 2 colunas no celular/tablet e N no desktop; valor, mini tendência à direita e variação em uma linha.
- **Gráficos:** grade só horizontal e sem tracejado, eixo Y com 4 marcas, legenda em pontos de 8 px, alternância Gráfico/Tabela só com ícones (nome acessível mantido).
- **Listas:** horário em coluna fixa à esquerda, título em uma linha, contexto em `text-xs` muted; linhas separadas por `divide-border`.
- **Imóveis:** foto (ou ilustração) é a protagonista, sem caixa em volta; status sobre a foto; preço em destaque; código em `font-mono`.
- **Tabelas:** cabeçalho 12 px muted em `bg-subtle`; identificadores em mono; datas e tipo do contrato como segunda linha da 1ª coluna para caber em 1280 px.
