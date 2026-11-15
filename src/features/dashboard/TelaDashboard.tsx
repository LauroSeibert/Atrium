"use client";
/**
 * Dashboard (rota `/`): RF-10 KPIs, RF-11 receita, RF-12 funil, RF-13 atividades, RF-14 compromissos,
 * RF-15 filtro de período na URL (`?periodo=`), RF-16 meta × realizado.
 */
import { Plus } from "lucide-react";
import { useCallback, useMemo } from "react";
import { AgendaList, type ItemAgenda } from "@/components/patterns/AgendaList";
import { ActivityFeed } from "@/components/patterns/ActivityFeed";
import { FunnelChartCard } from "@/components/patterns/FunnelChart";
import { RevenueChartCard } from "@/components/patterns/RevenueChart";
import { StatCard } from "@/components/patterns/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { rotaDaEntidade } from "@/components/layout/navegacao";
import { Select } from "@/components/ui/Select";
import { PERIODOS, type Compromisso, type Periodo } from "@/domain";
import { formatMoeda } from "@/lib/format";
import { fakeApi } from "@/mocks/services/fakeApi";
import { useConsulta } from "../dados/useConsulta";
import { useParametrosUrl } from "../dados/useParametrosUrl";
import { AcaoLink } from "../shell/AcaoLink";
import { CartaoSecao } from "./CartaoSecao";
import { MetaRealizado } from "./MetaRealizado";
import { combinar, mapear } from "./recursos";

const PERIODO_PADRAO: Periodo = "mesAtual";

const PERIODO_UI: Record<Periodo, { rotulo: string; comparacao: string }> = {
  mesAtual: { rotulo: "Mês atual", comparacao: "vs. mês anterior" },
  mesAnterior: { rotulo: "Mês anterior", comparacao: "vs. mês retrasado" },
  ultimos3: { rotulo: "Últimos 3 meses", comparacao: "vs. 3 meses anteriores" },
  ultimos12: { rotulo: "Últimos 12 meses", comparacao: "vs. 12 meses anteriores" },
};
const OPCOES_PERIODO = PERIODOS.map((p) => ({ value: p, label: PERIODO_UI[p].rotulo }));

const ehPeriodo = (v: string | undefined): v is Periodo => PERIODOS.some((p) => p === v);

/** Nomes para rotular o que o domínio devolve só com ids (autores, imóveis das visitas, leads). */
async function carregarNomes() {
  const [corretores, imoveis, leads] = await Promise.all([
    fakeApi.listCorretores(),
    fakeApi.listImoveis({}, { pagina: 1, porPagina: 100_000 }),
    fakeApi.listLeads(),
  ]);
  return {
    corretores: Object.fromEntries(corretores.map((c) => [c.id, c.nome])) as Record<string, string>,
    imoveis: Object.fromEntries(imoveis.itens.map((i) => [i.id, i.titulo])) as Record<string, string>,
    leads: Object.fromEntries(leads.map((l) => [l.id, l.nome])) as Record<string, string>,
  };
}
type Nomes = Awaited<ReturnType<typeof carregarNomes>>;

function itemDeAgenda(c: Compromisso, n: Nomes): ItemAgenda {
  if (c.tipo === "visita")
    return {
      id: c.visita.id,
      tipo: "visita",
      quando: c.quando,
      titulo: `Visita ao imóvel ${n.imoveis[c.visita.imovelId] ?? "removido"}`,
      detalhe: n.leads[c.visita.leadId],
      href: `/leads/${c.visita.leadId}`,
    };
  return {
    id: `${c.contratoId}-${c.parcela.numero}`,
    tipo: "vencimento",
    quando: c.quando,
    titulo: `Parcela ${c.parcela.numero} do contrato ${c.numero}`,
    detalhe: formatMoeda(c.parcela.valor),
    href: `/contratos/${c.contratoId}`,
  };
}

export function TelaDashboard() {
  const url = useParametrosUrl();
  const valor = url.ler("periodo");
  const periodo = ehPeriodo(valor) ? valor : PERIODO_PADRAO;
  const { comparacao } = PERIODO_UI[periodo];

  const dashboard = useConsulta(useCallback(() => fakeApi.getDashboard(periodo), [periodo]));
  const nomes = useConsulta(carregarNomes);
  const recarregar = useCallback(() => {
    dashboard.recarregar();
    nomes.recarregar();
  }, [dashboard, nomes]);

  const d = dashboard.estado;
  const atividades = useMemo(() => combinar(d, nomes.estado, (dash) => dash.atividades), [d, nomes.estado]);
  const agenda = useMemo(
    () => combinar(d, nomes.estado, (dash, n) => dash.compromissos.map((c) => itemDeAgenda(c, n))),
    [d, nomes.estado],
  );
  const nomeDe = useCallback(
    (id: string) => (nomes.estado.fase === "success" ? nomes.estado.dados.corretores[id] : undefined) ?? "Corretor",
    [nomes.estado],
  );
  const metas = useMemo(() => combinar(d, nomes.estado, (dash) => dash.meta), [d, nomes.estado]);

  return (
    <>
      <PageHeader
        titulo="Dashboard"
        acaoPrimaria={
          <AcaoLink href="/leads?novo=1" icone={Plus}>
            Novo lead
          </AcaoLink>
        }
        acoes={
          <div className="w-full md:w-52">
            <Select
              aria-label="Período"
              options={OPCOES_PERIODO}
              value={periodo}
              onValueChange={(v) => url.definir({ periodo: v === PERIODO_PADRAO ? undefined : v })}
            />
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12 xl:gap-6">
        <h2 className="sr-only">Indicadores</h2>
        <StatCard
          rotulo="Imóveis ativos"
          estado={mapear(d, (x) => x.kpis.imoveisAtivos)}
          comparacao={comparacao}
          onTentarNovamente={recarregar}
          className="xl:col-span-3"
        />
        <StatCard
          rotulo="Leads novos"
          estado={mapear(d, (x) => x.kpis.leadsNovos)}
          comparacao={comparacao}
          onTentarNovamente={recarregar}
          className="xl:col-span-3"
        />
        <StatCard
          rotulo="Visitas nos próximos 7 dias"
          estado={mapear(d, (x) => x.kpis.visitasProximas)}
          comparacao="vs. 7 dias anteriores"
          onTentarNovamente={recarregar}
          className="xl:col-span-3"
        />
        <StatCard
          rotulo="Receita"
          formato="moeda"
          estado={mapear(d, (x) => x.kpis.receita)}
          comparacao={comparacao}
          onTentarNovamente={recarregar}
          className="xl:col-span-3"
        />

        <h2 className="sr-only">Receita, meta e funil</h2>
        <RevenueChartCard
          estado={mapear(d, (x) => x.receita12m)}
          onTentarNovamente={recarregar}
          className="md:col-span-2 xl:col-span-8"
        />
        <MetaRealizado
          estado={metas}
          nomeDe={nomeDe}
          onTentarNovamente={recarregar}
          className="md:col-span-2 xl:col-span-4"
        />
        <FunnelChartCard
          estado={mapear(d, (x) => x.funil)}
          onTentarNovamente={recarregar}
          className="md:col-span-2 xl:col-span-7"
        />
        <CartaoSecao titulo="Atividades recentes" className="md:col-span-2 xl:col-span-5 xl:row-span-2">
          <ActivityFeed
            estado={atividades}
            autores={(id) => (nomes.estado.fase === "success" ? nomes.estado.dados.corretores[id] : undefined)}
            variante="feed"
            hrefDe={(a) => {
              const rota = rotaDaEntidade(a.alvo);
              return rota === "/" ? undefined : rota;
            }}
            onTentarNovamente={recarregar}
            aria-label="Atividades recentes"
          />
        </CartaoSecao>
        <CartaoSecao titulo="Próximos compromissos" className="md:col-span-2 xl:col-span-7">
          <AgendaList estado={agenda} onTentarNovamente={recarregar} />
        </CartaoSecao>
      </div>
    </>
  );
}
