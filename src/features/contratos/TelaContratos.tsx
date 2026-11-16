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
import type { DataTableAcaoEmLote, DataTableColuna } from "@/components/patterns/DataTable";
import { FilterBar, type FiltroAtivo } from "@/components/patterns/FilterBar";
import { ListaResponsiva } from "@/components/patterns/ListaResponsiva";
import { STATUS_CONTRATO_UI, TIPO_CONTRATO_ROTULO } from "@/components/patterns/rotulos";
import { StatCard, StatGroup, type DadosStat } from "@/components/patterns/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { DateInput } from "@/components/ui/DateInput";
import { Select } from "@/components/ui/Select";
import type { TableDensity } from "@/components/ui/Table";
import { toast } from "@/components/ui/Toast";
import { PERMITIDO, type StatusExibicaoContrato, type TipoContrato } from "@/domain";
import { DEBOUNCE_BUSCA_MS, useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { mapear, type Recurso } from "@/lib/recurso";
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

/** Contagem por status de exibição (agregação de exibição; o status vem derivado do domínio). */
const kpi = (r: Recurso<Record<string, number>>, s: StatusExibicaoContrato, alerta = false): Recurso<DadosStat> =>
  mapear(r, (m) => ({ valor: m[s] ?? 0, tom: alerta && (m[s] ?? 0) > 0 ? "alerta" : "neutro" }));

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

  const carregarResumo = useCallback(async () => {
    const todos = await fakeApi.listContratos({}, { pagina: 1, porPagina: 100_000 }, "recentes");
    const m: Record<string, number> = {};
    for (const l of todos.itens) m[l.statusExibicao] = (m[l.statusExibicao] ?? 0) + 1;
    return m;
  }, []);
  const { estado: resumo, recarregar: recarregarResumo } = useConsulta(carregarResumo);

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
        toast({
          tone: "success",
          title: "CSV gerado",
          description:
            escolhidos.length === 1 ? "1 contrato selecionado." : `${escolhidos.length} contratos selecionados.`,
        });
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
      cabecalho: "Contrato e vigência",
      celula: (l) => (
        <div className="flex flex-col gap-0.5">
          <Link
            href={`/contratos/${l.contrato.id}`}
            className="num rounded-sm text-caption font-medium whitespace-nowrap text-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {l.contrato.numero}
          </Link>
          <span className="text-xs text-text-muted tabular-nums">
            {TIPO_CONTRATO_ROTULO[l.contrato.tipo]} ·{" "}
            <span className="whitespace-nowrap">
              <span className="sr-only">Vigência: </span>
              {formatData(l.contrato.inicio)} a {formatData(l.contrato.fim)}
            </span>
          </span>
        </div>
      ),
    },
    {
      id: "imovel",
      cabecalho: "Imóvel",
      className: "min-w-40 max-w-52",
      celula: (l) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="line-clamp-2 text-md">{(l.imovel ?? semImovel).titulo}</span>
          <span className="num text-xs text-text-muted">{(l.imovel ?? semImovel).codigo}</span>
        </div>
      ),
    },
    {
      id: "partes",
      cabecalho: "Cliente",
      className: "min-w-36 max-w-48",
      celula: (l) => <span className="break-words text-text-2">{resumoPartes(l)}</span>,
    },
    {
      id: "valor",
      cabecalho: "Valor",
      alinhamento: "direita",
      celula: (l) => <span className="num whitespace-nowrap">{formatMoeda(l.contrato.valor)}</span>,
    },
    {
      id: "status",
      cabecalho: "Status",
      alinhamento: "direita",
      celula: (l) => (
        <Badge tone={STATUS_CONTRATO_UI[l.statusExibicao].tom} dot>
          {STATUS_CONTRATO_UI[l.statusExibicao].rotulo}
        </Badge>
      ),
    },
    {
      id: "proximoVencimento",
      cabecalho: "Próximo vencimento",
      alinhamento: "direita",
      celula: (l) =>
        l.proximoVencimento ? (
          <span className="num flex flex-col items-end whitespace-nowrap">
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
        {(c) => <DateInput {...c} value={de ?? ""} onValueChange={(v) => url.definir({ de: v })} />}
      </Field>
      <Field label="Vencimento até">
        {(c) => <DateInput {...c} value={ate ?? ""} onValueChange={(v) => url.definir({ ate: v })} />}
      </Field>
    </>
  );

  return (
    <>
      <PageHeader
        eyebrow="Operação · carteira"
        titulo="Contratos"
        acoes={
          <Button variant="secondary" leadingIcon={Download} onClick={exportarVisiveis} disabled={!total}>
            Exportar CSV
          </Button>
        }
      />
      <div className="flex min-w-0 flex-col gap-6">
        <StatGroup aria-label="Indicadores de contratos" colunas={3}>
          <StatCard variante="celula" rotulo="Em dia" estado={kpi(resumo, "ativo")} onTentarNovamente={recarregarResumo} />
          <StatCard variante="celula" rotulo="Rascunhos" estado={kpi(resumo, "rascunho")} onTentarNovamente={recarregarResumo} />
          <StatCard variante="celula" rotulo="Inadimplentes" estado={kpi(resumo, "inadimplente", true)} onTentarNovamente={recarregarResumo} />
        </StatGroup>
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

        <ListaResponsiva
          rotulo="Contratos"
          telaLarga={telaLarga}
          densidade={densidade}
          colunas={colunas}
          idLinha={(l) => l.contrato.id}
          estado={estado}
          onTentarNovamente={recarregar}
          onPaginaChange={(p) => url.definir({ pagina: String(p) })}
          vazio={vazio}
          tabela={{
            selecionados,
            onSelecaoChange: setSelecionados,
            rotuloSelecao: (l) => `Selecionar ${l.contrato.numero}`,
            acoesEmLote,
          }}
          cartaoCarregando={<ContractCardSkeleton />}
          cartao={(l) => (
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
                <Button asChild variant="secondary" size="touch">
                  <Link href={`/contratos/${l.contrato.id}`} aria-label={`Abrir contrato ${l.contrato.numero}`}>
                    Abrir contrato
                  </Link>
                </Button>
              }
            />
          )}
        />
      </div>
    </>
  );
}
