import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { TelaDashboard } from "@/features/dashboard/TelaDashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function Pagina() {
  return (
    <Suspense fallback={<PageSkeleton variante="painel" />}>
      <TelaDashboard />
    </Suspense>
  );
}
