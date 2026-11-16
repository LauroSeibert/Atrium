"use client";
/** Despesas do contrato (RF-78): vencimento, valor, status e "Registrar pagamento" quando o domínio permite. */
import { useCallback } from "react";
import { EmptyState } from "@/components/patterns/EmptyState";
import { EstadoRecurso } from "@/components/patterns/EstadoRecurso";
import { CATEGORIA_DESPESA_ROTULO, STATUS_DESPESA_UI } from "@/components/patterns/rotulos";
import { SectionCard } from "@/components/patterns/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { enviandoLinha, useAcaoEmLinha } from "@/features/dados/useAcaoEmLinha";
import { useConsulta } from "@/features/dados/useConsulta";
import { formatData, formatMoeda } from "@/lib/format";
import { fakeApi } from "@/mocks/services/fakeApi";

export function SecaoDespesas({ contratoId }: { contratoId: string }) {
  const carregar = useCallback(
    () => fakeApi.listDespesas({ contratoId }, { pagina: 1, porPagina: 100_000 }),
    [contratoId],
  );
  const { estado, recarregar } = useConsulta(carregar);
  const { estado: andamento, executar } = useAcaoEmLinha();

  const pagar = (id: string, descricao: string) =>
    executar(id, () => fakeApi.pagarDespesa(id), { sucesso: `Pagamento de ${descricao} registrado` });

  return (
    <SectionCard titulo="Despesas">
      <EstadoRecurso
        estado={estado}
        carregando={
          <div role="status" aria-busy="true" aria-label="Carregando despesas" className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} shape="rect" className="h-10 rounded-md" />
            ))}
          </div>
        }
        estaVazio={(d) => d.itens.length === 0}
        vazio={<EmptyState tamanho="compacto" titulo="Nenhuma despesa neste contrato" />}
        erro={{ titulo: "Não foi possível carregar as despesas" }}
        onTentarNovamente={recarregar}
      >
        {(d) => (
          <Table aria-label="Despesas do contrato" density="compact" containerClassName="animate-fade-in">
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead align="right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.itens.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="max-w-64 min-w-40 break-words">{x.descricao}</TableCell>
                  <TableCell className="whitespace-nowrap">{CATEGORIA_DESPESA_ROTULO[x.categoria]}</TableCell>
                  <TableCell className="tnum whitespace-nowrap">{formatData(x.vencimento)}</TableCell>
                  <TableCell align="right" className="tnum whitespace-nowrap">
                    {formatMoeda(x.valor)}
                  </TableCell>
                  <TableCell>
                    <Badge tone={STATUS_DESPESA_UI[x.status].tom} dot>
                      {STATUS_DESPESA_UI[x.status].rotulo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {x.podePagar.ok ? (
                      <div className="flex justify-end">
                        <Button
                          variant="secondary"
                          size="touch"
                          loading={enviandoLinha(andamento, x.id)}
                          disabled={andamento.fase === "enviando"}
                          aria-label={`Registrar pagamento de ${x.descricao}`}
                          onClick={() => void pagar(x.id, x.descricao)}
                        >
                          Registrar pagamento
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </EstadoRecurso>
    </SectionCard>
  );
}
