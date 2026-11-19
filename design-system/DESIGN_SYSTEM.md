# Atrium — Design System

> Fonte da verdade: [`tokens.json`](./tokens.json) (formato W3C Design Tokens).
> `src/styles/tokens.css` é **gerado** (`npm run tokens`) e é o único arquivo do código com cores literais.
> Referência visual: rota **`/design-system/colors`**.

## 1. Regra de ouro

O código usa **apenas tokens semânticos** (`--bg`, `--text`, `--primary`…) ou as classes Tailwind ligadas a eles (`bg-surface`, `text-text-muted`, `border-border-strong`…).
Escalas (`--green-500`) e cores de marca (`--brand-green`) existem para ilustração, gráficos e casos documentados, nunca para UI comum.
O Tailwind teve os defaults de cor, raio, sombra, fonte e easing zerados: valores fora do sistema nem geram utilitário.

`npm run check:hex` falha se aparecer qualquer cor literal (hex, `rgb()`, `hsl()`, `oklch()`…) em `src/` ou `public/` fora de `tokens.css`.

## 2. Marca: quiet luxury

> Reformulação de 2026-11-16 (`docs/BRIEF-REDESIGN.md` §2): o painel deve parecer um banco privado ou um estúdio de arquitetura, não um SaaS genérico. Substitui a fase "neutros + verde perene".

| Cor       | HEX       | Onde entra                                                                                                  |
| --------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| Porcelana | `#F6F4EF` | Fundo do app (`--bg`)                                                                                       |
| Papel     | `#FFFFFF` | Cards, inputs, popovers (`--surface`)                                                                       |
| Tinta     | `#17150F` | Texto, botão primário, sidebar (`--sidebar #121110`) e no máximo **um** painel de destaque por tela         |
| Pedra     | `#D9D2C3` | Barras de períodos não atuais, pontos vazios                                                                |
| Latão     | `#9A7B4F` | **Único acento**, só em preenchimentos e marcas: período atual, progresso, item ativo, ponto de notificação |

Princípios: **os números são o herói** (serifa nos KPIs; dinheiro de tabela em Geist com algarismos tabulares); **fios em vez de caixas** (poucos cards, nunca card dentro de card); **um acento, com parcimônia** (2–5 usos por tela, nunca texto, botão ou fundo grande); **tinta para o que importa**; **calmo, depois denso** (cabeçalho editorial, depois os dados); **só neutros quentes**. Na dúvida: tire uma borda, tire uma cor, dê espaço.

## 3. Escalas

`brass` gerada em OKLCH preservando o matiz (`scripts/tokens.mjs`), âncora `brass-600 = #9A7B4F`. `warm` são neutros quentes no matiz da tinta (croma baixo, nada de cinza frio). Escalas servem a ilustração e documentação; a UI usa os semânticos.

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
| `--accent` (latão)                                             | Barra do período atual, preenchimento de progresso, ponto de notificação, amostra de legenda, item ativo de abas         | Texto (use `--accent-ink` se for indispensável), botões, fundos maiores que um trilho de progresso                                               |
| `--text-2`, `--placeholder`                                    | Texto de apoio e unidades (`R$`, `mi`); placeholder de input                                                             | Texto essencial                                                                                                                                  |
| `--border-soft`, `--line-strong`                               | Divisória entre linhas dentro de cards; contorno de pílulas e do botão fantasma (decorativos)                            | Contorno de input (use `--border-strong`)                                                                                                        |
| `--surface-sunken`                                             | Ladrilho de imagem/ilustração, trilho da semana                                                                          | Texto `text-muted` por cima                                                                                                                      |
| `--sidebar*`, `--ink-panel`, `--ink-track`, `--on-ink*`        | Sidebar, menu do celular, painel de destaque. Use a classe **`.tinta`**: dentro dela os semânticos viram os do escuro    | Mais de um painel em tinta por tela                                                                                                              |
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

> Nomes no CSS: os tokens de forma/movimento usam prefixos próprios em `tokens.css` (`--corner-*`, `--elevation-*`, `--easing-*`, `--weight-*`, `--line-height-*`, `--letter-spacing-*`) e o Tailwind os expõe com os nomes do guia (`--radius-*`, `--shadow-*`, `--ease-*`, `--font-weight-*`, `--leading-*`, `--tracking-*`). Os defaults do Tailwind nesses namespaces foram zerados.

- **Fontes (`next/font`):** **Instrument Serif** (`font-serif`, utilitário `display`) para títulos de página, de seção e de card, números de KPI e dinheiro grande, sempre peso 400 e nunca em corpo de texto; **Geist** (`font-sans`) para todo o resto, inclusive números, dinheiro, datas, horários e códigos (AT-0020, CT-2026-0020), com o utilitário `num` (algarismos tabulares) onde os números alinham em coluna. **Tipografia v2: só essas duas famílias.** Não há fonte mono; `npm run check:hex` reprova `font-mono` e Geist Mono. Serifa fala (títulos, números de destaque), Geist trabalha (tudo que se lê, compara ou digita); nunca serifa dentro de tabela, lista, pílula, botão ou formulário.
- **Escala:** `text-2xs 11` (eyebrow, eixos) · `xs 12` (pílulas) · `caption 13` (metadados, variações) · `sm 14` (UI) · `md 15` · `base 16` · `lg 18` · `xl 22` (dinheiro em grade de métricas) · serifa: `2xl 30` (card) · `3xl 40` (seção) · `4xl` 44→64 (KPI) · `5xl` 44→68 (H1) · `6xl` 52→88 (resultado do mês). Os três últimos usam `clamp()` para caber em 390 px.
- **Utilitários:** `eyebrow` (11 px, 500, caixa alta, tracking 0,14em, `text-muted`), `display`, `num`, `unidade` (unidade a ~45% do número, em `text-2`). `Destaque` (`ui/Typography`) separa "R$", "mi", "mil" e ",00" do número sozinho.
- **Espaçamento:** grade de 4 px. Calhas 20/40/56 px, conteúdo máx. 1240 px; cabeçalho de página 56 px acima e 36–44 px abaixo; cards com 30 × 32 px de padding (20 no celular); 24 px entre cards, 40–56 px entre faixas.
- **Raio:** `rounded-xs 2` (amostra de legenda) · `rounded-sm 6` · `rounded-md 10` (botões, inputs, segmentos) · `rounded-lg 16` (cards, ladrilhos) · `rounded-xl 20` (faixa hero em tinta) · `rounded-full`.
- **Sombra:** quase nenhuma. Cards têm fio, não sombra. `shadow-1` só no segmento selecionado; `shadow-2` em popovers, menus, modais e toasts.
- **Ícones:** Lucide, traço 1,6, 18 px na navegação e botões, 14–16 px em linha, sempre `currentColor` (nunca latão).
- **Duração:** `--dur-fast 150ms` · `--dur-base 200ms` · `--dur-slow 320ms` · `--dur-page 450ms`; `ease-standard` = `cubic-bezier(0.2, 0, 0, 1)`. Só cor, fundo, opacidade e transform; nada de quicar. Com `prefers-reduced-motion`, 1 ms.
- **Peso:** `font-regular 400` · `font-medium 500` · `font-semibold 600`. **Tracking:** `tight` · `display` · `wide` · `eyebrow`.
- **Z-index:** `--z-base 0` · `--z-sticky 10` · `--z-dropdown 20` · `--z-overlay 30` · `--z-modal 40` · `--z-popover 45` · `--z-toast 50`.

## 7. Logo

Monograma: o átrio da casa romana visto de cima, num quadrado de 32 px (raio 9) em tinta com fio de latão. As quatro águas do telhado descem para a abertura central (as horizontais em `--on-ink-strong`, as laterais em `--on-ink-muted`) e, no centro, o impluvium em latão. Ao lado, "Atrium" em Instrument Serif 27 px.

- Componente: `src/components/brand/AtriumLogo.tsx` (`<AtriumMark />` e `<AtriumLogo />`), só tokens (`--sidebar`, `--accent`, `--on-ink-strong`, `--on-ink-muted`, `--text`).
- Favicon `src/app/icon.svg` e arquivos avulsos em [`brand/`](./brand/) (o monograma é só forma; o nome nos logos avulsos usa fonte de fallback serifada, pois SVG solto não carrega a webfont).

## 8. Ilustrações

Biblioteca SVG flat/geométrica em `src/assets/svg/` (componentes React), vitrine em **`/design-system/illustrations`**: 8 fachadas (`SvgFachada variant="sobrado"`), 8 cômodos (`SvgComodo`), 4 estados vazios (`SvgVazio`), 6 avatares ilustrados + iniciais (`AvatarIlustrado`, `AvatarIniciais`). `PropertyImage` (`src/components/patterns/`) escolhe a fachada pelo imóvel e tem fallback "Sem ilustração".

- **Paleta própria, semântica e com tema:** `--illus-sky` (fundo), `--illus-ground` (chão), `--illus-wall` (volume principal), `--illus-wall-alt`, `--illus-roof`, `--illus-detail` (janelas/portas), `--illus-ink` (traços), `--illus-accent` (latão, só decorativo). No claro: fundo pedra clara, volumes em tinta suave, janelas porcelana, como uma gravura de arquitetura; no escuro inverte (fundo tinta, volumes claros). Escalas fixas não entram nas ilustrações.
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
| `AppShell`                       | Skip link → sidebar (≥ 1024 px) ou trilho de ícones (768–1023 px) → topbar fixa (64 px) → `<main id="conteudo">` com **conteúdo máx. 1240 px** (`max-w-338` com as calhas) e calhas de 20/40/56 px.            | RNF-01, RNF-03      |
| `Sidebar` + `NavegacaoPrincipal` | Logo, 5 módulos + Configurações no rodapé. Item ativo com `aria-current="page"` e indicador que desliza (`motion` `layoutId`, `--dur-slow`). Recolhível (64 px, só ícones + tooltip, nome acessível completo). | RF-01, RF-60        |
| Badges                           | Leads novos (`info`) e parcelas atrasadas (`danger`), calculados no domínio (`contadoresNavegacao`). Acima de 99 vira "99+"; o número exato fica no nome acessível.                                            | RF-62               |
| `MobileNav`                      | Abaixo de 768 px a navegação vira drawer à esquerda (alvos de 44 px); escolher um item fecha. No tablet, `Sidebar recolhida fixa` (trilho).                                                                    | RF-01, RF-63        |
| `Topbar`                         | Menu (mobile), breadcrumb a partir do 2º nível (no mobile só a página atual), busca ⌘K, notificações, tema e avatar.                                                                                           | RF-02, RF-03, RF-61 |
| `NotificationCenter`             | Sino com contagem de não lidas, lista em popover, "Marcar todas como lidas"; abrir marca como lida. Regra de vencimento/atraso no domínio (`listarNotificacoes`).                                              | RF-64               |
| `UserMenu`                       | Nome e papel, troca de persona de demonstração, Configurações.                                                                                                                                                 | RF-08, RF-50        |
| `PageHeader` + `MobileActionBar` | `h1`, descrição, ações. A ação primária fica no cabeçalho no desktop e numa barra inferior fixa abaixo de 768 px (portal no `body`, área segura do iPhone via `pb-safe`).                                      | RF-61, RF-63        |
| `PageSkeleton`                   | `loading.tsx` de cada rota: forma final de cabeçalho + conteúdo (lista, painel ou detalhe), sem salto de layout.                                                                                               | RNF-07, RNF-09      |
| `TransicaoDeRota`                | `template.tsx` do grupo `(dashboard)`: fade + 8 px ao trocar de módulo (`--dur-slow`, `ease-enter`); com movimento reduzido, 1 ms.                                                                             | Guia §7             |

**Sidebar (refinamento):** em tinta nos dois temas (`.tinta` + `--sidebar`), 248 px (72 recolhida), itens de 40 px, grupos com rótulo em eyebrow, item ativo em `--ink-active` (`--primary-subtle` dentro de `.tinta`) e texto mais claro; contadores em Geist `.num` sobre trilho de tinta. O menu do celular usa a mesma tinta.

**Persistência (RNF-16):** tema pelo `next-themes`; sidebar recolhida em `localStorage` (`atrium:sidebar-recolhida`) via `usePreferencia` (`src/lib/preferencias.ts`), tolerante a storage bloqueado. **Movimento em JS:** `src/lib/motion.ts` lê `--dur-*`/`--easing-*` do CSS; nenhuma duração literal no `motion`.

**Trilha:** derivada da rota (`trilhaDaRota`); a tela que conhece o nome real do registro usa `<DefinirTrilha rotulo="AT-0012" />` (`src/features/shell/trilha.ts`).

## 12. Receitas de tela (quiet luxury)

- **Esqueleto de toda tela:** cabeçalho editorial (`PageHeader` com `eyebrow` "Seção · contexto", H1 em serifa, uma linha de resumo opcional, ações à direita, no máximo um botão primário) → faixa principal → linhas de apoio → lista ou tabela.
- **KPIs:** `StatGroup` + `StatCard variante="celula"`: sem caixa, fio de tinta em cima e fio claro embaixo, divisórias verticais; eyebrow → número em serifa com unidades menores → variação com seta, sinal e "vs. …". Sem mini-linhas decorativas.
- **Painel em tinta (um por tela):** `tinta bg-ink-panel` (meta do mês, resultado do mês, resumo da semana, valor do contrato); progresso em trilho `--ink-track` com preenchimento latão.
- **Grade de métricas:** um card com `gap-px` sobre `--border`; eyebrow + valor 22 px em Geist `.num`; inadimplência em `--danger` no rótulo e no valor.
- **Listas:** linhas com `border-border-soft` no topo, sem zebra; [data ou hora] [título 15/500 + meta] [avatar, valor ou pílula]. Bloco de data: eyebrow do dia + número em serifa.
- **Tabelas:** sem fios entre colunas; cabeçalho em Geist 12/500 `--text-muted`, sem caixa alta (o eyebrow fica só para o eyebrow da página e rótulos de KPI); dinheiro em Geist `.num` à direita; rolagem horizontal no celular.
- **Telas de listagem (padrão de listagem densa, referência: Contratos):** `PageHeader densidade="lista"` (H1 44 px, topo de 32 px, conteúdo até 1480 px); abaixo, `AbasDeStatus` no lugar da faixa de KPIs (contagem em serifa 30 px + rótulo 14 px, sublinhado de 2 px em tinta, contagem de risco em `--danger`; clicar filtra); uma linha de filtros (busca até 520 px, filtro rápido, "Mais filtros", ordenação à direita); `DataTable densidade="lista"` com `rotuloContagem` (tabela e rodapé num só cartão, cabeçalho em `--surface-header`, linhas de 64 px, no máximo 2 linhas por célula com reticências e o texto inteiro no `title`, datas curtas `13/12/26` e `→` em intervalos). Com linhas selecionadas, a barra de filtros vira a `BarraDeLote` em tinta.
- **Pílulas:** só contorno (`--line-strong`), texto `--text-2`; risco/atraso com `--danger-line` e `--danger`. Nada de chip cheio colorido; a cor entra no ponto de 6 px.
- **Gráficos:** barras em pedra e só o período atual em latão, com o valor num chip; locações em `--stone-2` empilhadas; linha de base em tinta, grade tracejada, eixos em Geist 11 px com algarismos tabulares; sempre com resumo acessível e alternativa Tabela.
- **Imóveis:** ladrilho 4:3 em `--surface-sunken`, raio 16, foto ou ilustração em traço; pílula "Venda/Locação" no canto; código em Geist `.num`, título 16/500, bairro em legenda.
- **Estados:** vazio = frase em serifa + uma linha + um botão fantasma; carregando = esqueletos na forma final; erro = legenda em `--danger` com "Tentar novamente".
- **Botões:** primário em tinta (no escuro inverte), fantasma com fio, link de texto com sublinhado fino; destrutivo também em tinta, com o rótulo dizendo o que se perde (nunca vermelho cheio).
