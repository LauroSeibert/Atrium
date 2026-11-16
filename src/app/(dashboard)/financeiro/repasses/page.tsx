import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { TelaRepasses } from "@/features/financeiro/TelaRepasses";

export const metadata: Metadata = { title: "Repasses" };

export default function Pagina() {
  return (
    <Suspense fallback={<PageSkeleton variante="lista" />}>
      <TelaRepasses />
    </Suspense>
  );
}
