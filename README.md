<p align="center">
  <img src="design-system/brand/atrium-logo-light.svg" alt="Atrium" height="48">
</p>

# Atrium

Painel de administração para imobiliárias: minimalista, rápido e acessível. Esta versão usa **dados mock** e ilustrações SVG, sem backend.

> O nome vem do *atrium* das casas romanas: o pátio central, aberto ao céu, em torno do qual a casa se organiza.

## Stack atual

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ligado aos design tokens · next-themes.

## Rodando

```bash
npm install
npm run dev        # http://localhost:3000 → /design-system/colors
```

| Script | O que faz |
|---|---|
| `npm run tokens` | Gera escalas OKLCH e `src/styles/tokens.css` a partir de `design-system/tokens.json` |
| `npm run check` | Tokens em dia + contraste WCAG + zero cores literais + typecheck |
| `npm run check:contrast` | Verifica todas as combinações texto/fundo nos temas claro e escuro |
| `npm run build` | Build de produção |

## Design system

Regras de uso em [`design-system/DESIGN_SYSTEM.md`](design-system/DESIGN_SYSTEM.md). Visualização na rota `/design-system/colors`.

## Segurança

Repositório público: nada de segredos aqui. `.env*` (exceto `.env.example`), chaves e certificados estão no `.gitignore`. O app não depende de nenhuma variável de ambiente nesta fase.
