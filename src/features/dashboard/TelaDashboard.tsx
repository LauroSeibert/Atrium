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
import { SectionCard } from "@/components/patterns/SectionCard";
import { StatCard, StatGroup } from "@/components/patterns/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { rotaDaEntidade } from "@/components/layout/navegacao";
import { Select } from "@/components/ui/Select";
import { PERIODOS, type Compromisso, type Periodo } from "@/domain";
import { formatMoeda } from "@/lib/format";
import { dadosDe, mapear } from "@/lib/recurso";
import { fakeApi } from "@/mocks/services/fakeApi";
import { useConsulta } from "../dados/useConsulta";
import { useParametrosUrl } from "../dados/useParametrosUrl";
import { AcaoLink } from "../shell/AcaoLink";
import { MetaRealizado } from "./MetaRealizado";

const PERIODO_PADRAO: Periodo = "mesAtual";

const PERIODO_UI: Record<Periodo, { rotulo: string; comparacao: string }> = {
  mesAtual: { rotulo: "Mês atual", comparacao: "vs. mês anterior" },
  mesAnterior: { rotulo: "Mês anterior", comparacao: "vs. mês retrasado" },
  ultimos3: { rotulo: "Últimos 3 meses", comparacao: "vs. 3 meses anteriores" },
  ultimos12: { rotulo: "Últimos 12 meses", comparacao: "vs. 12 meses anteriores" },
};
const OPCOES_PERIODO = PERIODOS.map((p) => ({ value: p, label: PERIODO_UI[p].rotulo }));

const FUSO = "America/Sao_Paulo";
const dataPorExtenso = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: FUSO,
});
const horaDe = new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: FUSO });
const mesPorExtenso = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: FUSO });

/** "Bom dia", "Boa tarde" ou "Boa noite" pela hora local de `agora`. */
function saudacaoDaHora(agora: Date): string {
  const h = Number(horaDe.format(agora));
  if (h >= 5 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
}

const ehPeriodo = (v: string | undefined): v is Periodo => PERIODOS.some((p) => p === v);

type Nomes = Awaited<ReturnType<typeof fakeApi.getDashboard>>["nomes"];

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

  const { estado: d, recarregar } = useConsulta(useCallback(() => fakeApi.getDashboard(periodo), [periodo]));

  const dados = dadosDe(d);
  const agora = useMemo(() => (dados ? new Date(dados.agora) : undefined), [dados]);
  const atividades = useMemo(() => mapear(d, (x) => x.atividades), [d]);
  const agenda = useMemo(() => mapear(d, (x) => x.compromissos.map((c) => itemDeAgenda(c, x.nomes))), [d]);
  const metas = useMemo(() => mapear(d, (x) => x.meta), [d]);
  const corretores = dados?.nomes.corretores;
  const { estado: perfil } = useConsulta(useCallback(() => fakeApi.getPerfil(), []));
  const primeiroNome = dadosDe(perfil)?.nome.trim().split(/\s+/)[0];
  const nomeDe = useCallback((id: string) => corretores?.[id] ?? "Corretor", [corretores]);

  return (
    <>
      <PageHeader
        eyebrow={
          agora ? `${dataPorExtenso.format(agora).replace(/^./, (c) => c.toLocaleUpperCase("pt-BR"))}` : "Visão geral"
        }
        titulo={agora ? `${saudacaoDaHora(agora)}${primeiroNome ? `, ${primeiroNome}` : ""}.` : "Dashboard"}
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
      <StatGroup aria-label="Indicadores" className="mb-10">
        <StatCard
          variante="celula"
          rotulo="Imóveis ativos"
          estado={mapear(d, (x) => x.kpis.imoveisAtivos)}
          comparacao={comparacao}
          onTentarNovamente={recarregar}
        />
        <StatCard
          variante="celula"
          rotulo="Leads novos"
          estado={mapear(d, (x) => x.kpis.leadsNovos)}
          comparacao={comparacao}
          onTentarNovamente={recarregar}
        />
        <StatCard
          variante="celula"
          rotulo="Visitas nos próximos 7 dias"
          estado={mapear(d, (x) => x.kpis.visitasProximas)}
          comparacao="vs. 7 dias anteriores"
          onTentarNovamente={recarregar}
        />
        <StatCard
          variante="celula"
          rotulo="Receita"
          formato="moeda"
          estado={mapear(d, (x) => x.kpis.receita)}
          comparacao={comparacao}
          onTentarNovamente={recarregar}
        />
      </StatGroup>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-12 xl:gap-8">
        <h2 className="sr-only">Receita, meta e funil</h2>
        <RevenueChartCard
          estado={mapear(d, (x) => x.receita12m)}
          onTentarNovamente={recarregar}
          className="md:col-span-2 xl:col-span-8"
        />
        <MetaRealizado
          estado={metas}
          nomeDe={nomeDe}
          mes={agora ? mesPorExtenso.format(agora) : undefined}
          onTentarNovamente={recarregar}
          className="md:col-span-2 xl:col-span-4"
        />
        <FunnelChartCard
          estado={mapear(d, (x) => x.funil)}
          onTentarNovamente={recarregar}
          className="md:col-span-2 xl:col-span-7"
        />
        <SectionCard
          titulo="Atividades recentes"
          variante="aberta"
          className="md:col-span-2 xl:col-span-5 xl:row-span-2"
        >
          <ActivityFeed
            estado={atividades}
            autores={(id) => corretores?.[id]}
            agora={agora}
            variante="feed"
            hrefDe={(a) => {
              const rota = rotaDaEntidade(a.alvo);
              return rota === "/" ? undefined : rota;
            }}
            onTentarNovamente={recarregar}
            aria-label="Atividades recentes"
          />
        </SectionCard>
        <SectionCard titulo="Próximos compromissos" variante="aberta" className="md:col-span-2 xl:col-span-7">
          <div className="rounded-lg border border-border bg-surface p-6">
            <AgendaList estado={agenda} agora={agora} onTentarNovamente={recarregar} />
          </div>
        </SectionCard>
      </div>
    </>
  );
}
