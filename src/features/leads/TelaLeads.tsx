"use client";
/**
 * Leads (RF-30…32, RF-35, RF-36, RF-38, RF-39, RF-70; RF-06 filtros na URL; RF-08 corretor abre em "Meus leads";
 * RF-29 `?imovel=`). Quadro e lista mostram NEGOCIAÇÕES (lead × imóvel). Contêiner: liga o KanbanBoard/DataTable
 * ao fakeApi e à URL. Regras de etapa vêm do domínio.
 */
import { Columns3, List, UserCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { negar, recortePadrao, type Etapa } from "@/domain";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type DataTableColuna } from "@/components/patterns/DataTable";
import { ErrorState } from "@/components/patterns/ErrorState";
import { FilterBar, type FiltroAtivo } from "@/components/patterns/FilterBar";
import { KanbanBoard, type MoverNegociacaoEvento } from "@/components/patterns/KanbanBoard";
import { rotuloNegociacao, type NegociacaoCard } from "@/components/patterns/LeadCard";
import { ETAPA_UI, ORIGEM_ROTULO } from "@/components/patterns/rotulos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { LeadForm } from "@/components/patterns/LeadForm";
import { ORIGENS, type NovoLead, type Origem } from "@/domain";
import { formatMoeda, formatRelativo } from "@/lib/format";
import { usePreferencia } from "@/lib/preferencias";
import type { Pagina } from "@/lib/paginacao";
import { mapear, type Recurso } from "@/lib/recurso";
import { fakeApi, type NegociacaoComDerivados } from "@/mocks/services/fakeApi";
import { AcaoLink } from "@/features/shell/AcaoLink";
import { useEscrita } from "@/features/dados/escrita";
import { useConsulta } from "@/features/dados/useConsulta";
import { useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { useMoverNegociacao } from "./useMoverLead";

/** Negociação pronta para o card (o lead sempre existe numa Base válida). */
type ItemNegociacao = NegociacaoComDerivados & NegociacaoCard;

const POR_PAGINA_LISTA = 20;
const PERIODOS = { "7d": 7, "30d": 30, "90d": 90 } as const;
type Periodo = keyof typeof PERIODOS;
const ROTULO_PERIODO: Record<Periodo, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
};
const TODOS = "todos";

const ehPeriodo = (v: string | undefined): v is Periodo => v !== undefined && v in PERIODOS;
const ehOrigem = (v: string | undefined): v is Origem => ORIGENS.includes(v as Origem);

export function TelaLeads() {
  const router = useRouter();
  const pathname = usePathname();
  const url = useParametrosUrl();
  const { busca: params, definir } = url;

  // Com o detalhe aberto em drawer a URL é /leads/<id> (sem filtros) e o quadro continua montado atrás:
  // congela os filtros da última URL de /leads para o quadro não mudar sozinho.
  const qsAtual = params.toString();
  const ativa = pathname === "/leads";
  const [qsCongelado, setQsCongelado] = useState(qsAtual);
  if (ativa && qsCongelado !== qsAtual) setQsCongelado(qsAtual);
  const lido = useMemo(() => new URLSearchParams(ativa ? qsAtual : qsCongelado), [ativa, qsAtual, qsCongelado]);
  const valor = (chave: string) => lido.get(chave) ?? undefined;

  const { estado: perfilEstado, recarregar: recarregarPerfil } = useConsulta(
    useCallback(() => fakeApi.getPerfil(), []),
  );
  const { estado: corretoresEstado, recarregar: recarregarCorretores } = useConsulta(
    useCallback(() => fakeApi.listCorretores(), []),
  );
  const perfil = "dados" in perfilEstado ? perfilEstado.dados : undefined;
  const corretores = useMemo(
    () => ("dados" in corretoresEstado ? (corretoresEstado.dados ?? []) : []),
    [corretoresEstado],
  );

  // RF-08: sem escolha explícita, o corretor vê só os dele; "todos" desliga o recorte.
  const padraoResponsavel = perfil ? recortePadrao(perfil) : undefined;
  const bruto = valor("responsavel");
  const responsavelId = bruto === TODOS ? undefined : (bruto ?? padraoResponsavel);
  const perfilPronto = perfilEstado.fase === "success" || perfilEstado.fase === "partial";
  const origem = valor("origem");
  const periodo = valor("periodo");
  const imovelId = valor("imovel");
  const busca = valor("busca") ?? "";

  const [prefVisao, setPrefVisao] = usePreferencia<"kanban" | "lista">("leads.visualizacao", "kanban");
  const visao: "kanban" | "lista" = valor("view") ? (valor("view") === "lista" ? "lista" : "kanban") : prefVisao;
  const pagina = Math.max(1, Number(valor("pagina")) || 1);

  const { estado: imovelEstado } = useConsulta(
    useCallback(
      () => (imovelId ? fakeApi.getImovel(imovelId).then((r) => r.imovel.codigo) : Promise.resolve(null)),
      [imovelId],
    ),
  );

  const carregar = useCallback(async () => {
    const negociacoes = await fakeApi.listNegociacoes({
      busca: busca || undefined,
      responsavelId,
      origens: ehOrigem(origem) ? [origem] : undefined,
      imovelId,
      ultimosDias: ehPeriodo(periodo) ? PERIODOS[periodo] : undefined,
    });
    return { leads: negociacoes.filter((n): n is ItemNegociacao => n.lead !== null) };
  }, [busca, responsavelId, origem, periodo, imovelId]);
  const { estado: quadro, recarregar } = useConsulta(carregar);
  const leadsEstado = useMemo(() => mapear(quadro, (q) => q.leads), [quadro]);

  const { mover, dialogos } = useMoverNegociacao();
  const negociacaoPorId = useCallback(
    (id: string) => ("dados" in quadro ? quadro.dados?.leads.find((l) => l.id === id) : undefined),
    [quadro],
  );

  const responsaveis = useMemo(() => Object.fromEntries(corretores.map((c) => [c.id, c.nome])), [corretores]);
  // Destinos e permissões chegam prontos do domínio em cada negociação (fakeApi.listNegociacoes).
  const destinosDe = (n: NegociacaoCard) => negociacaoPorId(n.id)?.destinos ?? [];
  /** O domínio já decidiu cada coluna (a própria = reordenar); sem a negociação, nega. */
  const podeSoltar = (id: string, para: Etapa) =>
    negociacaoPorId(id)?.permissoesDeSoltar[para] ?? negar("Negociação não encontrada.");
  function aoMover({ negociacaoId, para, ordem }: MoverNegociacaoEvento) {
    const n = negociacaoPorId(negociacaoId);
    if (!n) return;
    const exigeMotivo = n.destinos.some((d) => d.etapa === para && d.exigeMotivo);
    mover({ id: n.id, etapa: n.etapa, rotulo: rotuloNegociacao(n) }, para, ordem, exigeMotivo);
  }
  const abrir = (id: string) => router.push(`/leads/${id}`);

  // --- Filtros (RF-36) ---
  const meusLeads = perfil !== undefined && responsavelId === perfil.id;
  const alternarMeus = () => definir({ responsavel: meusLeads ? (padraoResponsavel ? TODOS : undefined) : perfil?.id });
  const ativos: FiltroAtivo[] = [];
  if (responsavelId && !meusLeads)
    ativos.push({
      id: "responsavel",
      rotulo: `Responsável: ${responsaveis[responsavelId] ?? "—"}`,
      onRemover: () => definir({ responsavel: TODOS }),
    });
  if (ehOrigem(origem))
    ativos.push({
      id: "origem",
      rotulo: `Origem: ${ORIGEM_ROTULO[origem]}`,
      onRemover: () => definir({ origem: undefined }),
    });
  if (ehPeriodo(periodo))
    ativos.push({ id: "periodo", rotulo: ROTULO_PERIODO[periodo], onRemover: () => definir({ periodo: undefined }) });
  if (imovelId)
    ativos.push({
      id: "imovel",
      rotulo: `Imóvel: ${"dados" in imovelEstado && imovelEstado.dados ? imovelEstado.dados : "selecionado"}`,
      onRemover: () => definir({ imovel: undefined }),
    });
  const total = "dados" in quadro ? quadro.dados?.leads.length : undefined;

  // --- Criação rápida (RF-35) ---
  const novoAberto = valor("novo") === "1";
  const { estado: envio, executar, limpar } = useEscrita();
  // Opções do imóvel (opcional) da 1ª negociação: só carrega com o diálogo aberto.
  const { estado: imoveisNovo } = useConsulta(
    useCallback(async () => {
      if (!novoAberto) return [];
      const { itens } = await fakeApi.listImoveis({}, { pagina: 1, porPagina: 500 });
      return itens.map((i) => ({ value: i.id, label: `${i.codigo} · ${i.titulo}` }));
    }, [novoAberto]),
  );
  const opcoesImovel = "dados" in imoveisNovo ? imoveisNovo.dados : undefined;
  async function criar(dados: NovoLead) {
    const r = await executar(() => fakeApi.createLead(dados), { sucesso: "Lead criado", silenciarErro: true });
    if (r.fase === "ok") definir({ novo: undefined });
  }

  // --- Lista (RF-38) ---
  const listaEstado = useMemo<Recurso<Pagina<ItemNegociacao>>>(
    () =>
      mapear(leadsEstado, (ls) => {
        const totalPaginas = Math.max(1, Math.ceil(ls.length / POR_PAGINA_LISTA));
        const p = Math.min(pagina, totalPaginas);
        return {
          itens: ls.slice((p - 1) * POR_PAGINA_LISTA, p * POR_PAGINA_LISTA),
          total: ls.length,
          pagina: p,
          porPagina: POR_PAGINA_LISTA,
          totalPaginas,
        };
      }),
    [leadsEstado, pagina],
  );
  const colunas: DataTableColuna<ItemNegociacao>[] = [
    {
      id: "nome",
      cabecalho: "Lead",
      fixa: "inicio",
      celula: (l) => (
        <Button asChild variant="link" className="max-w-56 justify-start text-left break-words whitespace-normal">
          <Link href={`/leads/${l.lead.id}`}>{l.lead.nome}</Link>
        </Button>
      ),
    },
    {
      id: "imovel",
      cabecalho: "Imóvel",
      celula: (l) =>
        l.imovel ? (
          <span className="num text-caption">{l.imovel.codigo}</span>
        ) : (
          <span className="text-text-muted">Sem imóvel</span>
        ),
    },
    {
      id: "etapa",
      cabecalho: "Etapa",
      celula: (l) => <Badge tone={ETAPA_UI[l.etapa].tom}>{ETAPA_UI[l.etapa].rotulo}</Badge>,
    },
    {
      id: "valor",
      cabecalho: "Valor",
      alinhamento: "direita",
      celula: (l) => <span className="num whitespace-nowrap">{l.valor === null ? "—" : formatMoeda(l.valor)}</span>,
    },
    { id: "origem", cabecalho: "Origem", celula: (l) => ORIGEM_ROTULO[l.lead.origem] },
    { id: "responsavel", cabecalho: "Responsável", celula: (l) => responsaveis[l.responsavelId] ?? "Sem responsável" },
    { id: "atualizado", cabecalho: "Atualizado", celula: (l) => formatRelativo(l.atualizadoEm) },
  ];

  const hrefNovo = (() => {
    const p = new URLSearchParams(qsAtual);
    p.set("novo", "1");
    return `/leads?${p.toString()}`;
  })();

  const falhaBase = [perfilEstado, corretoresEstado].find((e) => e.fase === "error" && e.dados === undefined);
  if (falhaBase) {
    return (
      <>
        <PageHeader titulo="Leads" />
        <ErrorState
          titulo="Não foi possível carregar os leads"
          onTentarNovamente={() => {
            recarregarPerfil();
            recarregarCorretores();
            recarregar();
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Comercial · funil"
        titulo="Leads"
        acaoPrimaria={
          <AcaoLink href={hrefNovo} icone={UserPlus}>
            Novo lead
          </AcaoLink>
        }
      />
      <div className="flex min-w-0 flex-col gap-4">
        <FilterBar
          busca={busca}
          onBuscaChange={(b) => definir({ busca: b })}
          rotuloBusca="Buscar lead por nome"
          placeholderBusca="Buscar por nome"
          ativos={ativos}
          onLimparTudo={() =>
            definir({ responsavel: TODOS, origem: undefined, periodo: undefined, imovel: undefined, busca: undefined })
          }
          total={total}
          estado={quadro.fase === "loading" && total === undefined ? "carregando" : "pronto"}
          rotuloItem={["negociação", "negociações"]}
          filtros={
            <>
              <Field label="Responsável" requirement="optional">
                <Select
                  value={responsavelId ?? TODOS}
                  onValueChange={(v) => definir({ responsavel: v })}
                  options={[
                    { value: TODOS, label: "Todos" },
                    ...corretores.map((c) => ({ value: c.id, label: c.nome })),
                  ]}
                />
              </Field>
              <Field label="Origem" requirement="optional">
                <Select
                  value={ehOrigem(origem) ? origem : TODOS}
                  onValueChange={(v) => definir({ origem: v === TODOS ? undefined : v })}
                  options={[
                    { value: TODOS, label: "Todas" },
                    ...ORIGENS.map((o) => ({ value: o, label: ORIGEM_ROTULO[o] })),
                  ]}
                />
              </Field>
              <Field label="Período de criação" requirement="optional">
                <Select
                  value={ehPeriodo(periodo) ? periodo : TODOS}
                  onValueChange={(v) => definir({ periodo: v === TODOS ? undefined : v })}
                  options={[
                    { value: TODOS, label: "Qualquer período" },
                    ...(Object.keys(PERIODOS) as Periodo[]).map((p) => ({ value: p, label: ROTULO_PERIODO[p] })),
                  ]}
                />
              </Field>
            </>
          }
          ordenacao={
            <Button
              variant={meusLeads ? "primary" : "secondary"}
              leadingIcon={UserCheck}
              aria-pressed={meusLeads}
              disabled={!perfilPronto}
              onClick={alternarMeus}
            >
              Meus leads
            </Button>
          }
          visualizacao={
            <SegmentedControl
              aria-label="Visualização"
              value={visao}
              onValueChange={(v) => {
                setPrefVisao(v);
                definir({ view: v === "lista" ? "lista" : undefined });
              }}
              options={[
                { value: "kanban", label: "Quadro", icon: Columns3 },
                { value: "lista", label: "Lista", icon: List },
              ]}
            />
          }
        />

        {visao === "kanban" ? (
          <KanbanBoard
            estado={leadsEstado}
            responsaveis={responsaveis}
            destinosDe={destinosDe}
            podeSoltar={podeSoltar}
            onMover={aoMover}
            onAbrir={abrir}
            onTentarNovamente={recarregar}
          />
        ) : (
          <DataTable
            aria-label="Lista de negociações"
            colunas={colunas}
            idLinha={(l) => l.id}
            estado={listaEstado}
            onTentarNovamente={recarregar}
            onPaginaChange={(p) => definir({ pagina: String(p) })}
            vazio={{ titulo: "Nenhuma negociação encontrada" }}
          />
        )}
      </div>

      <Dialog
        open={novoAberto}
        onOpenChange={(a) => {
          if (!a) {
            limpar();
            definir({ novo: undefined });
          }
        }}
      >
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Novo lead</DialogTitle>
            <DialogDescription className="sr-only">Novo lead</DialogDescription>
          </DialogHeader>
          <LeadForm
            valoresIniciais={perfil ? ({ nome: "", contato: {}, responsavelId: perfil.id } as NovoLead) : undefined}
            key={perfil?.id ?? "sem-perfil"}
            corretores={corretores}
            imoveis={opcoesImovel}
            onSalvar={(d) => void criar(d)}
            envio={
              envio.fase === "enviando"
                ? { fase: "salvando" }
                : envio.fase === "erro"
                  ? { fase: "erro", mensagem: envio.mensagem }
                  : { fase: "idle" }
            }
            onCancelar={() => definir({ novo: undefined })}
          />
        </DialogContent>
      </Dialog>
      {dialogos}
    </>
  );
}
