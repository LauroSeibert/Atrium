import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { TelaReceitas } from "@/features/financeiro/TelaReceitas";

export const metadata: Metadata = { title: "Receitas" };

export default function Pagina() {
  return (
    <Suspense fallback={<PageSkeleton variante="lista" />}>
      <TelaReceitas />
    </Suspense>
  );
}
