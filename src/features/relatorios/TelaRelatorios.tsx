"use client";
/**
 * Relatórios (RF-82): cinco relatórios em lista expansível (`?relatorio=`), com período e corretor na URL (RF-06).
 * Gráfico + tabela acessível (RNF-17) via ChartCard; CSV de cada relatório.
 */
import { ChevronDown, Download } from "lucide-react";
import { useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChartCard } from "@/components/patterns/ChartCard";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/Toast";
import { PERIODOS, vendedores, type Periodo } from "@/domain";
import { useConsulta } from "@/features/dados/useConsulta";
import { useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { cn } from "@/lib/cn";
import { baixarCsv } from "@/lib/csv";
import type { Recurso } from "@/lib/recurso";
import { fakeApi } from "@/mocks/services/fakeApi";
import { DEFINICOES, PERIODO_ROTULO, RELATORIOS, ehRelatorio, type DadosRelatorios } from "./modelo";

const TODOS = "todos";
const ePeriodo = (v: string | undefined): v is Periodo => PERIODOS.includes(v as Periodo);

export function TelaRelatorios() {
  const url = useParametrosUrl();
  const brutoRel = url.ler("relatorio");
  const relatorio = ehRelatorio(brutoRel) ? brutoRel : RELATORIOS[0];
  const brutoPeriodo = url.ler("periodo");
  const periodo: Periodo = ePeriodo(brutoPeriodo) ? brutoPeriodo : "ultimos12";
  const corretorId = url.ler("corretor");

  const carregar = useCallback(() => fakeApi.getRelatorios({ periodo, corretorId }), [periodo, corretorId]);
  const { estado, recarregar } = useConsulta(carregar);
  const { estado: equipe } = useConsulta(useCallback(() => fakeApi.listCorretores(), []));
  const corretores = "dados" in equipe && equipe.dados ? vendedores(equipe.dados) : [];
  const dadosEstado: Recurso<DadosRelatorios> = estado;
  const dados = "dados" in dadosEstado ? dadosEstado.dados : undefined;

  const exportar = (id: (typeof RELATORIOS)[number], dados: DadosRelatorios) => {
    const def = DEFINICOES[id];
    baixarCsv(def.arquivo, def.csv(dados));
    toast({ tone: "success", title: "CSV gerado", description: def.titulo });
  };

  return (
    <>
      <PageHeader
        titulo="Relatórios"
        acoes={
          <div className="flex flex-wrap gap-2">
            <Select
              aria-label="Período"
              value={periodo}
              onValueChange={(v) => url.definir({ periodo: v === "ultimos12" ? undefined : v })}
              options={PERIODOS.map((p) => ({ value: p, label: PERIODO_ROTULO[p] }))}
            />
            <Select
              aria-label="Corretor"
              value={corretorId ?? TODOS}
              onValueChange={(v) => url.definir({ corretor: v === TODOS ? undefined : v })}
              options={[
                { value: TODOS, label: "Todos os corretores" },
                ...corretores.map((c) => ({ value: c.id, label: c.nome })),
              ]}
            />
          </div>
        }
      />
      <ul className="flex min-w-0 flex-col border-y border-border">
        {RELATORIOS.map((id) => {
          const def = DEFINICOES[id];
          const aberto = id === relatorio;
          const painelId = `relatorio-${id}`;
          return (
            <li key={id} className="min-w-0 border-t border-border first:border-t-0">
              <h2>
                <button
                  type="button"
                  aria-expanded={aberto}
                  aria-controls={aberto ? painelId : undefined}
                  onClick={() => url.definir({ relatorio: id === RELATORIOS[0] ? undefined : id })}
                  className={cn(
                    "group flex w-full cursor-pointer items-center justify-between gap-6 py-7 text-left",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block display text-2xl text-text">{def.titulo}</span>
                    <span className="mt-1.5 block text-sm text-text-2">{def.descricao}</span>
                  </span>
                  <Icon
                    icon={ChevronDown}
                    size={20}
                    className={cn(
                      "shrink-0 text-text-2 transition-transform duration-(--dur-fast) ease-standard group-hover:text-text",
                      aberto && "rotate-180",
                    )}
                  />
                </button>
              </h2>
              {aberto ? (
                <div id={painelId} className="pb-8">
                  <ChartCard<DadosRelatorios>
                    titulo={PERIODO_ROTULO[periodo]}
                    headingLevel={3}
                    estado={dadosEstado}
                    onTentarNovamente={recarregar}
                    estaVazio={def.vazio}
                    tituloVazio={def.tituloVazio}
                    resumo={def.resumo}
                    tabela={def.tabela}
                    grafico={def.grafico}
                    acao={
                      <Button
                        variant="secondary"
                        size="sm"
                        leadingIcon={Download}
                        disabled={dados === undefined || def.vazio(dados)}
                        onClick={() => dados && exportar(id, dados)}
                      >
                        Exportar CSV
                      </Button>
                    }
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
