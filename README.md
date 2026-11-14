<p align="center">
  <img src="design-system/brand/atrium-logo-light.svg" alt="Atrium" height="48">
</p>

# Atrium

Painel de administração para imobiliárias: minimalista, rápido e acessível. Esta versão usa **dados mock** e ilustrações SVG, sem backend.

> O nome vem do _atrium_ das casas romanas: o pátio central, aberto ao céu, em torno do qual a casa se organiza.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 ligado aos design tokens · shadcn/ui + Radix · Lucide · Motion · Recharts · TanStack Table · React Hook Form + Zod · dnd-kit · Zustand · next-themes.
Qualidade: ESLint (com regras de tokens e de fluxos críticos), Prettier, Vitest + Testing Library, Playwright + axe, Storybook.

## Rodando

```bash
npm install
npm run dev          # http://localhost:3000 → /design-system/colors
npm run storybook    # http://localhost:6006
```

| Script                              | O que faz                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `npm run check`                     | Tokens em dia, contraste WCAG, zero cores literais, typecheck, lint e testes unitários |
| `npm run test` / `test:e2e`         | Vitest / Playwright + axe (sobe o build na porta 3100)                                 |
| `npm run lint` · `format`           | ESLint · Prettier                                                                      |
| `npm run tokens`                    | Gera escalas OKLCH e `src/styles/tokens.css` a partir de `design-system/tokens.json`   |
| `npm run build` · `build-storybook` | Build de produção do app e do Storybook                                                |

Estrutura de pastas: [`src/README.md`](src/README.md). Requisitos e modelo: [`docs/`](docs/). Regras para agentes: [`CLAUDE.md`](CLAUDE.md).

## Design system

Regras de uso em [`design-system/DESIGN_SYSTEM.md`](design-system/DESIGN_SYSTEM.md). Visualização na rota `/design-system/colors`.

## Segurança

Repositório público: nada de segredos aqui. `.env*` (exceto `.env.example`), chaves e certificados estão no `.gitignore`. O app não depende de nenhuma variável de ambiente nesta fase.
