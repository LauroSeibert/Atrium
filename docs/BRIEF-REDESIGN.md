# Brief — Refinamento de design (pós-Fase 9)

> Objetivo: o Atrium deixa de parecer um "admin gerado" e passa a parecer software de negócio premium, contido e preciso.
> Referência de comportamento: interface da Vercel (tipografia, espaçamento, bordas sutis, cor mínima, responsivo). Não copiar: identidade própria, verde perene.
> Regras que continuam valendo: só tokens, compostos só por props, regras de negócio só em `src/domain`, WCAG 2.2 AA, "menos é mais", sem indicadores visíveis de atalho.

## 1. Diagnóstico (inspeção em 1440, 834 e 390 px)

| Problema                                                   | Onde                                                                    | Causa                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Tudo é card com borda bege                                 | Dashboard, listas, painéis                                              | `SectionCard`/`ChartCard`/`StatCard` com o mesmo contorno; nenhuma hierarquia de superfície             |
| Bege e ocre competem com o verde                           | Sidebar, chips, barras de progresso, 2ª série dos gráficos, ilustrações | 60-30-10 com bege como "30"                                                                             |
| Título de página grande demais, sem relação com o resto    | Todas as telas                                                          | `h1` 32 px bold vs. corpo 14 px; seções 20 px                                                           |
| KPIs repetitivos                                           | Dashboard                                                               | 4 cards idênticos, rótulo/valor/delta/sparkline soltos, alturas desiguais (rótulo quebra)               |
| Gráfico de receita alto e vazio, "Meta do mês" muito longa | Dashboard                                                               | Meta lista 10 corretores com 2 linhas de texto cada; coluna da direita define a altura da linha inteira |
| Agenda e atividades com ruído                              | Dashboard                                                               | ícone em círculo + título + nome + chip por item, sem coluna de horário                                 |
| Sidebar termina antes do fim da página                     | Desktop                                                                 | `h-dvh` sem `sticky`                                                                                    |
| Botão ativo da navegação pesado                            | Sidebar                                                                 | Preenchimento verde sólido                                                                              |
| Tabela larga corta "Vigência" em 1440 px                   | Contratos                                                               | Coluna "Partes" quebra em 3 linhas; sem prioridade de colunas                                           |
| Tablet = celular grande                                    | 768–1023 px                                                             | Abaixo de 1024 px a navegação vira gaveta                                                               |
| Imóveis sem fotografia                                     | Lista e detalhe                                                         | Só ilustrações (Fase 5)                                                                                 |

## 2. Sistema visual

### Cor (claro)

| Token                                           | Valor                             | Papel                                                      |
| ----------------------------------------------- | --------------------------------- | ---------------------------------------------------------- |
| `--bg`                                          | branco                            | Fundo da área de conteúdo                                  |
| `--bg-subtle`                                   | cinza neutro muito claro          | Sidebar, cabeçalho de tabela, faixas, poços de gráfico     |
| `--surface` / `--surface-raised`                | branco                            | Painéis / popovers, menus, modais                          |
| `--surface-muted` (substitui `--surface-muted`) | cinza neutro claro                | Chips, hover, item ativo da navegação, trilho de progresso |
| `--border`                                      | cinza 92 %                        | Divisórias e contornos de painel                           |
| `--border-strong`                               | cinza ≥ 3:1                       | Inputs, checkboxes, toggles                                |
| `--text`                                        | grafite                           | Texto principal                                            |
| `--text-muted`                                  | cinza ≥ 4,5:1                     | Rótulos, metadados                                         |
| `--primary`                                     | verde perene profundo             | Ação primária, foco de seleção, indicador ativo, links     |
| `--primary-subtle` (novo)                       | verde muito claro                 | Fundo de seleção/destaque raro                             |
| semânticas                                      | success / warning / danger / info | Só estados reais                                           |
| `--chart-1…5`                                   | rampa de verde perene + cinzas    | Séries; nada de ocre                                       |

Escuro: preto neutro (não verde), superfícies em degraus de cinza, bordas finas, verde perene clareado como ação.
Saem: bege, ocre, `--accent-ochre`, gradientes, sombras em cards.

### Tipografia

- **Geist** (UI) + **Geist Mono** (códigos AT-0042, CT-2026-0023, valores em tabelas não; só identificadores). Via `next/font/google`, sem dependência nova.
- Escala: 12 · 14 · 16 · 18 · 24 · 32. Título de página 24 px semibold, `tracking-tight`. Título de seção 14 px semibold. Rótulos 12–13 px `text-muted`. KPI 28–32 px semibold tabular.
- Pesos: 400 corpo, 500 rótulos e navegação, 600 títulos e números. Bold (700) só no logo.

### Forma, profundidade, espaço

- Raios: 6 (controles pequenos), 8 (botões, inputs), 12 (painéis, imagens), full (pílulas).
- Profundidade por **superfície e borda**, não sombra: painéis = borda 1 px; sombra só em camadas flutuantes (menu, popover, modal, toast).
- Grade de 4 px; respiro entre seções 32–40 px; dentro de painel 16–24 px.
- Nem tudo é card: seções do dashboard usam título + divisória; listas são linhas com divisória; painéis com borda só onde agrupam um objeto (gráfico, tabela, formulário).

### Interação

- Hover = `surface-muted`; ativo da navegação = pílula `surface-muted` + ícone em `primary` + texto `text` (referência enviada pelo Lauro: suave, sem preenchimento sólido).
- Foco continua com `--ring` + offset.
- Mesmo padrão de botão/segmentado/aba em todas as telas.

## 3. Layout e responsivo

| Faixa        | Navegação                                              | Conteúdo                                                                    |
| ------------ | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| ≥ 1280 px    | Sidebar fixa 240 px (sticky, altura total), recolhível | Largura máx. 1280 px centrada, gutter 32 px                                 |
| 1024–1279 px | Sidebar fixa                                           | Grades de 12 col. reduzem para 2 colunas principais                         |
| 768–1023 px  | **Trilho de ícones** fixo (64 px) com tooltips         | Grades de 2 colunas; KPIs 2×2                                               |
| < 768 px     | Topbar + gaveta                                        | Uma coluna, KPIs 2×2 compactos, tabelas viram lista, barra de ação inferior |

## 4. Dashboard

1. Cabeçalho: título + período à esquerda/direita na mesma linha; "Novo lead" como única ação primária.
2. KPIs: **uma faixa** com 4 células separadas por divisórias verticais (2×2 em tablet/celular). Rótulo curto, valor grande, delta discreto, sparkline alinhada à base.
3. Linha 2: Receita (8 col.) + Meta do mês (4 col.) com a mesma altura. Gráfico menor, eixo Y com 3 marcas, legenda no cabeçalho do painel, tooltip com as duas séries.
4. Meta do mês: resumo "Geral" em destaque (valor / meta + barra); corretores em linhas de uma linha (nome · valor/meta à direita · barra fina), ordenados por % atingido; os 5 primeiros visíveis, restante em "Mostrar todos".
5. Linha 3: Funil (7) + Próximos compromissos (5). Agenda com coluna de horário à esquerda, título truncado em 1 linha, tipo como ponto/rótulo curto.
6. Atividades recentes: linha do tempo compacta (ícone pequeno, texto, tempo relativo à direita), 6 itens + "Ver mais".

## 5. Identidade imobiliária

- Imóveis: foto como protagonista (4:3, raio 12), selo de status sobre a foto, preço como maior texto, código em mono, atributos (quartos, vagas, área) em linha discreta. Card sem borda: foto + texto.
- Detalhe do imóvel: galeria (foto principal + miniaturas) quando houver fotos.
- Fotografia só onde dá contexto (lista, detalhe, card de imóvel em contrato/visita). Ilustração continua como fallback, recolorida em cinza + verde.
- Leads: avatar neutro, etapa como pílula, atividade como linha do tempo.
- Disponibilidade: ponto de cor + rótulo (Disponível verde, Reservado âmbar, Vendido/Locado grafite, Inativo cinza).

## 6. Ordem de implementação

1. Tokens (cor, tipografia Geist, raios, sombras, `surface-muted`, `primary-subtle`), contraste e DESIGN_SYSTEM.
2. Shell: sidebar no estilo da referência, sticky; trilho no tablet; topbar mais baixa; largura de conteúdo; PageHeader.
3. Átomos: Button, Input/Select/Combobox, Badge, Tabs/SegmentedControl, Table, Progress, Card, Avatar.
4. Compostos: StatCard → faixa de KPIs, ChartCard/gráficos, SectionCard, AgendaList, ActivityFeed, PropertyCard/PropertyImage, LeadCard, DataTable responsiva.
5. Dashboard.
6. Imóveis, Leads, Contratos, Financeiro, Configurações.
7. QA visual (1440/1024/834/390, claro e escuro), axe, e2e, auditoria, catálogo.

---

# §2. Reformulação "quiet luxury" (2026-11-16)

Pedido do Lauro: reformulação completa seguindo o DESIGN.md enviado por ele e o canvas de inspiração (Dashboard, Agenda, Financeiro, Visual direction), para "um app com alma". Esta seção substitui a paleta verde perene e a sidebar clara da §1.

**Direção:** banco privado ou estúdio de arquitetura. Porcelana, papel, tinta, pedra e um único acento em latão; Instrument Serif nos títulos e números de destaque, Geist na interface, Geist Mono no dinheiro de tabela. Fios em vez de caixas, um painel em tinta por tela, cabeçalho editorial em toda página.

**Decisões:**

- O nome continua **Atrium** (o documento dizia "Atrius").
- O DESIGN.md prevalece sobre a §1: sai o verde, entra o latão; a sidebar passa a ser em tinta. A estrutura do menu (Comercial, Operação, Financeiro com submenu, Relatórios) não muda.
- Inputs mantêm `--border-strong` (3:1) em vez do fio claro do guia (1,3:1). Barras em pedra nos gráficos ficam abaixo de 3:1 por decisão de design e estão documentadas em `contrast.json` (há resumo acessível, rótulo e tabela).
- Sem dica ⌘K visível (preferência "menos é mais"); o atalho segue em `aria-keyshortcuts`.
- Botão destrutivo em tinta, com rótulo explícito, como pede o guia.
- Implementação: tokens em `design-system/tokens.json`, classe `.tinta` gerada para superfícies escuras, receitas em `DESIGN_SYSTEM.md` §2, §6 e §12.
- Foco nas telas: o catálogo de componentes não foi atualizado nesta etapa (pedido do Lauro).
