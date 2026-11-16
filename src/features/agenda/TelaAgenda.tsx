"use client";
/**
 * Agenda (RF-73; RF-06 filtros na URL; RF-08 corretor abre em "Meus"): visitas e vencimentos por dia.
 * As ações da visita vêm de `transicoes` (domínio); a tela só mapeia destino → texto do menu e do toast.
 * Vencimentos levam ao contrato.
 */
import { UserCheck } from "lucide-react";
import { useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AgendaPeriodo, type AcaoItemAgenda, type ItemAgendaPeriodo } from "@/components/patterns/AgendaPeriodo";
import { STATUS_PARCELA_UI, STATUS_VISITA_UI } from "@/components/patterns/rotulos";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { recorteResponsavel, type StatusVisita, type TipoItemAgenda } from "@/domain";
import { useAcaoEmLinha } from "@/features/dados/useAcaoEmLinha";
import { useConsulta } from "@/features/dados/useConsulta";
import { useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { formatMoeda } from "@/lib/format";
import { mapear } from "@/lib/recurso";
import { fakeApi } from "@/mocks/services/fakeApi";

const PERIODOS = {
  hoje: { dias: 1, rotulo: "Hoje" },
  "7": { dias: 7, rotulo: "7 dias" },
  "30": { dias: 30, rotulo: "30 dias" },
};
type Periodo = keyof typeof PERIODOS;
const ePeriodo = (v: string | undefined): v is Periodo => v !== undefined && v in PERIODOS;

const TIPOS = { todos: "Todos", visita: "Visitas", vencimento: "Vencimentos" } as const;
type TipoFiltro = keyof typeof TIPOS;
const eTipo = (v: string | undefined): v is TipoFiltro => v !== undefined && v in TIPOS;

const ACAO_VISITA: Record<StatusVisita, { menu: string; toast: string }> = {
  agendada: { menu: "Voltar para agendada", toast: "Visita agendada" },
  realizada: { menu: "Marcar como realizada", toast: "Visita marcada como realizada" },
  cancelada: { menu: "Cancelar visita", toast: "Visita cancelada" },
  naoCompareceu: { menu: "Não compareceu", toast: "Visita marcada como não compareceu" },
};

export function TelaAgenda() {
  const url = useParametrosUrl();
  const periodoBruto = url.ler("periodo");
  const periodo: Periodo = ePeriodo(periodoBruto) ? periodoBruto : "7";
  const tipoBruto = url.ler("tipo");
  const tipo: TipoFiltro = eTipo(tipoBruto) ? tipoBruto : "todos";
  const escopoBruto = url.ler("escopo");
  const escopo = escopoBruto === "meus" || escopoBruto === "todos" ? escopoBruto : undefined;

  const carregar = useCallback(async () => {
    const perfil = await fakeApi.getPerfil();
    const responsavelId = recorteResponsavel(perfil, escopo);
    const meus = responsavelId !== undefined;
    const tipos: TipoItemAgenda[] = tipo === "todos" ? ["visita", "vencimento"] : [tipo];
    const agenda = await fakeApi.getAgenda({
      tipos,
      dias: PERIODOS[periodo].dias,
      responsavelId,
    });
    return { meus, agenda };
  }, [escopo, tipo, periodo]);
  const { estado, recarregar } = useConsulta(carregar);

  const { executar } = useAcaoEmLinha();
  const marcar = useCallback(
    (visitaId: string, para: StatusVisita) =>
      executar(visitaId, () => fakeApi.updateVisita(visitaId, para), { sucesso: ACAO_VISITA[para].toast }),
    [executar],
  );

  const itens = useMemo(() => {
    if (!("dados" in estado) || !estado.dados) return undefined;
    const { agenda } = estado.dados;
    const { nomes } = agenda;
    return agenda.dias.flatMap((d) =>
      d.itens.map((i): ItemAgendaPeriodo => {
        if (i.tipo === "visita") {
          const v = i.visita;
          const acoes: AcaoItemAgenda[] = i.transicoes.map(({ para }) => ({
            id: para,
            rotulo: ACAO_VISITA[para].menu,
            onAcionar: () => void marcar(v.id, para),
          }));
          return {
            id: v.id,
            tipo: "visita",
            quando: i.quando,
            titulo: nomes.imoveis[v.imovelId] ?? "Imóvel removido",
            detalhe: [nomes.leads[v.leadId], nomes.corretores[v.corretorId]].filter(Boolean).join(" · "),
            href: `/leads/${v.leadId}`,
            situacao: STATUS_VISITA_UI[v.status],
            acoes,
          };
        }
        return {
          id: `${i.contratoId}-${i.parcela.numero}`,
          tipo: "vencimento",
          quando: i.quando,
          titulo: `Parcela ${i.parcela.numero} · contrato ${i.numeroContrato}`,
          detalhe: formatMoeda(i.parcela.valor),
          href: `/contratos/${i.contratoId}`,
          situacao: STATUS_PARCELA_UI[i.status],
        };
      }),
    );
  }, [estado, marcar]);

  const meus = "dados" in estado && estado.dados ? estado.dados.meus : false;
  const agora = "dados" in estado && estado.dados ? new Date(estado.dados.agenda.agora) : undefined;
  const estadoLista = useMemo(() => mapear(estado, () => itens ?? []), [estado, itens]);

  return (
    <>
      <PageHeader titulo="Agenda" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            aria-label="Tipo de compromisso"
            value={tipo}
            onValueChange={(v) => url.definir({ tipo: v === "todos" ? undefined : v })}
            options={(Object.keys(TIPOS) as TipoFiltro[]).map((t) => ({ value: t, label: TIPOS[t] }))}
          />
          <SegmentedControl
            aria-label="Período"
            value={periodo}
            onValueChange={(v) => url.definir({ periodo: v === "7" ? undefined : v })}
            options={(Object.keys(PERIODOS) as Periodo[]).map((p) => ({ value: p, label: PERIODOS[p].rotulo }))}
          />
          <Button
            variant={meus ? "primary" : "secondary"}
            size="touch"
            leadingIcon={UserCheck}
            aria-pressed={meus}
            disabled={!("dados" in estado && estado.dados)}
            onClick={() => url.definir({ escopo: meus ? "todos" : "meus" })}
          >
            Meus
          </Button>
        </div>
        <section aria-labelledby="agenda-compromissos" className="max-w-3xl">
          <h2 id="agenda-compromissos" className="sr-only">
            Compromissos do período
          </h2>
          <AgendaPeriodo
            estado={estadoLista}
            agora={agora}
            tituloVazio={`Nenhum compromisso ${periodo === "hoje" ? "hoje" : "no período"}`}
            onTentarNovamente={recarregar}
          />
        </section>
      </div>
    </>
  );
}
