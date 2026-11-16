"use client";
/**
 * Comissões — por competência e corretor (RF-79; RF-06 filtros na URL). Status e `podePagar` vêm do domínio.
 */
import { useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CartaoFinanceiro, CartaoFinanceiroSkeleton } from "@/components/patterns/CartaoFinanceiro";
import type { DataTableColuna } from "@/components/patterns/DataTable";
import { FilterBar } from "@/components/patterns/FilterBar";
import { LinkCodigo } from "@/components/patterns/LinkCodigo";
import { ListaResponsiva } from "@/components/patterns/ListaResponsiva";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { TableDensity } from "@/components/ui/Table";
import type { StatusComissao } from "@/domain";
import { useConsulta } from "@/features/dados/useConsulta";
import { useAcaoEmLinha } from "@/features/dados/useAcaoEmLinha";
import { useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { formatData, formatMoeda, formatPercentual } from "@/lib/format";
import { paginar } from "@/lib/paginacao";
import { mapear } from "@/lib/recurso";
import { useTelaLarga } from "@/lib/useMidia";
import { usePreferencia } from "@/lib/preferencias";
import { fakeApi } from "@/mocks/services/fakeApi";
import { AcaoPagar } from "./AcaoPagar";
import { lerPagina, mesValido, POR_PAGINA } from "./compartilhado";
import { rotuloCompetencia, STATUS_COMISSAO_UI } from "./rotulos";
import type { LinhaComissaoTela } from "./tipos";

const STATUS: readonly StatusComissao[] = ["pendente", "paga"];
const semImovel = { titulo: "Imóvel removido", codigo: "—" };
const idLinha = (l: LinhaComissaoTela) => `${l.contratoId}:${l.indice}`;

type Dados = {
  linhas: LinhaComissaoTela[];
  competencias: string[];
  corretores: { id: string; nome: string }[];
};

export function TelaComissoes() {
  const url = useParametrosUrl();
  const { estado: pagamento, executar } = useAcaoEmLinha();
  const telaLarga = useTelaLarga();
  const [densidade] = usePreferencia<TableDensity>("densidade", "comfortable");

  const competencia = mesValido(url.ler("competencia"));
  const corretorId = url.ler("corretor") || undefined;
  const statusBruto = url.ler("status");
  const status = STATUS.find((s) => s === statusBruto);
  const pagina = lerPagina(url.ler("pagina"));

  const carregar = useCallback(async (): Promise<Dados> => {
    const [linhas, competencias, corretores] = await Promise.all([
      fakeApi.listComissoes({ competencia, corretorId, status }),
      fakeApi.listCompetenciasComissao(),
      fakeApi.listCorretores(),
    ]);
    return { linhas, competencias, corretores: corretores.map((c) => ({ id: c.id, nome: c.nome })) };
  }, [competencia, corretorId, status]);
  const { estado, recarregar } = useConsulta(carregar);

  const lista = useMemo(
    () => mapear(estado, (d) => paginar(d.linhas, { pagina, porPagina: POR_PAGINA })),
    [estado, pagina],
  );
  const dados = "dados" in estado ? estado.dados : undefined;
  const total = dados?.linhas.length;

  const limparFiltros = () => url.definir({ competencia: undefined, corretor: undefined, status: undefined });
  const temFiltro = Boolean(competencia || corretorId || status);

  const acao = (l: LinhaComissaoTela) => (
    <AcaoPagar
      permissao={l.podePagar}
      id={idLinha(l)}
      rotulo="Marcar como paga"
      rotuloAcessivel={`Marcar como paga a comissão de ${l.corretor ?? "corretor removido"} em ${l.numeroContrato}`}
      andamento={pagamento}
      onPagar={() =>
        void executar(idLinha(l), () => fakeApi.pagarComissao(l.contratoId, l.indice), {
          sucesso: "Comissão marcada como paga",
        })
      }
    />
  );

  const colunas: DataTableColuna<LinhaComissaoTela>[] = [
    {
      id: "competencia",
      cabecalho: "Competência",
      celula: (l) => <span className="whitespace-nowrap">{rotuloCompetencia(l.competencia)}</span>,
    },
    {
      id: "corretor",
      cabecalho: "Corretor",
      celula: (l) => <span className="break-words">{l.corretor ?? "Corretor removido"}</span>,
    },
    {
      id: "contrato",
      cabecalho: "Contrato",
      className: "min-w-44 max-w-60",
      celula: (l) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <LinkCodigo href={`/contratos/${l.contratoId}`}>{l.numeroContrato}</LinkCodigo>
          <span className="line-clamp-1 text-xs text-text-muted">{(l.imovel ?? semImovel).titulo}</span>
        </div>
      ),
    },
    {
      id: "base",
      cabecalho: "Base",
      alinhamento: "direita",
      celula: (l) => (
        <span className="flex flex-col whitespace-nowrap">
          <span>{formatMoeda(l.base)}</span>
          <span className="text-xs text-text-muted">{formatPercentual(l.percentual / 100)}</span>
        </span>
      ),
    },
    {
      id: "valor",
      cabecalho: "Comissão",
      alinhamento: "direita",
      celula: (l) => <span className="font-medium whitespace-nowrap">{formatMoeda(l.valor)}</span>,
    },
    {
      id: "status",
      cabecalho: "Status",
      celula: (l) => (
        <span className="flex flex-col gap-0.5">
          <Badge tone={STATUS_COMISSAO_UI[l.status].tom} dot>
            {STATUS_COMISSAO_UI[l.status].rotulo}
          </Badge>
          {l.pagaEm ? <span className="tnum text-xs text-text-muted">{formatData(l.pagaEm)}</span> : null}
        </span>
      ),
    },
    { id: "acao", cabecalho: <span className="sr-only">Ação</span>, alinhamento: "direita", celula: acao },
  ];

  const filtrosBarra = (
    <>
      <Select
        aria-label="Competência"
        className="w-52"
        value={competencia ?? "todas"}
        onValueChange={(v) => url.definir({ competencia: v === "todas" ? undefined : v })}
        options={[
          { value: "todas", label: "Todas as competências" },
          ...(dados?.competencias ?? []).map((m) => ({ value: m, label: rotuloCompetencia(m) })),
        ]}
      />
      <Select
        aria-label="Corretor"
        className="w-52"
        value={corretorId ?? "todos"}
        onValueChange={(v) => url.definir({ corretor: v === "todos" ? undefined : v })}
        options={[
          { value: "todos", label: "Todos os corretores" },
          ...(dados?.corretores ?? []).map((k) => ({ value: k.id, label: k.nome })),
        ]}
      />
      <Select
        aria-label="Status"
        className="w-44"
        value={status ?? "todos"}
        onValueChange={(v) => url.definir({ status: v === "todos" ? undefined : v })}
        options={[
          { value: "todos", label: "Todos os status" },
          ...STATUS.map((s) => ({ value: s, label: STATUS_COMISSAO_UI[s].rotulo })),
        ]}
      />
    </>
  );

  return (
    <>
      <PageHeader titulo="Comissões" />
      <div className="flex min-w-0 flex-col gap-4">
        <FilterBar
          aVista={filtrosBarra}
          onLimparTudo={temFiltro ? limparFiltros : undefined}
          total={total}
          estado={estado.fase === "loading" ? "carregando" : "pronto"}
          rotuloItem={["comissão", "comissões"]}
        />
        <ListaResponsiva
          rotulo="Comissões"
          telaLarga={telaLarga}
          densidade={densidade}
          cartaoCarregando={<CartaoFinanceiroSkeleton />}
          colunas={colunas}
          idLinha={idLinha}
          estado={lista}
          onTentarNovamente={recarregar}
          onPaginaChange={(p) => url.definir({ pagina: String(p) })}
          vazio={{
            titulo: temFiltro ? "Nenhuma comissão com esses filtros" : "Nenhuma comissão ainda",
            acao: temFiltro ? (
              <Button variant="secondary" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            ) : undefined,
          }}
          cartao={(l) => (
            <CartaoFinanceiro
              titulo={l.corretor ?? "Corretor removido"}
              subtitulo={`${l.numeroContrato} · ${(l.imovel ?? semImovel).titulo}`}
              status={STATUS_COMISSAO_UI[l.status]}
              campos={[
                { rotulo: "Competência", valor: rotuloCompetencia(l.competencia) },
                { rotulo: "Comissão", valor: formatMoeda(l.valor) },
                { rotulo: "Base", valor: `${formatMoeda(l.base)} (${formatPercentual(l.percentual / 100)})` },
                ...(l.pagaEm ? [{ rotulo: "Paga em", valor: formatData(l.pagaEm) }] : []),
              ]}
              acao={acao(l)}
            />
          )}
        />
      </div>
    </>
  );
}
