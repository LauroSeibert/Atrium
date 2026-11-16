import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { TelaComissoes } from "@/features/financeiro/TelaComissoes";

export const metadata: Metadata = { title: "Comissões" };

export default function Pagina() {
  return (
    <Suspense fallback={<PageSkeleton variante="lista" />}>
      <TelaComissoes />
    </Suspense>
  );
}
