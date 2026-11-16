"use client";
import type { Permissao } from "@/domain";
import { Button } from "@/components/ui/Button";
import { enviandoLinha, type AcaoEmLinha } from "@/features/dados/useAcaoEmLinha";

/** Botão de pagamento: só aparece quando o domínio permite (`podePagar`); o `id` liga ao pagamento em andamento. */
export function AcaoPagar({
  permissao,
  id,
  rotulo,
  rotuloAcessivel,
  andamento,
  onPagar,
}: {
  permissao: Permissao;
  id: string;
  rotulo: string;
  rotuloAcessivel: string;
  andamento: AcaoEmLinha;
  onPagar: () => void;
}) {
  if (!permissao.ok) return null;
  return (
    <Button
      variant="secondary"
      size="touch"
      aria-label={rotuloAcessivel}
      loading={enviandoLinha(andamento, id)}
      disabled={andamento.fase === "enviando"}
      onClick={onPagar}
    >
      {rotulo}
    </Button>
  );
}
