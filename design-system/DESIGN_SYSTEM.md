# Atrium — Design System

> Fonte da verdade: [`tokens.json`](./tokens.json) (formato W3C Design Tokens).
> `src/styles/tokens.css` é **gerado** (`npm run tokens`) e é o único arquivo do código com cores literais.
> Referência visual: rota **`/design-system/colors`**.

## 1. Regra de ouro

O código usa **apenas tokens semânticos** (`--bg`, `--text`, `--primary`…) ou as classes Tailwind ligadas a eles (`bg-surface`, `text-text-muted`, `border-border-strong`…).
Escalas (`--green-500`) e cores de marca (`--brand-green`) existem para ilustração, gráficos e casos documentados, nunca para UI comum.
O Tailwind teve os defaults de cor, raio, sombra, fonte e easing zerados: valores fora do sistema nem geram utilitário.

`npm run check:hex` falha se aparecer qualquer cor literal (hex, `rgb()`, `hsl()`, `oklch()`…) em `src/` ou `public/` fora de `tokens.css`.

## 2. Marca e proporção 60-30-10

| Cor          | HEX       | Proporção | Onde entra                                                                                   |
| ------------ | --------- | --------- | -------------------------------------------------------------------------------------------- |
| Polar Snow   | `#FDFEFD` | **60 %**  | Fundo da aplicação, áreas de leitura, texto sobre verde                                      |
| Soft Beige   | `#E7DBC5` | **30 %**  | Sidebar/seções (`bg-subtle`), chips, destaques, divisórias                                   |
| Hunter Green | `#023933` | **10 %**  | Botão primário, links, item ativo, ícones de ação, texto forte                               |
| Ocre         | `#B87D30` | acento    | **Só** gráficos e preenchimentos (≥ 3:1 como objeto gráfico), sempre com rótulo. Nunca texto |

No tema escuro a lógica se inverte: o fundo é verde profundo (`#0B1F1D`, não preto) e o **beige vira a cor de ação** (`--primary`).

## 3. Escalas

Geradas em OKLCH preservando o matiz (`scripts/tokens.mjs`), 50→950, com âncoras exatas:
`green-900 = #023933`, `beige-200 = #E7DBC5`, `neutral-50 = #FDFEFD`.
O neutro tem leve matiz verde para evitar cinza "morto".

## 4. Tokens semânticos — quando usar

| Token                                                          | Use para                                                                                                               | Não use para                                                                                                                                     |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--bg`                                                         | Fundo da página                                                                                                        | Cards                                                                                                                                            |
| `--bg-subtle`                                                  | Sidebar, faixas de seção, cabeçalho de tabela                                                                          | Texto                                                                                                                                            |
| `--surface`                                                    | Cards, tabelas, painéis                                                                                                | Fundo da página                                                                                                                                  |
| `--surface-raised`                                             | Popover, menu, modal, toast                                                                                            | Cards comuns                                                                                                                                     |
| `--surface-warm`                                               | Chips, tags, avatar sem foto, destaque                                                                                 | Áreas grandes, **fundo de inputs/controles** (borda < 3:1), **texto de status** (success/warning < 4,5:1; chips de status usam o próprio `*-bg`) |
| `--border`                                                     | **Divisórias decorativas** (linhas entre itens, contorno de card)                                                      | Contorno de input/checkbox (< 3:1)                                                                                                               |
| `--border-strong`                                              | **Inputs, selects, checkboxes, radios, toggles**, hover de card                                                        | Divisórias (pesado demais)                                                                                                                       |
| `--text`                                                       | Texto principal, títulos                                                                                               | —                                                                                                                                                |
| `--text-muted`                                                 | Rótulos, ajuda, metadados                                                                                              | Texto essencial longo                                                                                                                            |
| `--primary` / `--primary-hover`                                | Botão primário, links, item ativo, ícone de ação                                                                       | Fundos grandes                                                                                                                                   |
| `--on-primary`                                                 | Texto/ícone sobre `--primary`                                                                                          | Texto sobre fundo claro                                                                                                                          |
| `--ring`                                                       | Anel de foco: `outline: 2px solid var(--ring); outline-offset: 2px` (o offset é obrigatório: `ring` × `primary` < 3:1) | Bordas comuns                                                                                                                                    |
| `--success/-bg`, `--warning/-bg`, `--danger/-bg`, `--info/-bg` | Badges, alertas, validação. Texto colorido sobre `-bg` **ou** sobre `surface`                                          | Decoração (cor sempre acompanhada de ícone/texto)                                                                                                |
| `--accent-ochre`                                               | Séries de gráfico, preenchimentos                                                                                      | Texto                                                                                                                                            |

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
| `--text-muted` (claro)     | `#5E6E6A` | `#546360` | 3,92:1 sobre `surface-warm`                                                          |
| `--ring` (claro)           | `#2F8F83` | `#26887C` | 2,95:1 sobre `surface-warm`                                                          |
| `--border-strong` (escuro) | —         | `#608983` | Não existia; `--border` escuro tem 1,34:1. Precisa de 3:1 também em `surface-raised` |
| Ocre                       | `#C58A3E` | `#B87D30` | 2,61:1 sobre `bg-subtle`; série de gráfico precisa de 3:1                            |
| Estados (escuro)           | —         | 8 tokens  | Não existiam; todos ≥ 4,5:1                                                          |
| `--surface-raised`         | —         | novo      | Elevação no escuro = cor + borda                                                     |

## 6. Tipografia, espaço, forma e movimento

> Nomes no CSS: os tokens de forma/movimento usam prefixos próprios em `tokens.css` (`--corner-*`, `--elevation-*`, `--easing-*`, `--weight-*`, `--line-height-*`, `--letter-spacing-*`) e o Tailwind os expõe com os nomes do guia (`--radius-*`, `--shadow-*`, `--ease-*`, `--font-weight-*`, `--leading-*`, `--tracking-*`). Isso evita variáveis que apontam para si mesmas. Os defaults do Tailwind nesses namespaces foram zerados, e `transition` usa `--dur-base` + `ease-standard`.

- **Fonte:** Inter via `next/font` (`--font-sans`). Números de tabela/KPI com a classe `tnum` (`font-feature-settings: "tnum"`).
- **Escala (1.2):** `text-xs 12` · `text-sm 14` · `text-base 16` · `text-lg 20` · `text-xl 24` · `text-2xl 32` · `text-3xl 40`. Corpo 14–16 px com `line-height 1.5`; títulos `1.2`.
- **Espaçamento:** grade de 4 px (`--spacing: 4px` → `p-1 = 4`, `p-2 = 8`, `p-3 = 12`, `p-4 = 16`, `p-6 = 24`, `p-8 = 32`, `p-12 = 48`, `p-16 = 64`). Prefira esses passos.
- **Raio:** `rounded-sm 6` · `rounded-md 10` · `rounded-lg 14` (cards) · `rounded-xl 20` · `rounded-full`.
- **Sombra:** `shadow-1/2/3` com matiz verde. No escuro viram borda de 1 px (sombra não aparece em fundo escuro).
- **Duração:** `--dur-fast 120ms` · `--dur-base 200ms` · `--dur-slow 320ms` · `--dur-page 450ms`. Com `prefers-reduced-motion`, todas viram 1 ms.
- **Easing:** `ease-standard`, `ease-enter`, `ease-exit`, `ease-spring`.
- **Peso:** `font-regular 400` · `font-medium 500` · `font-semibold 600` · `font-bold 700`. **Tracking:** `tracking-tight` · `tracking-normal` · `tracking-wide` (eyebrows em caixa alta).
- **Z-index:** `--z-base 0` · `--z-sticky 10` · `--z-dropdown 20` · `--z-overlay 30` · `--z-modal 40` · `--z-toast 50`.

## 7. Logo

O átrio da _domus_ romana visto de cima: o ladrilho é a casa, o quadrado com diagonais é o telhado de quatro águas (compluvium) e o quadrado central é o _impluvium_, o espelho d'água que recebe a chuva.

- Componente: `src/components/brand/AtriumLogo.tsx` (`<AtriumMark />` e `<AtriumLogo />`), usa `--primary`/`--on-primary` e se adapta ao tema sozinho.
- Arquivos avulsos: [`brand/atrium-mark.svg`](./brand/atrium-mark.svg) (adapta via `prefers-color-scheme`), [`brand/atrium-logo-light.svg`](./brand/atrium-logo-light.svg), [`brand/atrium-logo-dark.svg`](./brand/atrium-logo-dark.svg).
- Área de respiro mínima: ¼ da altura do símbolo. Tamanho mínimo do símbolo: 16 px.

## 8. Fluxo para mudar uma cor

1. Edite `design-system/tokens.json`.
2. `npm run tokens` (regenera escalas e `tokens.css`).
3. `npm run check` (tokens em dia, contraste, zero hex, typecheck).
4. Confira `/design-system/colors` nos dois temas.

## 9. Princípios de UI/UX

Referências que guiam as decisões de tela no painel (dashboard de KPIs, lista de imóveis com filtros, kanban de leads, tabela de contratos/pagamentos). Em conflito, vale o token; o princípio explica o porquê.

### 9.1 Heurísticas de Nielsen

[10 Heurísticas de Usabilidade, Nielsen Norman Group](https://www.nngroup.com/articles/ten-usability-heuristics/): dez regras gerais que todo fluxo de interface deve respeitar.

- **Visibilidade do status:** toda lista, kanban e tabela tem estados de carregando (skeleton com a forma final), vazio, erro e sucesso; ações assíncronas mostram progresso no próprio botão e confirmam em toast (`--z-toast`).
- **Prevenção de erros:** ações destrutivas (excluir imóvel, cancelar contrato) pedem confirmação com o nome do item e oferecem "Desfazer" quando possível.
- **Reconhecer em vez de lembrar:** filtros ativos da lista de imóveis aparecem como chips removíveis acima da tabela, com contagem de resultados.
- **Consistência:** o mesmo componente para o mesmo papel (status de lead e de pagamento usam o mesmo `Badge`); nada de hex solto, só tokens semânticos (seção 4).

### 9.2 WCAG 2.2

[WCAG 2.2, W3C](https://www.w3.org/TR/WCAG22/): critérios de acessibilidade, nível AA como mínimo do projeto.

- **Contraste (1.4.3, 1.4.11):** já verificado por `npm run check:contrast` (seção 5); não crie par de cor fora dos tokens sem rodar o gate.
- **Foco visível e não obscurecido (2.4.7, 2.4.11):** sempre `outline: 2px solid var(--ring); outline-offset: 2px`; cabeçalho e coluna fixa (`--z-sticky`) não podem cobrir o elemento focado (use `scroll-margin`).
- **Tamanho do alvo (2.5.8):** o mínimo da norma é 24×24 px; o padrão do projeto é maior: botão `md` com 40 px no desktop e 44 px no mobile. Ícone-botão em linha de tabela também respeita 40 px de área clicável.
- **Erros (3.3.1, 3.3.3):** campo inválido mostra mensagem em texto junto ao campo, com ícone e `aria-describedby`, e a sugestão de correção ("CPF deve ter 11 dígitos"); inputs mantêm `--border-strong`.
- **Mensagens de status (4.1.3):** toasts, "salvo" e a contagem de resultados após filtrar são anunciados por _live region_ (`role="status"`), sem tirar o foco do usuário.
- **Reflow e zoom (1.4.10, 1.4.4):** nada de rolagem horizontal da página em 320 px CSS ou com zoom de 200 %; tabelas largas rolam dentro do próprio contêiner.
- **Arrastar (2.5.7):** todo card do kanban de leads tem alternativa sem arrastar: menu "Mover para…" (teclado e toque). O drag é só atalho.

### 9.3 Laws of UX

[Laws of UX](https://lawsofux.com/): coletânea de princípios de psicologia aplicados a interface.

- **Hick:** menos opções por tela; filtros avançados da lista de imóveis ficam recolhidos em "Mais filtros", e ações secundárias da linha vão para um menu "⋯".
- **Fitts:** alvos frequentes são grandes e próximos; ação principal do formulário fica no rodapé do cartão, alinhada à direita, com altura 40/44 px.
- **Von Restorff:** um destaque por vista, ou seja, um único botão primário (`--primary`, a cor dos 10% do 60-30-10). Demais ações são secundárias ou fantasma; o KPI crítico (ex.: pagamentos em atraso) é o único com cor de alerta no valor. A seta de variação (▲▼) de cada KPI usa cor de sucesso/erro, sempre com ícone e texto, e não conta como destaque.
- **Proximidade e Região comum:** campos relacionados ficam agrupados no mesmo card (`rounded-lg`) com espaço interno maior que o espaço entre grupos; KPIs de um mesmo tema compartilham um bloco.

### 9.4 Movimento

[Material Design 3: Motion](https://m3.material.io/styles/motion/overview) e [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion): movimento com propósito, curto e interrompível.

- **Propósito:** anime só para explicar mudança (card que muda de coluna, painel que abre, toast que entra). Nada de animação decorativa em tabelas ou KPIs.
- **Curto:** hover e foco em `--dur-fast`; transições de componente em `--dur-base` com `ease-standard`; entrada com `ease-enter`, saída com `ease-exit`; `--dur-page` só para troca de página.
- **Interrompível:** animar `opacity`/`transform`, nunca bloquear a interação enquanto anima.
- **Reduzir movimento:** respeite `prefers-reduced-motion`; os tokens de duração já viram 1 ms, então use sempre os tokens, nunca `ms` literal.

### 9.5 Refactoring UI

[Refactoring UI, Wathan & Schoger](https://www.refactoringui.com/): táticas práticas de hierarquia visual.

- **Hierarquia por peso e cor, não só tamanho:** valor do KPI em `font-semibold` + `tnum`; rótulo em `--text-muted` e `text-sm`.
- **Menos bordas:** separe linhas da tabela com espaço e `--border` sutil (ou zebra leve), reservando `--border-strong` para controles interativos.
- **Espaço generoso:** prefira `p-6` em cards e `gap-4` entre campos; densidade extra só em tabelas, por opção do usuário.
- **Rebaixar o secundário:** metadados (data de criação, corretor, ID) em `--text-muted`; o que decide a ação (status, valor, vencimento) em texto normal.

### 9.6 Gestalt e grade 4/8 px

[Gestalt: Proximidade, Nielsen Norman Group](https://www.nngroup.com/articles/gestalt-proximity/): itens próximos são percebidos como relacionados.

- **Só valores da grade de 4 px** (`--spacing: 4px`): `p-1/2/3/4/6/8`; sem `13px` ou `margin: 7px`. Prefira múltiplos de 8 entre seções.
- **Espaço interno < espaço externo:** o intervalo entre rótulo e campo é menor que entre um campo e o próximo; entre colunas do kanban, maior que entre cards da mesma coluna.
- **Raio coerente:** card `rounded-lg`, controles `rounded-md`, chips `rounded-full`; aninhado usa raio menor que o pai.
- **Cor 60-30-10:** fundo neutro dominante, superfícies secundárias, `--primary` só no destaque.

### Checklist de revisão de tela

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
