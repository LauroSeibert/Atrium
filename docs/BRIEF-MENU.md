# Brief: novo menu lateral e módulos (2026-11-16)

Leia antes: `CLAUDE.md`, `docs/REQUISITOS.md` (§2.1, §2.4, §2.6, §2.9–2.12, §4 e §6), `docs/MODELO-DE-DADOS.md`, `docs/ESTADOS-E-FLUXOS.md` (§3.1, §3.8–3.11, §4), `docs/BRIEF-TELAS.md` (regras das telas continuam valendo), `docs/BRIEF-COMPOSTOS.md` e `design-system/DESIGN_SYSTEM.md`.

Decisões do Lauro (2026-11-16), que definem o escopo:

- Leads e "pipeline" são a mesma tela (kanban/lista). Visitas ficam na Agenda.
- **Negociação por imóvel:** o mesmo lead pode negociar vários imóveis, cada um com etapa própria; o kanban mostra negociações (o lead aparece uma vez por imóvel).
- Contatos = pessoas fora do funil. Não há entidade "Cliente": lead já é o cliente em potencial.
- Anúncios entram só como demonstração (sem integração).
- **Documentos por contrato são muito importantes**: upload de verdade, guardado no navegador.
- Financeiro = receitas e despesas; despesa = impostos e burocracia de contratos e documentação.
- Relatórios: vendas por período, desempenho dos corretores, conversão de leads, imóveis mais procurados, receita por período.
- Fora: tarefas/atividades com prazo, captações, propostas como entidade.
- **Menos é mais**: títulos curtos, sem descrições, sem subtítulos, sem textos de ajuda.

## Menu

```
Dashboard                      /
Comercial      (rótulo)
  Leads                        /leads            contador: negociações em "novo"
  Agenda                       /agenda
  Contatos                     /contatos
Operação       (rótulo)
  Imóveis                      /imoveis
  Anúncios                     /anuncios
  Contratos                    /contratos        contador: parcelas atrasadas
Financeiro     (item com submenu, ícone Wallet)
  Visão geral                  /financeiro       (ativo só na rota exata)
  Receitas                     /financeiro/receitas
  Despesas                     /financeiro/despesas
  Comissões                    /financeiro/comissoes
  Repasses                     /financeiro/repasses
Relatórios                     /relatorios
— rodapé —
Configurações                  /configuracoes
```

- Rótulos de grupo: texto pequeno, `text-text-muted`, sem caixa alta pesada; não clicáveis; somem na sidebar recolhida e no trilho (vira um separador discreto).
- Submenu (Financeiro): sidebar aberta → botão com `aria-expanded` que expande os filhos no lugar (recuados), aberto por padrão quando a rota atual está dentro dele. Sidebar recolhida e trilho do tablet → o ícone abre um painel flutuante (Popover/DropdownMenu do Radix, acessível por teclado, `Esc` fecha e devolve o foco) com os 5 filhos. O pai mostra estado ativo quando algum filho está ativo.
- Mobile (drawer): grupos recolhíveis, o grupo da tela atual aberto.
- Paleta ⌘K ("Ir para") lista todos os itens folha.
- Trilha (breadcrumb): `Financeiro › Receitas`, etc.

## Contrato do fakeApi (nomes fixos; formas de retorno no padrão das leituras atuais, com derivados e permissões prontos)

| Função                                                                                                                                                                                                                                                                                                              | RF                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `listNegociacoes(filtros)` → negociações com `lead` (resumo), `imovel` (resumo ou `null`), `valor` (preço do imóvel ou orçamento do lead), `destinos`, `permissoesDeSoltar`; filtros: `busca`, `responsavelId`, `origens`, `etapas`, `imovelId`, `leadId`, `de`, `ate`                                              | RF-30, RF-36, RF-38        |
| `moverNegociacao(id, etapa, ordem, motivo?)` · `criarNegociacao(leadId, imovelId \| null)` · `definirImovelNegociacao(id, imovelId)` · `contratosVinculaveis(negociacaoId)` · `vincularContrato(negociacaoId, contratoId)`                                                                                          | RF-31, RF-32, RF-39, RF-71 |
| `listLeads(filtros)` (pessoas, cada uma com contagem de negociações: `qtdNegociacoes`, `qtdAbertas`) · `getLead(id)` (com `negociacoes` — cada uma com `transicoes`, `contrato` e `podeVincular` —, `contratos` vinculados e `podeAgendarVisita`) · `createLead(dados)` (cria a 1ª negociação; `imovelId` opcional) | RF-33, RF-35, RF-72        |
| `getImovel(id)` passa a trazer `negociacoes` (lead, etapa, responsável) no lugar de `leadsInteressados`; `getContrato(id)` traz `negociacao` e o `lead` dela                                                                                                                                                        | RF-29, RF-39, RF-72        |
| `getAgenda({ tipos?, dias?, responsavelId? })` → dias com itens (visita com `transicoes` permitidas, ou vencimento de parcela)                                                                                                                                                                                      | RF-73                      |
| `listContatos({ busca?, papeis? })` · `getContato(id)` · `saveContato(dados)`                                                                                                                                                                                                                                       | RF-74                      |
| `listAnuncios({ busca?, canais?, status? })` (com `transicoes`, `alerta` derivado e imóvel resumido) · `criarAnuncio(imovelId, canal)` · `transicionarAnuncio(id, status)`                                                                                                                                          | RF-75                      |
| `listDocumentos(contratoId)` · `enviarDocumento(contratoId, arquivo: File, tipo)` · `baixarDocumento(id)` → `Blob` · `removerDocumento(id)`                                                                                                                                                                         | RF-76                      |
| `listReceitas(filtros, paginacao)` (parcelas de todos os contratos com `status` derivado, contrato e imóvel resumidos, `podePagar`)                                                                                                                                                                                 | RF-77                      |
| `listDespesas(filtros, paginacao)` (com `status` derivado e `podeEditar`/`podePagar`) · `saveDespesa(dados)` · `pagarDespesa(id)`                                                                                                                                                                                   | RF-78                      |
| `listComissoes({ competencia?, corretorId?, status? })` (com `podePagar`) · `pagarComissao(contratoId, indice)`                                                                                                                                                                                                     | RF-79                      |
| `listRepasses({ mes?, contratoId? })`                                                                                                                                                                                                                                                                               | RF-80                      |
| `getFinanceiro(periodo)` ganha `despesas` e `resultado`                                                                                                                                                                                                                                                             | RF-81                      |
| `getRelatorios({ periodo, corretorId? })` → os 5 relatórios já calculados no domínio (`src/domain/metricas/relatorios.ts`)                                                                                                                                                                                          | RF-82                      |

Toda escrita devolve `{ resultado, desfazer }` como hoje. Regras (guards, transições, derivados) só em `src/domain/`.
