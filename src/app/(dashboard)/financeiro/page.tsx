import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { TelaFinanceiro } from "@/features/financeiro/TelaFinanceiro";

export const metadata: Metadata = { title: "Financeiro" };

export default function Pagina() {
  return (
    <Suspense fallback={<PageSkeleton variante="painel" />}>
      <TelaFinanceiro />
    </Suspense>
  );
}
