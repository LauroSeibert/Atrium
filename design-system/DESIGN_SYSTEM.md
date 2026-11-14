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

| Cor | HEX | Proporção | Onde entra |
|---|---|---|---|
| Polar Snow | `#FDFEFD` | **60 %** | Fundo da aplicação, áreas de leitura, texto sobre verde |
| Soft Beige | `#E7DBC5` | **30 %** | Sidebar/seções (`bg-subtle`), chips, destaques, divisórias |
| Hunter Green | `#023933` | **10 %** | Botão primário, links, item ativo, ícones de ação, texto forte |
| Ocre | `#C58A3E` | acento | **Só** gráficos e preenchimentos, sempre com rótulo. Nunca texto sobre fundo claro (2,97:1) |

No tema escuro a lógica se inverte: o fundo é verde profundo (`#0B1F1D`, não preto) e o **beige vira a cor de ação** (`--primary`).

## 3. Escalas

Geradas em OKLCH preservando o matiz (`scripts/tokens.mjs`), 50→950, com âncoras exatas:
`green-900 = #023933`, `beige-200 = #E7DBC5`, `neutral-50 = #FDFEFD`.
O neutro tem leve matiz verde para evitar cinza "morto".

## 4. Tokens semânticos — quando usar

| Token | Use para | Não use para |
|---|---|---|
| `--bg` | Fundo da página | Cards |
| `--bg-subtle` | Sidebar, faixas de seção, cabeçalho de tabela | Texto |
| `--surface` | Cards, tabelas, painéis | Fundo da página |
| `--surface-raised` | Popover, menu, modal, toast | Cards comuns |
| `--surface-warm` | Chips, tags, avatar sem foto, destaque | Áreas grandes |
| `--border` | **Divisórias decorativas** (linhas entre itens, contorno de card) | Contorno de input/checkbox (< 3:1) |
| `--border-strong` | **Inputs, selects, checkboxes, radios, toggles**, hover de card | Divisórias (pesado demais) |
| `--text` | Texto principal, títulos | — |
| `--text-muted` | Rótulos, ajuda, metadados | Texto essencial longo |
| `--primary` / `--primary-hover` | Botão primário, links, item ativo, ícone de ação | Fundos grandes |
| `--on-primary` | Texto/ícone sobre `--primary` | Texto sobre fundo claro |
| `--ring` | Anel de foco: `outline: 2px solid var(--ring); outline-offset: 2px` | Bordas comuns |
| `--success/-bg`, `--warning/-bg`, `--danger/-bg`, `--info/-bg` | Badges, alertas, validação. Texto colorido sobre `-bg` **ou** sobre `surface` | Decoração (cor sempre acompanhada de ícone/texto) |
| `--accent-ochre` | Séries de gráfico, preenchimentos | Texto |

## 5. Contraste (Gate 1)

Todas as combinações usadas estão em [`contrast.json`](./contrast.json) e são verificadas nos **dois temas** por `npm run check:contrast` (68/68 aprovadas).

- Texto: **≥ 4,5:1** (WCAG 2.2, 1.4.3).
- Bordas de controles e foco: **≥ 3:1** (1.4.11).
- Divisórias decorativas (`--border`) são isentas: não identificam controles.
- Cores com alpha são compostas sobre o fundo antes do cálculo.

### Correções técnicas sobre o guia original

Registradas em [`adjustments.json`](./adjustments.json) e exibidas na página de cores.

| Token | Antes | Depois | Motivo |
|---|---|---|---|
| `--border-strong` (claro) | `#CFC0A3` | `#95876C` | 1,58:1 sobre `bg-subtle`; input precisa de 3:1 |
| `--text-muted` (claro) | `#5E6E6A` | `#546360` | 3,92:1 sobre `surface-warm` |
| `--ring` (claro) | `#2F8F83` | `#26887C` | 2,95:1 sobre `surface-warm` |
| `--border-strong` (escuro) | — | `#57807A` | Não existia; `--border` escuro tem 1,34:1 |
| Estados (escuro) | — | 8 tokens | Não existiam; todos ≥ 4,5:1 |
| `--surface-raised` | — | novo | Elevação no escuro = cor + borda |

## 6. Tipografia, espaço, forma e movimento

- **Fonte:** Inter via `next/font` (`--font-sans`). Números de tabela/KPI com a classe `tnum` (`font-feature-settings: "tnum"`).
- **Escala (1.2):** `text-xs 12` · `text-sm 14` · `text-base 16` · `text-lg 20` · `text-xl 24` · `text-2xl 32` · `text-3xl 40`. Corpo 14–16 px com `line-height 1.5`; títulos `1.2`.
- **Espaçamento:** grade de 4 px (`--spacing: 4px` → `p-1 = 4`, `p-2 = 8`, `p-3 = 12`, `p-4 = 16`, `p-6 = 24`, `p-8 = 32`, `p-12 = 48`, `p-16 = 64`). Prefira esses passos.
- **Raio:** `rounded-sm 6` · `rounded-md 10` · `rounded-lg 14` (cards) · `rounded-xl 20` · `rounded-full`.
- **Sombra:** `shadow-1/2/3` com matiz verde. No escuro viram borda de 1 px (sombra não aparece em fundo escuro).
- **Duração:** `--dur-fast 120ms` · `--dur-base 200ms` · `--dur-slow 320ms` · `--dur-page 450ms`. Com `prefers-reduced-motion`, todas viram 1 ms.
- **Easing:** `ease-standard`, `ease-enter`, `ease-exit`, `ease-spring`.
- **Z-index:** `--z-base 0` · `--z-sticky 10` · `--z-dropdown 20` · `--z-overlay 30` · `--z-modal 40` · `--z-toast 50`.

## 7. Logo

O átrio da *domus* romana visto de cima: o ladrilho é a casa, o quadrado com diagonais é o telhado de quatro águas (compluvium) e o quadrado central é o *impluvium*, o espelho d'água que recebe a chuva.

- Componente: `src/components/brand/AtriumLogo.tsx` (`<AtriumMark />` e `<AtriumLogo />`), usa `--primary`/`--on-primary` e se adapta ao tema sozinho.
- Arquivos avulsos: [`brand/atrium-mark.svg`](./brand/atrium-mark.svg) (adapta via `prefers-color-scheme`), [`brand/atrium-logo-light.svg`](./brand/atrium-logo-light.svg), [`brand/atrium-logo-dark.svg`](./brand/atrium-logo-dark.svg).
- Área de respiro mínima: ¼ da altura do símbolo. Tamanho mínimo do símbolo: 16 px.

## 8. Fluxo para mudar uma cor

1. Edite `design-system/tokens.json`.
2. `npm run tokens` (regenera escalas e `tokens.css`).
3. `npm run check` (tokens em dia, contraste, zero hex, typecheck).
4. Confira `/design-system/colors` nos dois temas.
