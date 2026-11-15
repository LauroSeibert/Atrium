"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ContadoresNavegacao } from "@/domain";
import { cn } from "@/lib/cn";
import { AtriumLogo, AtriumMark } from "../brand/AtriumLogo";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { NAV_PRINCIPAL, NAV_RODAPE, type ItemNavegacao } from "./navegacao";
import { NavegacaoPrincipal } from "./NavegacaoPrincipal";

export type TomSidebar = "clara" | "marca";

export type SidebarProps = {
  pathname: string;
  /** Só ícones + tooltips (RF-60). Quem chama persiste a escolha. */
  recolhida: boolean;
  onAlternarRecolhida: () => void;
  contadores?: ContadoresNavegacao;
  /**
   * `clara` (padrão): Beige claro (`--bg-subtle`), respeita o 60-30-10.
   * `marca`: Hunter Green também no tema claro (aplica os tokens do tema escuro só na sidebar).
   * Decisão documentada em DESIGN_SYSTEM §11.
   */
  tom?: TomSidebar;
  itens?: readonly ItemNavegacao[];
  rodape?: readonly ItemNavegacao[];
  className?: string;
  /** Nome do landmark; mude só quando houver duas sidebars na mesma página (ex.: comparação no catálogo). */
  "aria-label"?: string;
};

/** Sidebar do desktop (≥ 1024 px): logo, navegação por módulo, rodapé com Configurações e recolher (RF-01, RF-60, RF-62). */
export function Sidebar({
  pathname,
  recolhida,
  onAlternarRecolhida,
  contadores,
  tom = "clara",
  itens = NAV_PRINCIPAL,
  rodape = NAV_RODAPE,
  className,
  "aria-label": rotulo = "Menu principal",
}: SidebarProps) {
  const rotuloAlternar = recolhida ? "Expandir menu" : "Recolher menu";
  return (
    <aside
      aria-label={rotulo}
      data-recolhida={recolhida || undefined}
      className={cn(
        tom === "marca" && "dark",
        "flex h-dvh flex-col border-r border-border bg-bg-subtle text-text",
        "transition-all duration-(--dur-base) ease-standard motion-reduce:transition-none",
        recolhida ? "w-16" : "w-64",
        className,
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center", recolhida ? "justify-center" : "px-4")}>
        <Link
          href="/"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label="Atrium, ir para o Dashboard"
        >
          {recolhida ? (
            <AtriumMark className="size-8 animate-fade-in" aria-hidden="true" title="" />
          ) : (
            <AtriumLogo aria-hidden="true" className="h-8 w-auto animate-fade-in" />
          )}
        </Link>
      </div>

      <nav aria-label="Módulos" className={"flex-1 overflow-y-auto px-3 py-2"}>
        <NavegacaoPrincipal itens={itens} pathname={pathname} recolhida={recolhida} contadores={contadores} />
      </nav>

      <div className="flex shrink-0 flex-col gap-1 border-t border-border px-3 py-3">
        <nav aria-label="Preferências">
          <NavegacaoPrincipal itens={rodape} pathname={pathname} recolhida={recolhida} />
        </nav>
        <div className={cn("flex", recolhida ? "justify-center" : "justify-end")}>
          <Tooltip content={rotuloAlternar} side="right">
            <Button
              variant="ghost"
              size="md"
              icon={recolhida ? PanelLeftOpen : PanelLeftClose}
              aria-label={rotuloAlternar}
              onClick={onAlternarRecolhida}
              className="text-text-muted hover:bg-surface-warm hover:text-text"
            />
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
