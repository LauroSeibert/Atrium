import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { TelaContatos } from "@/features/contatos/TelaContatos";

export const metadata: Metadata = { title: "Contatos" };

export default function Pagina() {
  return (
    <Suspense fallback={<PageSkeleton variante="lista" />}>
      <TelaContatos />
    </Suspense>
  );
}
