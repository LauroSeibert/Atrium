import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { TelaImoveis } from "@/features/imoveis/TelaImoveis";

export const metadata: Metadata = { title: "Imóveis" };

export default function Pagina() {
  return (
    <Suspense fallback={<PageSkeleton variante="lista" />}>
      <TelaImoveis />
    </Suspense>
  );
}
