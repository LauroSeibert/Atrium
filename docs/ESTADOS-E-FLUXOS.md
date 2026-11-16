# Atrium — Máquinas de estado e fluxos críticos

> Regra do projeto: **nenhuma máquina de estado escondida** e **nenhuma regra de fluxo crítico espalhada pelo código**.
> Este documento é a especificação; a implementação vive em `src/domain/` e é a **única** fonte dessas regras.
> Implementação (Fase 5): `src/domain/<entidade>/estado.ts` (tabelas `TRANSICOES_*`, `pode…`, `transicoesPermitidas…`, `transicionar…`), `src/domain/comum/transacao.ts` (atomicidade, registro de alterações e desfazer), `src/domain/contrato/derivados.ts` e `src/domain/metricas/metricas.ts` (estados derivados), `src/domain/invariantes.ts` (`validarBase`). Testes ao lado de cada arquivo.

## 1. O problema que estamos evitando

Uma _hidden state machine_ aparece quando um estado e suas transições existem só implicitamente:

- Status alterado direto num componente (`lead.etapa = "fechado"`) ou com `setState` solto em vários lugares.
- Combinações de booleanos que formam estados não declarados (`isLoading && !isError && hasData`), incluindo estados impossíveis (`isLoading && isError`).
- A mesma regra ("só pode cancelar contrato ativo") repetida em botão, menu, atalho e API, cada cópia um pouco diferente.
- Efeitos colaterais de uma transição (gerar atividade, mudar status do imóvel, atualizar indicador) disparados por quem chamou, e não pela transição.

## 2. Regras obrigatórias

1. **Toda entidade com ciclo de vida tem uma máquina explícita** em `src/domain/<entidade>/estado.ts`: lista de estados, tabela de transições permitidas, _guards_ (condições) e efeitos.
2. **Um único ponto de mudança.** Só a função de transição do domínio (`transicionarNegociacao`, `transicionarImovel`, `transicionarContrato`, `registrarPagamento`, `transicionarAnuncio`, `registrarPagamentoDespesa`, `registrarPagamentoComissao`) altera o estado. UI, `fakeApi`, atalhos e ações em lote **chamam** essa função; nunca atribuem o campo.
3. **A UI pergunta, não decide.** O que habilitar/mostrar vem do domínio (`transicoesPermitidas(entidade)` / `podeTransicionar(entidade, alvo)`). Nenhum `if (status === …)` de regra de negócio em componente.
4. **Efeitos ficam na transição.** Gerar `Atividade` e o **registro de alteração** (§4), ajustar status do imóvel, preencher/limpar `motivoPerda`, montar o `desfazer` (RF-04): tudo dentro da função de transição, atomicamente.
5. **Estados derivados não são armazenados.** `inadimplente`, status da parcela, métricas e histórico do imóvel são calculados por funções puras em `src/domain/`, nunca gravados.
6. **Estado de UI assíncrono é uma união discriminada**, não booleanos: `{ fase: 'idle' | 'loading' | 'success' | 'error' | 'partial', … }` (o discriminante se chama `fase`, não `status`, para não colidir com o status das entidades nem com a regra de lint de fluxos críticos). Isso também garante os 5 estados obrigatórios de tela (RNF-09).
7. **Transição inválida falha alto**: lança erro tipado (`TransicaoInvalida`) em vez de ignorar em silêncio. Os tipos TS tornam impossível passar um estado fora do enum.
8. **Testes por transição**: cada máquina tem teste cobrindo todas as transições permitidas, as proibidas, os guards e os efeitos (Fase 5/10).
9. **Mudou a regra? Mude aqui primeiro.** Qualquer alteração em fluxo crítico atualiza este documento e a tabela em `estado.ts` no mesmo commit; a revisão (agente Opus) confere que não surgiu regra fora do domínio.

**Fluxos críticos** (as regras acima são obrigatórias para eles): etapa da negociação, status e preço do imóvel, status e valores do contrato, pagamento de parcela, comissão, despesa, status do anúncio, desfazer. Preço, status e valores monetários geram registro de alteração (§4).

## 3. Máquinas

### 3.1 Negociação (`etapa`)

Desde 2026-11-16 a etapa é da **negociação** (um lead × um imóvel, RF-70), não do lead: o mesmo lead pode estar em `visita` num imóvel e `perdido` em outro. Implementação: `src/domain/negociacao/estado.ts`.

Etapas: `novo → contato → visita → proposta → fechado`, mais `perdido`. A negociação pode ir para **qualquer** etapa (inclusive voltar ou pular), com estas regras:

| Transição            | Guard                                                     | Efeitos                                                                                                                                         |
| -------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| qualquer → `perdido` | `motivoPerda` informado (RF-32)                           | grava motivo                                                                                                                                    |
| `perdido` → outra    | não existe outra negociação aberta do mesmo lead × imóvel | limpa `motivoPerda`                                                                                                                             |
| qualquer → `fechado` | negociação com imóvel definido                            | —                                                                                                                                               |
| `fechado` → outra    | negociação sem contrato vinculado                         | —                                                                                                                                               |
| todas                | —                                                         | Atividade `etapaAlterada` no lead (imóvel em `relacionados`, `negociacaoId` em `dados`); registro de alteração (§4); atualiza `ordem` na coluna |

**Criar negociação** (`criarNegociacao`, RF-71): lead existente, imóvel existente ou `null`, e nenhuma negociação aberta do mesmo lead × imóvel; nasce em `novo`, responsável = do lead; Atividade `negociacaoCriada`. **Criar lead** (`criarLead`, RF-35) cria o lead e a primeira negociação na mesma transação. **Definir imóvel** de uma negociação sem imóvel (`definirImovelNegociacao`, permissão `podeDefinirImovel`) segue a mesma regra de duplicidade e gera Atividade `imovelDefinido` (alvo = lead, `dados.negociacaoId`). Negociação sem imóvel nunca conta como duplicada (um lead pode ter várias "sem imóvel"); a regra também vale ao reabrir (sair de `fechado`/`perdido` para uma etapa aberta). `criarLead` não gera `negociacaoCriada` (a criação do lead já é o evento).

A UI recebe pronto (via `fakeApi.listNegociacoes`): `destinos` (cada etapa de destino com `Permissao` e `exigeMotivo`, para "Mover para…") e `permissoesDeSoltar` (cada coluna do kanban; a própria coluna = reordenar, sempre permitido). Negociação não encontrada na tela = soltar negado. Após qualquer movimento a UI pergunta `contratosVinculaveis` (RF-39: só negociação `fechado`, contratos do imóvel dela, sem negociação e não cancelados) e só oferece o vínculo se vier algum.

### 3.2 Imóvel (`status`)

```mermaid
stateDiagram-v2
  [*] --> disponivel
  disponivel --> reservado
  reservado --> disponivel
  disponivel --> inativo
  reservado --> inativo
  inativo --> disponivel
  disponivel --> vendido: contrato de venda ativo
  disponivel --> alugado: contrato de locação ativo
  reservado --> vendido: contrato de venda ativo
  reservado --> alugado: contrato de locação ativo
  alugado --> disponivel: locação encerrada/cancelada
  vendido --> disponivel: venda cancelada
```

| Origem da transição                     | Permitidas                                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Usuário** (RF-25, RF-49)              | `disponivel ↔ reservado`, `disponivel/reservado → inativo` (com motivo), `inativo → disponivel` |
| **Sistema**, só via máquina do contrato | `→ vendido`, `→ alugado`, `vendido/alugado → disponivel`                                        |

Guard: imóvel com contrato ativo não aceita transição do usuário.

Na lista, cada imóvel chega com `transicoesPermitidasImovel` (já com o guard); o menu de lote (RF-49) usa `opcoesLoteImovel`, que permite um destino se ao menos um selecionado aceita (os demais são recusados por `transicionarImoveis` e listados no toast).

### 3.3 Contrato (`status`)

```mermaid
stateDiagram-v2
  [*] --> rascunho
  rascunho --> ativo: assinar
  rascunho --> cancelado
  ativo --> encerrado: fim da vigência / escritura
  ativo --> cancelado: cancelar (motivo)
```

| Transição                    | Guard                                                               | Efeitos                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rascunho → ativo`           | imóvel `disponivel`/`reservado`; `tipo` = finalidade                | imóvel → `vendido`/`alugado`; gera parcelas e comissões (se o rascunho não tiver: comissão do corretor do imóvel, 6 % venda / 10 % locação); Atividade |
| `ativo → encerrado`          | venda: escritura (todas as parcelas pagas); locação: `fim` atingido | locação: imóvel → `disponivel` (venda: segue `vendido`); Atividade                                                                                     |
| `ativo/rascunho → cancelado` | `motivoCancelamento` (RF-48)                                        | se estava `ativo`: imóvel → `disponivel` (rascunho não mexe no imóvel); parcelas não pagas passam a `cancelada` (derivado); Atividade                  |

`inadimplente` **não é estado**: é derivado (`ativo` + parcela atrasada).

Derivados entregues prontos à tela do contrato: `statusParcela` e `diasDeAtraso` por parcela, `resumoCronograma` (pagas, recebido, atrasadas, em atraso, a receber) e `repassesDoContrato` (RF-46; `null` quando não se aplica: venda ou locação sem taxa). Tudo pelo relógio do mock, nunca pelo relógio do navegador.

### 3.4 Parcela (derivada + uma ação)

Status derivado: `pago` (tem `pagoEm`) · `cancelada` (contrato cancelado, não paga) · `atrasado` (hoje > vencimento) · `aVencer`. A única ação é `registrarPagamento` (e seu `desfazer`), permitida só em contrato `ativo` e parcela não paga.

### 3.5 Visita (`status`)

`agendada → realizada | cancelada | naoCompareceu` (os três são finais). Agendar exige data futura e lead com ao menos uma negociação que não esteja `perdido`; marcar `realizada` acrescenta o imóvel em `imoveisVistos` do lead. Efeitos: Atividade `visitaAgendada`/`visitaRealizada`/`visitaCancelada` no lead, com o imóvel em `relacionados`.

Vincular contrato a negociação (RF-39): só negociação `fechado`, contrato do mesmo imóvel, sem negociação e não cancelado; Atividade `contratoVinculado`.

### 3.6 Estado de tela (UI)

`idle → loading → success | partial | error`; `error → loading` (tentar de novo); `success → loading` (refetch mantém dados visíveis). Implementado como união discriminada num único hook por recurso, nunca como booleanos soltos: `Recurso<T>` e `useRecurso` em `src/lib/recurso.ts`.

### 3.7 Notificações e badges do shell (derivados)

Não são máquinas de estado: são leituras derivadas, calculadas em `src/domain/notificacoes/notificacoes.ts` (antes ficavam no `fakeApi`). `listarNotificacoes` usa a mesma regra de `statusParcela` (vence em até 3 dias → `vencimento`; vencida → `atraso`; só contratos `ativo`) e as atividades de outras pessoas dos últimos 14 dias; `lida` vem da lista de ids lidos do usuário (único estado guardado, sem transição de negócio). `contadoresNavegacao` conta negociações em `novo` e parcelas atrasadas de contratos ativos (mesma regra do "inadimplente"). O shell só exibe.

### 3.8 Recorte por persona (RF-08)

`recortePadrao(usuario)` (`src/domain/corretor/operacoes.ts`): corretor vê só os registros dos quais é responsável; gestor e financeiro veem tudo. Imóveis e Leads usam essa função para o filtro inicial; o usuário pode desfazer o recorte. Agenda, Leads, Imóveis e Relatórios usam `recortePadrao`/`recorteResponsavel` (escolha explícita `meus`/`todos` vence a persona) e `vendedores` (opções de corretor); nenhuma tela compara `papel`.

### 3.8 Anúncio (`status`, RF-75, demonstração)

`transicoesPermitidasAnuncio` devolve `{ para, exigeConfirmacao }`; encerrar (final) exige confirmação e a tela só lê esse campo.

```mermaid
stateDiagram-v2
  [*] --> rascunho
  rascunho --> publicado: publicar
  publicado --> pausado: pausar
  pausado --> publicado: retomar
  rascunho --> encerrado
  publicado --> encerrado
  pausado --> encerrado
```

| Transição                      | Guard                                                | Efeitos                                                                  |
| ------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `rascunho/pausado → publicado` | imóvel `disponivel` ou `reservado`                   | 1ª publicação grava `publicadoEm`; Atividade `anuncioAlterado` no imóvel |
| `publicado → pausado`          | —                                                    | Atividade                                                                |
| `* → encerrado`                | — (final)                                            | Atividade                                                                |
| criar (`criarAnuncio`)         | nenhum anúncio não encerrado do mesmo imóvel × canal | nasce `rascunho`                                                         |

Implementação: `src/domain/anuncio/estado.ts`. "Imóvel indisponível" num anúncio publicado (imóvel vendido/alugado/inativo depois da publicação) é **derivado** na leitura (`alertaAnuncio`), não muda o status sozinho.

### 3.9 Despesa (derivada + uma ação, RF-78)

Status derivado (`statusDespesa`): `paga` (tem `pagaEm`) · `atrasada` (hoje > vencimento) · `aVencer`. Ações: `lancarDespesa`/`salvarDespesa` (editar valor, vencimento, categoria, descrição e contrato só enquanto não paga) e `registrarPagamentoDespesa` (só se não paga), ambas com desfazer. O pagamento gera registro de `pagaEm` e Atividade `despesaPaga`: alvo = contrato quando a despesa tem contrato (a despesa vai em `relacionados`), senão alvo = a própria despesa. Implementação: `src/domain/despesa/`.

### 3.10 Comissão (uma ação, RF-79)

`registrarPagamentoComissao(contratoId, indice)` (`indice` = posição em `contrato.comissoes`, a partir de 0): só contrato `ativo` ou `encerrado` e comissão sem `pagaEm`; grava `pagaEm` (registro de alteração `comissao.N.pagaEm`) e Atividade no contrato. Status exibido (`paga`/`pendente`) é derivado.

### 3.11 Documentos e contatos (sem ciclo de vida)

Não têm máquina: `adicionarDocumento`/`removerDocumento` (RF-76) e `salvarContato` (RF-74) rodam em `transacao()` (desfazer e Atividade `documentoAdicionado`/`documentoRemovido` no contrato), mas não geram registro de alteração. O arquivo em si fica no IndexedDB (`src/mocks/services/arquivos.ts`); remover o documento não apaga o arquivo, para o Desfazer funcionar.

## 4. Registro de alterações

Objetivo: deixar claro **quem alterou preço, status ou valores monetários, quando, e de quanto para quanto**. A edição continua livre; só fica registrada.

**O que é registrado:**

- **Preço e valores monetários:** preço, condomínio e IPTU do imóvel; orçamento do lead; valor do contrato, taxa de administração, pagamento de parcela e comissão.
- **Status:** status do imóvel, etapa da negociação, status do contrato, status do anúncio.
- **Despesas:** valor e pagamento (`valor`, `pagaEm`).

**Cada registro guarda:** quem (usuário atual), quando, o campo, o valor anterior e o novo.

**Como:** toda escrita do domínio roda em `transacao()`, que compara antes/depois os campos monitorados (`camposMonitorados`: imóvel `preco/condominio/iptu/status`; lead `orcamento`; negociação `etapa`; anúncio `status`; despesa `valor/pagaEm`; contrato `status/valor/taxaAdministracao/parcela.N.valor/parcela.N.pagoEm/comissao.N.valor/comissao.N.pagaEm`) e grava um registro por campo alterado (regra 4), então não há como mudar sem registrar. Criação de entidade ou de parcela não é alteração. "Desfazer" é só mais uma alteração e também aparece. Antes de aceitar o desfazer, `transacao()` roda `validarBase` na base resultante: se ele criaria uma violação nova (ex.: negociação volta de `fechado` com contrato já vinculado; perda desfeita com outra negociação aberta no mesmo lead × imóvel; anúncio reaberto com outro ativo no mesmo canal), lança `OperacaoInvalida("Não dá mais para desfazer: …")` e nada muda. Na UI, o detalhe de imóvel, lead e contrato mostra a seção "Histórico de alterações" (RF-65).
