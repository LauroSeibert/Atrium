"use client";
/**
 * Relatórios (RF-82): cinco relatórios em abas (`?relatorio=`), com período e corretor na URL (RF-06).
 * Gráfico + tabela acessível (RNF-17) via ChartCard; CSV de cada relatório.
 */
import { Download } from "lucide-react";
import { useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChartCard } from "@/components/patterns/ChartCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { toast } from "@/components/ui/Toast";
import { PERIODOS, vendedores, type Periodo } from "@/domain";
import { useConsulta } from "@/features/dados/useConsulta";
import { useParametrosUrl } from "@/features/dados/useParametrosUrl";
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
      <Tabs value={relatorio} onValueChange={(v) => url.definir({ relatorio: v === RELATORIOS[0] ? undefined : v })}>
        <TabsList aria-label="Relatório">
          {RELATORIOS.map((id) => (
            <TabsTrigger key={id} value={id}>
              {DEFINICOES[id].aba}
            </TabsTrigger>
          ))}
        </TabsList>
        {RELATORIOS.map((id) => {
          const def = DEFINICOES[id];
          return (
            <TabsContent key={id} value={id}>
              <ChartCard<DadosRelatorios>
                titulo={def.titulo}
                headingLevel={2}
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
            </TabsContent>
          );
        })}
      </Tabs>
    </>
  );
}
