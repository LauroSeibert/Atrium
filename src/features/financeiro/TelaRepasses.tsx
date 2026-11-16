"use client";
/**
 * Repasses — ao proprietário, por mês (RF-80; mesma regra do RF-46, derivada no domínio). Mês na URL (RF-06).
 */
import { useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CartaoFinanceiro, CartaoFinanceiroSkeleton } from "@/components/patterns/CartaoFinanceiro";
import type { DataTableColuna } from "@/components/patterns/DataTable";
import { FilterBar } from "@/components/patterns/FilterBar";
import { LinkCodigo } from "@/components/patterns/LinkCodigo";
import { ListaResponsiva } from "@/components/patterns/ListaResponsiva";
import { Select } from "@/components/ui/Select";
import type { TableDensity } from "@/components/ui/Table";
import { useConsulta } from "@/features/dados/useConsulta";
import { useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { formatData, formatMoeda, formatPercentual } from "@/lib/format";
import { paginar } from "@/lib/paginacao";
import { usePreferencia } from "@/lib/preferencias";
import { mapear } from "@/lib/recurso";
import { useTelaLarga } from "@/lib/useMidia";
import { fakeApi } from "@/mocks/services/fakeApi";
import { lerPagina, mesValido, POR_PAGINA } from "./compartilhado";
import { rotuloCompetencia } from "./rotulos";
import type { LinhaRepasseTela } from "./tipos";
import { Button } from "@/components/ui/Button";

const semImovel = { titulo: "Imóvel removido", codigo: "—" };
const idLinha = (l: LinhaRepasseTela) => `${l.contratoId}:${l.numero}`;

type Dados = { linhas: LinhaRepasseTela[]; meses: string[] };

export function TelaRepasses() {
  const url = useParametrosUrl();
  const mes = mesValido(url.ler("mes"));
  const pagina = lerPagina(url.ler("pagina"));

  const carregar = useCallback(async (): Promise<Dados> => {
    const [linhas, meses] = await Promise.all([fakeApi.listRepasses({ mes }), fakeApi.listMesesRepasse()]);
    return { linhas, meses };
  }, [mes]);
  const { estado, recarregar } = useConsulta(carregar);

  const lista = useMemo(
    () => mapear(estado, (d) => paginar(d.linhas, { pagina, porPagina: POR_PAGINA })),
    [estado, pagina],
  );
  const dados = "dados" in estado ? estado.dados : undefined;
  const telaLarga = useTelaLarga();
  const [densidade] = usePreferencia<TableDensity>("densidade", "comfortable");
  const limpar = () => url.definir({ mes: undefined });

  const colunas: DataTableColuna<LinhaRepasseTela>[] = [
    {
      id: "contrato",
      cabecalho: "Contrato",
      celula: (l) => (
        <div className="flex flex-col gap-0.5">
          <LinkCodigo href={`/contratos/${l.contratoId}`}>{l.numeroContrato}</LinkCodigo>
          <span className="text-xs text-text-muted">Parcela {l.numero}</span>
        </div>
      ),
    },
    {
      id: "imovel",
      cabecalho: "Imóvel",
      className: "min-w-44 max-w-60",
      celula: (l) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="line-clamp-2">{(l.imovel ?? semImovel).titulo}</span>
          <span className="font-mono text-xs text-text-muted">{(l.imovel ?? semImovel).codigo}</span>
        </div>
      ),
    },
    {
      id: "pago",
      cabecalho: "Pago em",
      celula: (l) => <span className="tnum whitespace-nowrap">{formatData(l.pagoEm)}</span>,
    },
    {
      id: "aluguel",
      cabecalho: "Aluguel",
      alinhamento: "direita",
      celula: (l) => <span className="whitespace-nowrap">{formatMoeda(l.aluguel)}</span>,
    },
    {
      id: "taxa",
      cabecalho: "Taxa",
      alinhamento: "direita",
      celula: (l) => <span className="whitespace-nowrap">{formatPercentual(l.taxaAdministracao / 100)}</span>,
    },
    {
      id: "repasse",
      cabecalho: "Repasse",
      alinhamento: "direita",
      celula: (l) => <span className="font-medium whitespace-nowrap">{formatMoeda(l.repasse)}</span>,
    },
  ];

  return (
    <>
      <PageHeader titulo="Repasses" />
      <div className="flex min-w-0 flex-col gap-4">
        <FilterBar
          aVista={
            <Select
              aria-label="Mês"
              className="w-52"
              value={mes ?? "todos"}
              onValueChange={(v) => url.definir({ mes: v === "todos" ? undefined : v })}
              options={[
                { value: "todos", label: "Todos os meses" },
                ...(dados?.meses ?? []).map((m) => ({ value: m, label: rotuloCompetencia(m) })),
              ]}
            />
          }
          onLimparTudo={mes ? limpar : undefined}
          total={dados?.linhas.length}
          estado={estado.fase === "loading" ? "carregando" : "pronto"}
          rotuloItem={["repasse", "repasses"]}
        />
        <ListaResponsiva
          rotulo="Repasses"
          telaLarga={telaLarga}
          densidade={densidade}
          cartaoCarregando={<CartaoFinanceiroSkeleton />}
          colunas={colunas}
          idLinha={idLinha}
          estado={lista}
          onTentarNovamente={recarregar}
          onPaginaChange={(p) => url.definir({ pagina: String(p) })}
          vazio={{
            titulo: mes ? "Nenhum repasse neste mês" : "Nenhum repasse ainda",
            acao: mes ? (
              <Button variant="secondary" onClick={limpar}>
                Limpar filtros
              </Button>
            ) : undefined,
          }}
          cartao={(l) => (
            <CartaoFinanceiro
              titulo={l.numeroContrato}
              subtitulo={(l.imovel ?? semImovel).titulo}
              campos={[
                { rotulo: "Pago em", valor: formatData(l.pagoEm) },
                { rotulo: "Aluguel", valor: formatMoeda(l.aluguel) },
                { rotulo: "Taxa", valor: formatPercentual(l.taxaAdministracao / 100) },
                { rotulo: "Repasse", valor: formatMoeda(l.repasse) },
              ]}
            />
          )}
        />
      </div>
    </>
  );
}
