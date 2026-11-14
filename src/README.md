# src/ — estrutura

| Pasta                                    | O que vai aqui                                                                                                                                      | Fase |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `app/`                                   | Rotas do App Router. `(dashboard)/` compartilha o shell. Só **monta** features.                                                                     | 7–8  |
| `components/ui/`                         | Átomos (shadcn/ui + Radix re-estilizados com tokens), 1 por arquivo, variantes com `cva`.                                                           | 4    |
| `components/patterns/`                   | Moléculas/organismos do domínio (StatCard, KanbanBoard…). Só props, sem lógica de tela.                                                             | 6    |
| `components/layout/`                     | Shell: sidebar, topbar, page header.                                                                                                                | 7    |
| `components/brand/`, `components/theme/` | Logo e tema.                                                                                                                                        | 1    |
| `features/<modulo>/`                     | Telas e lógica de apresentação por módulo (dashboard, imoveis, leads, contratos, financeiro).                                                       | 8    |
| `domain/<entidade>/`                     | **Única** fonte das regras de negócio: tipos, schemas Zod, máquina de estado (`estado.ts`), registro de alterações. Ver `docs/ESTADOS-E-FLUXOS.md`. | 5    |
| `mocks/data/`, `mocks/services/`         | Gerador de dados e `fakeApi` (latência/erro). Chamam o domínio, nunca mudam estado sozinhos.                                                        | 5    |
| `assets/svg/`                            | Ilustrações (casas, cômodos, vazios, avatares) como componentes React.                                                                              | 5    |
| `lib/`                                   | Utilitários puros: `cn`, formatadores pt-BR (`format.ts`).                                                                                          | 3    |
| `styles/`                                | `tokens.css` (gerado), `globals.css`, fontes.                                                                                                       | 1    |

Convenções: componentes em PascalCase, 1 por arquivo, props tipadas; imports absolutos `@/`; Conventional Commits em pt-BR.
