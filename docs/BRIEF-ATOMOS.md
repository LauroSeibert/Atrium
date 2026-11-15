# Brief para criação de átomos (Fase 4)

Leia antes: `CLAUDE.md`, `design-system/DESIGN_SYSTEM.md` (§4 tokens e §10 princípios) e o padrão de referência em `src/components/ui/Button.tsx`, `Button.stories.tsx` e `Button.test.tsx`.

## Regras

- **Arquivos:** um componente por arquivo em `src/components/ui/<Nome>.tsx`, com `<Nome>.stories.tsx` (título `Átomos/<Nome>`) e `<Nome>.test.tsx` quando for interativo. Não edite arquivos fora dos seus componentes (nada de `globals.css`, tokens, `package.json`, `eslint.config.mjs`). Se precisar de algo novo nesses arquivos ou de uma dependência, **não instale**: descreva no relatório.
- **Base:** primitivas do pacote `radix-ui` (`import { Dialog as DialogPrimitive } from "radix-ui"`), `cva` para variantes, `cn` de `@/lib/cn`, ícones `lucide-react` via `<Icon>` de `./Icon`. `cmdk` está instalado (Combobox).
- **Só tokens:** cores via classes do tema (`bg-surface`, `text-text-muted`, `border-border-strong`, `bg-primary`, `text-on-primary`, `bg-danger-bg`, `text-danger`, `ring`…), raios `rounded-sm|md|lg|xl|full`, sombras `shadow-1|2|3`, espaçamento da grade de 4 px, durações `duration-(--dur-fast|base|slow)`, easings `ease-standard|enter|exit`, z-index `z-(--z-dropdown|overlay|modal|toast|sticky)`. Animações prontas: `animate-fade-in|fade-out|scale-in|scale-out|slide-in-right|slide-out-right|slide-in-up` (use com `data-[state=open]:` / `data-[state=closed]:`). **Proibido:** hex, `rgb()`, valores arbitrários `x-[…]`, `duration-150`, `style` com literal, `transition-all`. O lint barra isso.
- **Estados obrigatórios** (interativos): default · hover (mudança de tom, nunca de tamanho) · focus-visible (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`, nunca removido) · active · disabled · loading (quando fizer sentido) · error.
- **Alvos:** controles `md` com 40 px de altura (`h-10`); itens clicáveis ≥ 24 px; mobile 44 px quando houver variante `lg`.
- **Inputs:** rótulo sempre visível (nunca placeholder como rótulo); erro com ícone + texto ligado por `aria-describedby` e `aria-invalid`; borda `border-border-strong` (nunca `border-border` em controles); fundo `bg-surface`.
- **Sobreposições:** fundo `bg-surface-raised`, `shadow-2`/`shadow-3`, borda `border-border`; Esc fecha; foco preso e devolvido (Radix já faz); overlay `bg-bg/80`? Não: use a classe de opacidade do Tailwind sobre token (`bg-text/40`) para escurecer.
- **Textos de UI em pt-BR**, incluindo `aria-label` ("Fechar", "Página anterior", "Mais ações"…).
- **Stories:** cubra todos os estados e variantes; dados realistas do domínio imobiliário (imóveis, leads, contratos), incluindo um caso extremo (texto longo). Sem `globals` fixando tema na story.
- **Testes (Vitest + Testing Library + user-event):** comportamento de teclado (Tab/Shift+Tab/Enter/Espaço/Esc/setas conforme o padrão WAI-ARIA do componente), nome acessível, estados disabled/erro. Não teste estilo.
- **Verificação antes de terminar:** `npx tsc --noEmit`, `npx eslint src/components/ui`, `npx vitest run src/components/ui/<seus arquivos>`. **Não** rode `storybook build`, `test:stories`, `playwright` nem `prettier --write .` (outros agentes trabalham em paralelo); rode `npx prettier --write <seus arquivos>`.
- Não faça commit.

## Relatório final (máx. 10 linhas)

Componentes criados, decisões de API relevantes, número de testes, e qualquer pedido de dependência ou de mudança em arquivo compartilhado.
