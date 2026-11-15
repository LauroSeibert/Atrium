import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { TelaContratos } from "@/features/contratos/TelaContratos";

export const metadata: Metadata = { title: "Contratos" };

export default function Pagina() {
  return (
    <Suspense fallback={<PageSkeleton variante="lista" />}>
      <TelaContratos />
    </Suspense>
  );
}
