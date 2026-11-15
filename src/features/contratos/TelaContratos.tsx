"use client";
/**
 * Contratos — lista (RF-40, RF-41, RF-47, RF-49; RF-06 estado na URL; RF-09 densidade).
 * Só monta compostos e liga ao fakeApi: status de exibição e próximo vencimento vêm derivados do domínio.
 */
import { Download } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContractCard, ContractCardSkeleton } from "@/components/patterns/ContractCard";
import { DataTable, type DataTableAcaoEmLote, type DataTableColuna } from "@/components/patterns/DataTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { EstadoRecurso } from "@/components/patterns/EstadoRecurso";
import { FilterBar, type FiltroAtivo } from "@/components/patterns/FilterBar";
import { STATUS_CONTRATO_UI, TIPO_CONTRATO_ROTULO } from "@/components/patterns/rotulos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import type { TableDensity } from "@/components/ui/Table";
import { toast } from "@/components/ui/Toast";
import { PERMITIDO, type StatusExibicaoContrato, type TipoContrato } from "@/domain";
import { DEBOUNCE_BUSCA_MS, useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { useConsulta } from "@/features/dados/useConsulta";
import { baixarCsv } from "@/lib/csv";
import { formatData, formatMoeda } from "@/lib/format";
import { usePreferencia } from "@/lib/preferencias";
import { useTelaLarga } from "@/lib/useMidia";
import { fakeApi } from "@/mocks/services/fakeApi";
import { gerarCsv } from "./csv";
import type { LinhaContrato } from "./tipos";

const POR_PAGINA = 10;
const STATUS: readonly StatusExibicaoContrato[] = ["rascunho", "ativo", "inadimplente", "encerrado", "cancelado"];
const TIPOS: readonly TipoContrato[] = ["venda", "locacao"];
const ORDENS = {
  recentes: "Mais recentes",
  valorDesc: "Maior valor",
  vencimento: "Próximo vencimento",
} as const;
type Ordem = keyof typeof ORDENS;
const ISO_DATA = /^\d{4}-\d{2}-\d{2}$/;

const eOrdem = (v: string | undefined): v is Ordem => v !== undefined && v in ORDENS;
const eTipo = (v: string | undefined): v is TipoContrato => TIPOS.includes(v as TipoContrato);
const eStatus = (v: string): v is StatusExibicaoContrato => STATUS.includes(v as StatusExibicaoContrato);
const dataValida = (v: string | undefined) => (v && ISO_DATA.test(v) ? v : undefined);

function resumoPartes(l: LinhaContrato): string {
  const [primeira, segunda, ...resto] = l.contrato.partes;
  const nomes = [primeira, segunda].filter(Boolean).map((p) => p!.nome);
  return resto.length > 0 ? `${nomes.join(", ")} +${resto.length}` : nomes.join(", ");
}

const semImovel = { titulo: "Imóvel removido", codigo: "—" };

export function TelaContratos() {
  const url = useParametrosUrl();
  const [densidade] = usePreferencia<TableDensity>("densidade", "comfortable");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const telaLarga = useTelaLarga();

  const busca = url.ler("busca") ?? "";
  const tipoBruto = url.ler("tipo");
  const tipo = eTipo(tipoBruto) ? tipoBruto : undefined;
  const statusChave = url.lerLista("status").filter(eStatus).join(",");
  const de = dataValida(url.ler("de"));
  const ate = dataValida(url.ler("ate"));
  const ordemBruta = url.ler("ordem");
  const ordem: Ordem = eOrdem(ordemBruta) ? ordemBruta : "recentes";
  const pagina = Math.max(1, Number.parseInt(url.ler("pagina") ?? "1", 10) || 1);

  const status = useMemo(
    () => (statusChave ? (statusChave.split(",") as StatusExibicaoContrato[]) : []),
    [statusChave],
  );
  const filtros = useMemo(
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
    () => fakeApi.listContratos(filtros, { pagina, porPagina: POR_PAGINA }, ordem),
    [filtros, pagina, ordem],
  );
  const { estado, recarregar } = useConsulta(carregar);

  const total = "dados" in estado && estado.dados ? estado.dados.total : undefined;

  const alternarStatus = (s: StatusExibicaoContrato, marcado: boolean) =>
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
      rotulo: `Status: ${STATUS_CONTRATO_UI[s].rotulo}`,
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

  const exportarVisiveis = () => {
    if (!("dados" in estado) || !estado.dados) return;
    baixarCsv("contratos.csv", gerarCsv(estado.dados.itens));
    toast({
      tone: "success",
      title: "CSV gerado",
      description: `${estado.dados.itens.length} contratos na tabela visível.`,
    });
  };

  /** Seleção atravessa páginas: busca os contratos escolhidos, não só os da página atual. */
  const exportarSelecionados = (ids: string[]) => {
    fakeApi.listContratos({}, { pagina: 1, porPagina: 100_000 }, ordem).then(
      (todos) => {
        const escolhidos = todos.itens.filter((l) => ids.includes(l.contrato.id));
        baixarCsv("contratos-selecionados.csv", gerarCsv(escolhidos));
        toast({ tone: "success", title: "CSV gerado", description: `${escolhidos.length} contratos selecionados.` });
      },
      () => toast({ tone: "error", title: "Não foi possível gerar o CSV", description: "Tente de novo." }),
    );
  };

  const acoesEmLote: DataTableAcaoEmLote[] = [
    {
      id: "exportar-csv",
      rotulo: "Exportar CSV",
      icone: Download,
      permissao: PERMITIDO,
      onExecutar: exportarSelecionados,
    },
  ];

  const colunas: DataTableColuna<LinhaContrato>[] = [
    {
      id: "numero",
      cabecalho: "Contrato",
      celula: (l) => (
        <div className="flex flex-col gap-0.5">
          <Link
            href={`/contratos/${l.contrato.id}`}
            className="rounded-sm font-mono text-sm font-medium whitespace-nowrap text-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {l.contrato.numero}
          </Link>
          <span className="tnum text-xs whitespace-nowrap text-text-muted">
            {TIPO_CONTRATO_ROTULO[l.contrato.tipo]} · {formatData(l.contrato.inicio)} a {formatData(l.contrato.fim)}
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
          <span className="truncate">{(l.imovel ?? semImovel).titulo}</span>
          <span className="font-mono text-xs text-text-muted">{(l.imovel ?? semImovel).codigo}</span>
        </div>
      ),
    },
    {
      id: "partes",
      cabecalho: "Partes",
      className: "min-w-40 max-w-56",
      celula: (l) => <span className="break-words text-text-muted">{resumoPartes(l)}</span>,
    },
    {
      id: "valor",
      cabecalho: "Valor",
      alinhamento: "direita",
      celula: (l) => <span className="whitespace-nowrap">{formatMoeda(l.contrato.valor)}</span>,
    },
    {
      id: "status",
      cabecalho: "Status",
      celula: (l) => (
        <Badge tone={STATUS_CONTRATO_UI[l.statusExibicao].tom} dot>
          {STATUS_CONTRATO_UI[l.statusExibicao].rotulo}
        </Badge>
      ),
    },
    {
      id: "proximoVencimento",
      cabecalho: "Vencimento",
      celula: (l) =>
        l.proximoVencimento ? (
          <span className="tnum flex flex-col whitespace-nowrap">
            <span>{formatData(l.proximoVencimento.vencimento)}</span>
            <span className="text-xs text-text-muted">{formatMoeda(l.proximoVencimento.valor)}</span>
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
  ];

  const vazio = {
    titulo: temFiltro ? "Nenhum contrato com esses filtros" : "Nenhum contrato ainda",
    acao: temFiltro ? (
      <Button variant="secondary" onClick={limparFiltros}>
        Limpar filtros
      </Button>
    ) : undefined,
  };

  const filtrosPopover = (
    <>
      <Field label="Tipo">
        {(c) => (
          <Select
            {...c}
            value={tipo ?? "todos"}
            onValueChange={(v) => url.definir({ tipo: v === "todos" ? undefined : v })}
            options={[
              { value: "todos", label: "Todos os tipos" },
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
            label={STATUS_CONTRATO_UI[s].rotulo}
            checked={status.includes(s)}
            onCheckedChange={(m) => alternarStatus(s, m === true)}
          />
        ))}
      </fieldset>
      <Field label="Vencimento a partir de">
        {(c) => <Input {...c} type="date" value={de ?? ""} onChange={(e) => url.definir({ de: e.target.value })} />}
      </Field>
      <Field label="Vencimento até">
        {(c) => <Input {...c} type="date" value={ate ?? ""} onChange={(e) => url.definir({ ate: e.target.value })} />}
      </Field>
    </>
  );

  return (
    <>
      <PageHeader
        titulo="Contratos"
        acoes={
          <Button variant="secondary" leadingIcon={Download} onClick={exportarVisiveis} disabled={!total}>
            Exportar CSV
          </Button>
        }
      />
      <div className="flex min-w-0 flex-col gap-4">
        <FilterBar
          busca={busca}
          onBuscaChange={(b) => url.definir({ busca: b })}
          debounceMs={DEBOUNCE_BUSCA_MS}
          rotuloBusca="Buscar contratos"
          placeholderBusca="Número, parte ou código do imóvel"
          filtros={filtrosPopover}
          ativos={ativos}
          onLimparTudo={limparFiltros}
          total={total}
          estado={estado.fase === "loading" ? "carregando" : "pronto"}
          rotuloItem={["contrato", "contratos"]}
          ordenacao={
            <Select
              aria-label="Ordenar por"
              value={ordem}
              onValueChange={(v) => url.definir({ ordem: v === "recentes" ? undefined : v })}
              options={Object.entries(ORDENS).map(([value, label]) => ({ value, label }))}
            />
          }
        />

        {telaLarga ? (
          <div className="min-w-0">
            <DataTable
              aria-label="Contratos"
              colunas={colunas}
              idLinha={(l) => l.contrato.id}
              estado={estado}
              onTentarNovamente={recarregar}
              densidade={densidade}
              selecionados={selecionados}
              onSelecaoChange={setSelecionados}
              rotuloSelecao={(l) => `Selecionar ${l.contrato.numero}`}
              acoesEmLote={acoesEmLote}
              onPaginaChange={(p) => url.definir({ pagina: String(p) })}
              vazio={vazio}
            />
          </div>
        ) : (
          // Abaixo de 768 px: cartões (a tabela rola na horizontal e perde o contexto).
          <div>
            <EstadoRecurso
              estado={estado}
              carregando={
                <div className="flex flex-col gap-3">
                  {[0, 1, 2].map((i) => (
                    <ContractCardSkeleton key={i} />
                  ))}
                </div>
              }
              estaVazio={(d) => d.itens.length === 0}
              vazio={<EmptyState tamanho="compacto" titulo={vazio.titulo} acao={vazio.acao} />}
              erro={{ titulo: "Não foi possível carregar a lista" }}
              onTentarNovamente={recarregar}
            >
              {(d) => (
                <div className="flex animate-fade-in flex-col gap-4">
                  <ul aria-label="Contratos em cartões" className="flex flex-col gap-3">
                    {d.itens.map((l) => (
                      <li key={l.contrato.id}>
                        <ContractCard
                          numero={l.contrato.numero}
                          tipo={l.contrato.tipo}
                          imovel={l.imovel ?? semImovel}
                          partes={l.contrato.partes}
                          valor={l.contrato.valor}
                          inicio={l.contrato.inicio}
                          fim={l.contrato.fim}
                          statusExibicao={l.statusExibicao}
                          proximoVencimento={l.proximoVencimento}
                          acao={
                            <Button asChild variant="secondary" className="max-md:h-11">
                              <Link
                                href={`/contratos/${l.contrato.id}`}
                                aria-label={`Abrir contrato ${l.contrato.numero}`}
                              >
                                Abrir contrato
                              </Link>
                            </Button>
                          }
                        />
                      </li>
                    ))}
                  </ul>
                  <Pagination
                    page={d.pagina}
                    pageCount={d.totalPaginas}
                    pageSize={d.porPagina}
                    total={d.total}
                    onPageChange={(p) => url.definir({ pagina: String(p) })}
                    className="justify-center [&_ul]:flex-wrap [&_ul]:justify-center"
                  />
                </div>
              )}
            </EstadoRecurso>
          </div>
        )}
      </div>
    </>
  );
}
