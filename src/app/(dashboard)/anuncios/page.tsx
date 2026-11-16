import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { TelaAnuncios } from "@/features/anuncios/TelaAnuncios";

export const metadata: Metadata = { title: "Anúncios" };

export default function Pagina() {
  return (
    <Suspense fallback={<PageSkeleton variante="lista" />}>
      <TelaAnuncios />
    </Suspense>
  );
}
