import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { TelaRelatorios } from "@/features/relatorios/TelaRelatorios";

export const metadata: Metadata = { title: "Relatórios" };

export default function Pagina() {
  return (
    <Suspense fallback={<PageSkeleton variante="painel" />}>
      <TelaRelatorios />
    </Suspense>
  );
}
