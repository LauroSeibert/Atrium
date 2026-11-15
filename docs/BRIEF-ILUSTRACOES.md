# Brief para ilustrações SVG (Fase 5 §5.4)

Leia antes: `CLAUDE.md`, `design-system/DESIGN_SYSTEM.md` (§2 e §4) e **`src/assets/svg/Ilustracao.tsx`** (raiz comum, paleta `P` e `VIEWBOX`).

## Estilo

- **Flat/geométrico minimalista**: retângulos, polígonos, círculos; sem gradiente, sem filtro, sem sombra borrada, sem texto dentro do SVG.
- Mesma linguagem em toda a biblioteca: cantos retos ou `rx` pequeno (2–6), traço só quando precisar (`stroke={P.ink}`, `strokeWidth` 2–3), poucos elementos (alvo: 15–40 formas por cena).
- **Cores só da paleta `P`** (`P.sky`, `P.ground`, `P.wall`, `P.wallAlt`, `P.roof`, `P.detail`, `P.ink`, `P.accent`), em `fill`/`stroke`. Proibido: hex, `rgb()`, nomes de cor, `--green-*`/`--beige-*`, `opacity` para criar cores novas (use `fillOpacity` só em detalhe secundário, nunca na silhueta).
- Papéis: céu/fundo `P.sky` (sempre um `<rect>` de fundo cobrindo o viewBox), chão `P.ground`, volume principal `P.wall`, volume secundário `P.wallAlt`, telhado/laje `P.roof`, janelas/portas/detalhes `P.detail`, contornos/sombras duras `P.ink`, **acento `P.accent` só decorativo** (sol, luminária, planta, almofada), nunca necessário para entender a cena.
- A silhueta principal deve ser legível só com `wall/wallAlt/roof` sobre `sky` (contraste ≥ 3:1 garantido pelos tokens nos dois temas). Não coloque `P.wallAlt` sobre `P.wall` como única distinção de algo importante.
- Tema escuro: os tokens invertem sozinhos (volumes ficam beige, céu verde). Não faça nada condicional ao tema.

## Técnica

- Componente React em `.tsx`, um por arquivo, exportado por nome. Raiz **sempre** `<Ilustracao viewBox={VIEWBOX.x} titulo=… {...props}>`; repasse `className`, `decorativa` e o resto das props.
- `titulo` padrão descritivo em pt-BR (ex.: "Ilustração de sobrado de dois andares"), sobrescrevível por prop.
- Coordenadas inteiras ou com 1 casa decimal; sem `transform` aninhado desnecessário; sem `id` fixo (se precisar de `<clipPath>`, use `useId`).
- Lint: nada de valor arbitrário do Tailwind nem `style` com literal.

## Verificação antes de terminar

`npx tsc --noEmit`, `npx eslint src/assets/svg`, `npm run check:hex`, `npx vitest run src/assets/svg`, `npx prettier --write <seus arquivos>`. **Não** rode storybook build, playwright nem prettier no projeto todo. **Não** faça commit. Não edite arquivos fora da sua pasta (se precisar, descreva no relatório).

## Relatório final (máx. 8 linhas)

Arquivos criados, API do componente, nº de testes e pedidos de mudança em arquivos compartilhados.
