# Atrium — instruções para agentes

Painel de administração para imobiliárias (Next.js 16, React 19, Tailwind v4, TS strict, dados mock). Guia de fases: siga as fases em ordem e só avance com o Gate cumprido. UI e documentação em **pt-BR**.

## Regras inegociáveis

1. **Só tokens.** Nenhuma cor, espaço, raio, sombra ou duração literal fora de `src/styles/tokens.css` (gerado de `design-system/tokens.json` via `npm run tokens`). Leia `design-system/DESIGN_SYSTEM.md` antes de qualquer UI.
2. **Sem máquinas de estado escondidas.** Leia `docs/ESTADOS-E-FLUXOS.md` antes de mexer em lead, imóvel, contrato, parcela, comissão ou desfazer:
   - toda entidade com ciclo de vida tem máquina explícita em `src/domain/<entidade>/estado.ts`;
   - só a função de transição do domínio muda estado (UI, `fakeApi`, atalhos e ações em lote chamam essa função);
   - componentes perguntam ao domínio o que é permitido; nenhuma regra de negócio em `if` de componente;
   - efeitos (Atividade, **registro de auditoria**, status do imóvel, desfazer) ficam dentro da transição;
   - auditoria é append-only: nunca editar/apagar; desfazer gera entrada compensatória (ver §4 do documento);
   - estado assíncrono de UI é união discriminada, nunca combinação de booleanos;
   - mudou um fluxo crítico: atualize `docs/ESTADOS-E-FLUXOS.md` e os testes da máquina no mesmo commit.
3. **Requisitos rastreáveis.** Cite os IDs de `docs/REQUISITOS.md` (RF-xx/RNF-xx) em telas, testes e commits relevantes. Modelo e invariantes em `docs/MODELO-DE-DADOS.md`.
4. **Repositório público.** Nunca commitar segredos, `.env*` ou dados pessoais reais.
5. **Acessibilidade verificada, não presumida.** WCAG 2.2 AA; rode `npm run check` (tokens, contraste, cores literais, typecheck) antes de commitar.

## Como trabalhar

- Commits direto na `main`, mensagens no padrão Conventional Commits, em pt-BR.
- Delegue trabalho braçal (mocks, SVGs repetitivos, stories, boilerplate de testes) a modelos mais baratos; peça auditoria a um modelo mais forte nas decisões importantes e antes de fechar cada Gate. Na auditoria, confira explicitamente se surgiu regra de fluxo crítico fora de `src/domain/`.
- Rode tarefas independentes em paralelo.
