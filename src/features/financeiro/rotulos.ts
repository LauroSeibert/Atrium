import { rotuloMes } from "@/components/patterns/ChartParts";
import type { Rotulado } from "@/components/patterns/rotulos";
import type { StatusComissao } from "@/domain";

export const STATUS_COMISSAO_UI: Record<StatusComissao, Rotulado> = {
  paga: { rotulo: "Paga", tom: "success" },
  pendente: { rotulo: "Pendente", tom: "warning" },
};

/** `AAAA-MM` → "Novembro de 2026" (competência e mês de repasse; mesma grafia no cartão e na tabela). */
export function rotuloCompetencia(mes: string): string {
  const t = rotuloMes(mes, true);
  return t.charAt(0).toUpperCase() + t.slice(1);
}
