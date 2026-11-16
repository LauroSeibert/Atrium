import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { COOKIE_SIDEBAR } from "@/features/shell/cookies";
import { PainelShell } from "@/features/shell/PainelShell";

/**
 * Shell do painel (Fase 7): sidebar/drawer, topbar, ⌘K, notificações e toasts em todas as telas.
 * Lê o cookie da sidebar no servidor para ela já vir recolhida no HTML (sem piscar nem CLS ao recarregar).
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const recolhida = (await cookies()).get(COOKIE_SIDEBAR)?.value === "1";
  return <PainelShell recolhidaInicial={recolhida}>{children}</PainelShell>;
}
