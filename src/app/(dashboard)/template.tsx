import type { ReactNode } from "react";
import { TransicaoDeRota } from "@/components/layout/TransicaoDeRota";

/** Remonta ao trocar de módulo: transição curta de entrada (fade + slide, tokens de movimento). */
export default function DashboardTemplate({ children }: { children: ReactNode }) {
  return <TransicaoDeRota>{children}</TransicaoDeRota>;
}
