"use client";
/**
 * Receitas — parcelas de todos os contratos (RF-77; RF-43 registrar pagamento; RF-06 filtros na URL).
 * Status, atraso e `podePagar` vêm derivados do domínio; a tela só monta.
 */
import { Download } from "lucide-react";
import { useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CartaoFinanceiro, CartaoFinanceiroSkeleton } from "@/components/patterns/CartaoFinanceiro";
import type { DataTableColuna } from "@/components/patterns/DataTable";
import { FilterBar, type FiltroAtivo } from "@/components/patterns/FilterBar";
import { IntervaloDeDatas } from "@/components/patterns/IntervaloDeDatas";
import { STATUS_PARCELA_UI, TIPO_CONTRATO_ROTULO } from "@/components/patterns/rotulos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkCodigo } from "@/components/patterns/LinkCodigo";
import { ListaResponsiva } from "@/components/patterns/ListaResponsiva";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import type { TableDensity } from "@/components/ui/Table";
import { toast } from "@/components/ui/Toast";
import type { StatusParcela, TipoContrato } from "@/domain";
import { useAcaoEmLinha } from "@/features/dados/useAcaoEmLinha";
import { useConsulta } from "@/features/dados/useConsulta";
import { DEBOUNCE_BUSCA_MS, useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { baixarCsv } from "@/lib/csv";
import { formatData, formatMoeda } from "@/lib/format";
import { usePreferencia } from "@/lib/preferencias";
import { useTelaLarga } from "@/lib/useMidia";
import { fakeApi, type FiltrosReceitas } from "@/mocks/services/fakeApi";
import { AcaoPagar } from "./AcaoPagar";
import { dataValida, filtrarConhecidos, lerPagina, POR_PAGINA } from "./compartilhado";
import { gerarCsvReceitas } from "./csv";
import type { LinhaReceitaTela } from "./tipos";

const STATUS: readonly StatusParcela[] = ["aVencer", "atrasado", "pago", "cancelada"];
const TIPOS: readonly TipoContrato[] = ["venda", "locacao"];
const semImovel = { titulo: "Imóvel removido", codigo: "—" };
const diasAtraso = (n: number) => (n === 1 ? "1 dia" : `${n} dias`);

export function TelaReceitas() {
  const url = useParametrosUrl();
  const { estado: pagamento, executar } = useAcaoEmLinha();
  const telaLarga = useTelaLarga();
  const [densidade] = usePreferencia<TableDensity>("densidade", "comfortable");

  const busca = url.ler("busca") ?? "";
  const tipoBruto = url.ler("tipo");
  const tipo = TIPOS.find((t) => t === tipoBruto);
  const statusChave = filtrarConhecidos(url.lerLista("status"), STATUS).join(",");
  const de = dataValida(url.ler("de"));
  const ate = dataValida(url.ler("ate"));
  const pagina = lerPagina(url.ler("pagina"));

  const status = useMemo(() => (statusChave ? (statusChave.split(",") as StatusParcela[]) : []), [statusChave]);
  const filtros = useMemo<FiltrosReceitas>(
    () => ({
      busca: busca || undefined,
      tipo,
      status: status.length ? status : undefined,
      vencimentoDe: de,
      vencimentoAte: ate,
    }),
    [busca, tipo, status, de, ate],
  );

  const carregar = useCallback(
    () => fakeApi.listReceitas(filtros, { pagina, porPagina: POR_PAGINA }),
    [filtros, pagina],
  );
  const { estado, recarregar } = useConsulta(carregar);
  const total = "dados" in estado && estado.dados ? estado.dados.total : undefined;

  const alternarStatus = (s: StatusParcela, marcado: boolean) =>
    url.definir({ status: marcado ? [...status, s] : status.filter((x) => x !== s) });
  const ativos: FiltroAtivo[] = [
    ...(tipo
      ? [
          {
            id: "tipo",
            rotulo: `Tipo: ${TIPO_CONTRATO_ROTULO[tipo]}`,
            onRemover: () => url.definir({ tipo: undefined }),
          },
        ]
      : []),
    ...status.map((s) => ({
      id: `status-${s}`,
      rotulo: `Status: ${STATUS_PARCELA_UI[s].rotulo}`,
      onRemover: () => alternarStatus(s, false),
    })),
    ...(de
      ? [{ id: "de", rotulo: `Vence a partir de ${formatData(de)}`, onRemover: () => url.definir({ de: undefined }) }]
      : []),
    ...(ate
      ? [{ id: "ate", rotulo: `Vence até ${formatData(ate)}`, onRemover: () => url.definir({ ate: undefined }) }]
      : []),
  ];
  const limparFiltros = () =>
    url.definir({ tipo: undefined, status: undefined, de: undefined, ate: undefined, busca: undefined });
  const temFiltro = ativos.length > 0 || busca !== "";

  /** Exporta tudo o que os filtros pegam, não só a página visível. */
  const exportar = () =>
    fakeApi.listReceitas(filtros, { pagina: 1, porPagina: 100_000 }).then(
      (todas) => {
        baixarCsv("receitas.csv", gerarCsvReceitas(todas.itens));
        toast({ tone: "success", title: "CSV gerado", description: `${todas.itens.length} parcelas.` });
      },
      () => toast({ tone: "error", title: "Não foi possível gerar o CSV", description: "Tente de novo." }),
    );

  const acao = (l: LinhaReceitaTela) => {
    const id = `${l.contratoId}:${l.numero}`;
    return (
      <AcaoPagar
        permissao={l.podePagar}
        id={id}
        rotulo="Registrar pagamento"
        rotuloAcessivel={`Registrar pagamento da parcela ${l.numero} de ${l.numeroContrato}`}
        andamento={pagamento}
        onPagar={() =>
          void executar(id, () => fakeApi.registrarPagamento(l.contratoId, l.numero), {
            sucesso: "Pagamento registrado",
          })
        }
      />
    );
  };

  const colunas: DataTableColuna<LinhaReceitaTela>[] = [
    {
      id: "contrato",
      cabecalho: "Contrato",
      celula: (l) => (
        <div className="flex flex-col gap-0.5">
          <LinkCodigo href={`/contratos/${l.contratoId}`}>{l.numeroContrato}</LinkCodigo>
          <span className="text-xs text-text-muted">
            {TIPO_CONTRATO_ROTULO[l.tipo]} · parcela {l.numero}
          </span>
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
          <span className="num text-xs text-text-muted">{(l.imovel ?? semImovel).codigo}</span>
        </div>
      ),
    },
    {
      id: "vencimento",
      cabecalho: "Vencimento",
      celula: (l) => <span className="tnum whitespace-nowrap">{formatData(l.vencimento)}</span>,
    },
    {
      id: "valor",
      cabecalho: "Valor",
      alinhamento: "direita",
      celula: (l) => <span className="whitespace-nowrap">{formatMoeda(l.valor)}</span>,
    },
    {
      id: "status",
      cabecalho: "Status",
      celula: (l) => <Badge tone={STATUS_PARCELA_UI[l.status].tom}>{STATUS_PARCELA_UI[l.status].rotulo}</Badge>,
    },
    {
      id: "atraso",
      cabecalho: "Atraso",
      alinhamento: "direita",
      celula: (l) =>
        l.diasAtraso > 0 ? (
          <span className="tnum whitespace-nowrap text-danger">{diasAtraso(l.diasAtraso)}</span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    { id: "acao", cabecalho: <span className="sr-only">Ação</span>, alinhamento: "direita", celula: acao },
  ];

  const filtrosPopover = (
    <>
      <Field label="Tipo">
        {(c) => (
          <Select
            {...c}
            value={tipo ?? "todos"}
            onValueChange={(v) => url.definir({ tipo: v === "todos" ? undefined : v })}
            options={[
              { value: "todos", label: "Todos" },
              ...TIPOS.map((t) => ({ value: t, label: TIPO_CONTRATO_ROTULO[t] })),
            ]}
          />
        )}
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-text">Status</legend>
        {STATUS.map((s) => (
          <Checkbox
            key={s}
            label={STATUS_PARCELA_UI[s].rotulo}
            checked={status.includes(s)}
            onCheckedChange={(m) => alternarStatus(s, m === true)}
          />
        ))}
      </fieldset>
      <IntervaloDeDatas
        rotulo="Vencimento"
        de={de ?? ""}
        ate={ate ?? ""}
        onDeChange={(v) => url.definir({ de: v })}
        onAteChange={(v) => url.definir({ ate: v })}
      />
    </>
  );

  return (
    <>
      <PageHeader
        eyebrow="Financeiro · receitas"
        titulo="Receitas"
        acoes={
          <Button variant="secondary" leadingIcon={Download} onClick={() => void exportar()} disabled={!total}>
            Exportar CSV
          </Button>
        }
      />
      <div className="flex min-w-0 flex-col gap-4">
        <FilterBar
          busca={busca}
          onBuscaChange={(b) => url.definir({ busca: b })}
          debounceMs={DEBOUNCE_BUSCA_MS}
          rotuloBusca="Buscar receitas"
          placeholderBusca="Contrato ou imóvel"
          filtros={filtrosPopover}
          ativos={ativos}
          onLimparTudo={limparFiltros}
          total={total}
          estado={estado.fase === "loading" ? "carregando" : "pronto"}
          rotuloItem={["parcela", "parcelas"]}
        />
        <ListaResponsiva
          telaLarga={telaLarga}
          densidade={densidade}
          cartaoCarregando={<CartaoFinanceiroSkeleton />}
          rotulo="Receitas"
          colunas={colunas}
          idLinha={(l) => `${l.contratoId}:${l.numero}`}
          estado={estado}
          onTentarNovamente={recarregar}
          onPaginaChange={(p) => url.definir({ pagina: String(p) })}
          vazio={{
            titulo: temFiltro ? "Nenhuma parcela com esses filtros" : "Nenhuma parcela ainda",
            acao: temFiltro ? (
              <Button variant="secondary" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            ) : undefined,
          }}
          cartao={(l) => (
            <CartaoFinanceiro
              titulo={l.numeroContrato}
              subtitulo={(l.imovel ?? semImovel).titulo}
              status={STATUS_PARCELA_UI[l.status]}
              campos={[
                { rotulo: "Vencimento", valor: formatData(l.vencimento) },
                { rotulo: "Valor", valor: formatMoeda(l.valor) },
                { rotulo: "Parcela", valor: `${l.numero} · ${TIPO_CONTRATO_ROTULO[l.tipo]}` },
                { rotulo: "Atraso", valor: l.diasAtraso > 0 ? diasAtraso(l.diasAtraso) : "—" },
              ]}
              acao={acao(l)}
            />
          )}
        />
      </div>
    </>
  );
}
