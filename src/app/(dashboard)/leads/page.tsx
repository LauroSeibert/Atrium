import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { TelaLeads } from "@/features/leads/TelaLeads";

export const metadata: Metadata = { title: "Leads" };

export default function Pagina() {
  return (
    <Suspense fallback={<PageSkeleton variante="lista" />}>
      <TelaLeads />
    </Suspense>
  );
}
