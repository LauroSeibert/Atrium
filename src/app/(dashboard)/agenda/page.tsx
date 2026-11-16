import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { TelaAgenda } from "@/features/agenda/TelaAgenda";

export const metadata: Metadata = { title: "Agenda" };

export default function Pagina() {
  return (
    <Suspense fallback={<PageSkeleton variante="lista" />}>
      <TelaAgenda />
    </Suspense>
  );
}
