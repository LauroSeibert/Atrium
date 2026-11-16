import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { TelaDespesas } from "@/features/financeiro/TelaDespesas";

export const metadata: Metadata = { title: "Despesas" };

export default function Pagina() {
  return (
    <Suspense fallback={<PageSkeleton variante="lista" />}>
      <TelaDespesas />
    </Suspense>
  );
}
