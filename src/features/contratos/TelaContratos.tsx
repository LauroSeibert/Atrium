"use client";
/**
 * Contratos — lista (RF-40, RF-41, RF-47, RF-49; RF-06 estado na URL), no padrão de listagem densa do
 * DESIGN.md: cabeçalho compacto, abas de status com as contagens, barra de filtros numa linha e tabela
 * com no máximo 2 linhas por célula. Status de exibição e próximo vencimento vêm derivados do domínio.
 */
import { Download } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContractCard, ContractCardSkeleton } from "@/components/patterns/ContractCard";
import { AbasDeStatus } from "@/components/patterns/AbasDeStatus";
import { BarraDeLote, type DataTableAcaoEmLote, type DataTableColuna } from "@/components/patterns/DataTable";
import { FilterBar, type FiltroAtivo } from "@/components/patterns/FilterBar";
import { IntervaloDeDatas } from "@/components/patterns/IntervaloDeDatas";
import { ListaResponsiva } from "@/components/patterns/ListaResponsiva";
import { STATUS_CONTRATO_UI, TIPO_CONTRATO_ROTULO } from "@/components/patterns/rotulos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/Toast";
import { PERMITIDO, type StatusExibicaoContrato, type TipoContrato } from "@/domain";
import { DEBOUNCE_BUSCA_MS, useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { useConsulta } from "@/features/dados/useConsulta";
import { cn } from "@/lib/cn";
import { baixarCsv } from "@/lib/csv";
import { formatData, formatMoeda } from "@/lib/format";
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

/** Partes em duas linhas: a primeira; depois "+ segunda" ou "+N" quando há mais de duas. */
function partesEmDuasLinhas(l: LinhaContrato): [string, string] {
  const [primeira, segunda, ...resto] = l.contrato.partes;
  if (!primeira) return ["—", ""];
  if (!segunda) return [primeira.nome, ""];
  return [primeira.nome, resto.length > 0 ? `+${resto.length + 1}` : `+ ${segunda.nome}`];
}

/** Abas de status = indicadores; "Em dia" é o status `ativo` (inadimplente tem aba própria). */
type IdAba = "todos" | StatusExibicaoContrato;
const ABAS: readonly { id: IdAba; rotulo: string; risco?: boolean }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "ativo", rotulo: "Em dia" },
  { id: "rascunho", rotulo: "Rascunhos" },
  { id: "inadimplente", rotulo: "Inadimplentes", risco: true },
  { id: "encerrado", rotulo: "Encerrados" },
  { id: "cancelado", rotulo: "Cancelados" },
];

/** Uma célula de no máximo 2 linhas, sem quebra: o texto inteiro fica no `title`. */
function Celula({
  l1,
  l2,
  direita = false,
  tom,
}: {
  l1: ReactNode;
  l2?: ReactNode;
  direita?: boolean;
  tom?: "danger";
}) {
  const titulo = [l1, l2].filter((t) => typeof t === "string" && t).join(" · ") || undefined;
  return (
    <div className={cn("flex min-w-0 flex-col", direita && "items-end text-right")} title={titulo}>
      <span className={cn("max-w-full truncate text-sm", tom === "danger" ? "text-danger" : "text-text")}>{l1}</span>
      {l2 ? (
        <span
          className={cn("mt-0.5 max-w-full truncate text-xs", tom === "danger" ? "text-danger" : "text-text-muted")}
        >
          {l2}
        </span>
      ) : null}
    </div>
  );
}

const semImovel = { titulo: "Imóvel removido", codigo: "—" };

export function TelaContratos() {
  const url = useParametrosUrl();
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
  const { estado: resumo } = useConsulta(carregarResumo);
  const contagens = "dados" in resumo && resumo.dados ? resumo.dados : undefined;
  const abas = ABAS.map((a) => ({
    ...a,
    contagem: contagens
      ? a.id === "todos"
        ? Object.values(contagens).reduce((s, n) => s + n, 0)
        : (contagens[a.id] ?? 0)
      : undefined,
  }));
  const abaAtiva: IdAba | null =
    status.length === 0
      ? "todos"
      : status.length === 1 && ABAS.some((a) => a.id === status[0])
        ? (status[0] as IdAba)
        : null;

  const total = "dados" in estado && estado.dados ? estado.dados.total : undefined;

  // Status mora nas abas. Chips só para o que fica escondido no Popover, com o mínimo de texto:
  // "Venda", "Vencimento 01/12/26 → 15/12/26".
  const ativos: FiltroAtivo[] = [
    ...(abaAtiva ? [] : status).map((s) => ({
      id: `status-${s}`,
      rotulo: STATUS_CONTRATO_UI[s].rotulo,
      onRemover: () => url.definir({ status: status.filter((x) => x !== s) }),
    })),
    ...(tipo
      ? [{ id: "tipo", rotulo: TIPO_CONTRATO_ROTULO[tipo], onRemover: () => url.definir({ tipo: undefined }) }]
      : []),
    ...(de || ate
      ? [
          {
            id: "vencimento",
            rotulo:
              de && ate
                ? `Vencimento ${formatData(de, "tabela")} → ${formatData(ate, "tabela")}`
                : de
                  ? `Vencimento desde ${formatData(de, "tabela")}`
                  : `Vencimento até ${formatData(ate!, "tabela")}`,
            onRemover: () => url.definir({ de: undefined, ate: undefined }),
          },
        ]
      : []),
  ];
  const limparFiltros = () =>
    url.definir({ tipo: undefined, status: undefined, de: undefined, ate: undefined, busca: undefined });
  const temFiltro = ativos.length > 0 || busca !== "" || tipo !== undefined || status.length > 0;

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
      cabecalho: "Contrato",
      className: "w-1/6",
      celula: (l) => (
        <div className="flex min-w-0 flex-col">
          <Link
            href={`/contratos/${l.contrato.id}`}
            className="w-fit max-w-full truncate rounded-sm num text-sm font-medium text-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {l.contrato.numero}
          </Link>
          <span className="mt-0.5 truncate num text-xs text-text-muted">
            {TIPO_CONTRATO_ROTULO[l.contrato.tipo]} · <span className="sr-only">vigência de </span>
            {formatData(l.contrato.inicio, "tabela")} <span aria-hidden="true">→</span>
            <span className="sr-only">a</span> {formatData(l.contrato.fim, "tabela")}
          </span>
        </div>
      ),
    },
    {
      id: "imovel",
      cabecalho: "Imóvel",
      className: "w-2/7 max-w-0",
      celula: (l) => (
        <Celula
          l1={(l.imovel ?? semImovel).titulo}
          l2={<span className="num">{(l.imovel ?? semImovel).codigo}</span>}
        />
      ),
    },
    {
      id: "partes",
      cabecalho: "Partes",
      className: "w-1/5 max-w-0",
      celula: (l) => {
        const [p1, p2] = partesEmDuasLinhas(l);
        return <Celula l1={p1} l2={p2} />;
      },
    },
    {
      id: "valor",
      cabecalho: "Valor",
      alinhamento: "direita",
      celula: (l) => <span className="num whitespace-nowrap">{formatMoeda(l.contrato.valor)}</span>,
    },
    {
      id: "proximoVencimento",
      cabecalho: "Próximo vencimento",
      alinhamento: "direita",
      celula: (l) =>
        l.proximoVencimento ? (
          <Celula
            direita
            tom={l.statusExibicao === "inadimplente" ? "danger" : undefined}
            l1={<span className="num">{formatData(l.proximoVencimento.vencimento, "tabela")}</span>}
            l2={<span className="num">{formatMoeda(l.proximoVencimento.valor)}</span>}
          />
        ) : (
          <span className="text-text-muted">—</span>
        ),
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
  ];

  const vazio = {
    titulo: temFiltro ? "Nenhum contrato com esses filtros" : "Nenhum contrato ainda",
    acao: temFiltro ? (
      <Button variant="secondary" onClick={limparFiltros}>
        Limpar filtros
      </Button>
    ) : undefined,
  };

  // Popover: cada grupo com um rótulo curto e os controles na mesma linha (o "Fechar" alinha com o
  // primeiro rótulo). Sem repetir o nome do filtro nas opções.
  const filtrosPopover = (
    <>
      <div role="group" aria-labelledby="filtro-tipo" className="flex flex-col gap-2">
        <p id="filtro-tipo" className="text-sm font-medium text-text">
          Tipo
        </p>
        <SegmentedControl
          aria-label="Tipo"
          className="w-full"
          value={tipo ?? "todos"}
          onValueChange={(v) => url.definir({ tipo: v === "todos" ? undefined : v })}
          options={[
            { value: "todos", label: "Todos" },
            ...TIPOS.map((t) => ({ value: t, label: TIPO_CONTRATO_ROTULO[t] })),
          ]}
        />
      </div>
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
        densidade="lista"
        eyebrow="Operação · carteira"
        titulo="Contratos"
        acoes={
          <Button variant="secondary" leadingIcon={Download} onClick={exportarVisiveis} disabled={!total}>
            Exportar CSV
          </Button>
        }
      />
      <div className="flex min-w-0 flex-col">
        <AbasDeStatus
          aria-label="Status do contrato"
          abas={abas}
          ativa={abaAtiva}
          onChange={(id) => url.definir({ status: id === "todos" ? undefined : [id] })}
          className="mt-3"
        />
        <div className="py-4">
          {telaLarga && selecionados.length > 0 ? (
            <BarraDeLote
              variante="tinta"
              quantidade={selecionados.length}
              acoes={acoesEmLote}
              selecionados={selecionados}
              onLimpar={() => setSelecionados([])}
            />
          ) : (
            <FilterBar
              busca={busca}
              onBuscaChange={(b) => url.definir({ busca: b })}
              debounceMs={DEBOUNCE_BUSCA_MS}
              buscaCompacta
              rotuloBusca="Buscar contratos"
              placeholderBusca="Número, parte ou código do imóvel"
              filtros={filtrosPopover}
              ativos={ativos}
              onLimparTudo={ativos.length > 0 ? limparFiltros : undefined}
              ordenacao={
                <Select
                  aria-label="Ordenar por"
                  value={ordem}
                  onValueChange={(v) => url.definir({ ordem: v === "recentes" ? undefined : v })}
                  options={Object.entries(ORDENS).map(([value, label]) => ({ value, label }))}
                />
              }
            />
          )}
        </div>

        <ListaResponsiva
          rotulo="Contratos"
          telaLarga={telaLarga}
          densidade="lista"
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
            rotuloContagem: ["contrato", "contratos"],
            barraDeLote: "externa",
            larguraMinima: "min-w-240",
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
