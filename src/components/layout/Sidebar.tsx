"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ContadoresNavegacao } from "@/domain";
import { cn } from "@/lib/cn";
import { AtriumLogo, AtriumMark } from "../brand/AtriumLogo";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Tooltip } from "../ui/Tooltip";
import { NAV_PRINCIPAL, NAV_RODAPE, type EntradaNavegacao } from "./navegacao";
import { NavegacaoPrincipal } from "./NavegacaoPrincipal";

export type SidebarProps = {
  pathname: string;
  /** Só ícones + tooltips (RF-60). Quem chama persiste a escolha. */
  recolhida: boolean;
  onAlternarRecolhida: () => void;
  contadores?: ContadoresNavegacao;
  /** Trilho fixo do tablet: sempre recolhido, sem o botão de recolher. */
  fixa?: boolean;
  itens?: readonly EntradaNavegacao[];
  rodape?: readonly EntradaNavegacao[];
  className?: string;
  /** Nome do landmark; mude só quando houver duas sidebars na mesma página (ex.: comparação no catálogo). */
  "aria-label"?: string;
};

/** Sidebar do desktop (≥ 1024 px; no tablet, `fixa` + `recolhida` vira trilho de ícones): logo, navegação por módulo, botão de recolher ao lado da marca e Configurações no rodapé (RF-01, RF-60, RF-62). */
export function Sidebar({
  pathname,
  recolhida,
  onAlternarRecolhida,
  contadores,
  fixa = false,
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
        // Tinta nos dois temas (DESIGN_SYSTEM §11): `.tinta` aplica os semânticos escuros dentro dela.
        "tinta flex h-dvh flex-col bg-sidebar text-text",
        "transition-all duration-(--dur-base) ease-standard motion-reduce:transition-none",
        recolhida ? "w-18" : "w-62",
        className,
      )}
    >
      <div
        className={cn("flex h-19 shrink-0 items-center", recolhida ? "justify-center" : "justify-between pr-3 pl-6")}
      >
        {recolhida && !fixa ? (
          // Recolhida: a marca vira o botão de expandir ao passar o mouse ou focar.
          <Tooltip content={rotuloAlternar} side="right">
            <button
              type="button"
              aria-label={rotuloAlternar}
              onClick={onAlternarRecolhida}
              className="group grid size-10 place-items-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <AtriumMark
                className="size-8 animate-fade-in group-hover:hidden group-focus-visible:hidden"
                aria-hidden="true"
                title=""
              />
              <Icon icon={PanelLeftOpen} size={16} className="hidden group-hover:block group-focus-visible:block" />
            </button>
          </Tooltip>
        ) : (
          <Link
            href="/"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="Atrium, ir para o Dashboard"
          >
            {recolhida ? (
              <AtriumMark className="size-8 animate-fade-in" aria-hidden="true" title="" />
            ) : (
              <AtriumLogo aria-hidden="true" className="animate-fade-in" />
            )}
          </Link>
        )}
        {recolhida || fixa ? null : (
          <Tooltip content={rotuloAlternar} side="right">
            <Button
              variant="ghost"
              size="sm"
              icon={PanelLeftClose}
              aria-label={rotuloAlternar}
              onClick={onAlternarRecolhida}
              className="text-text-muted hover:bg-surface-muted hover:text-text"
            />
          </Tooltip>
        )}
      </div>

      <nav aria-label="Módulos" className="flex-1 overflow-y-auto px-3.5 pt-2 pb-2">
        <NavegacaoPrincipal itens={itens} pathname={pathname} recolhida={recolhida} contadores={contadores} />
      </nav>

      <nav aria-label="Preferências" className="shrink-0 border-t border-border px-3.5 py-3">
        <NavegacaoPrincipal itens={rodape} pathname={pathname} recolhida={recolhida} />
      </nav>
    </aside>
  );
}
