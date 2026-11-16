"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AtriumMark } from "../brand/AtriumLogo";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/Breadcrumb";
import { Button } from "../ui/Button";
import type { ItemTrilha } from "./navegacao";

export type TopbarProps = {
  /** Breadcrumb (RF-61). No mobile mostra só a página atual. */
  trilha: readonly ItemTrilha[];
  /** Abre o drawer de navegação (< 768 px; no tablet há o trilho de ícones). */
  onAbrirMenu: () => void;
  menuAberto?: boolean;
  /** Slots: busca ⌘K, notificações, tema e usuário (compostos independentes). */
  busca?: ReactNode;
  notificacoes?: ReactNode;
  tema?: ReactNode;
  usuario?: ReactNode;
  className?: string;
};

/** Barra superior do shell: menu (mobile), trilha, busca, notificações, tema e usuário. */
export function Topbar({
  trilha,
  onAbrirMenu,
  menuAberto,
  busca,
  notificacoes,
  tema,
  usuario,
  className,
}: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-(--z-sticky) flex h-16 shrink-0 items-center gap-2 border-b border-border bg-bg px-5 md:px-10 xl:px-14",
        className,
      )}
    >
      <Button
        variant="ghost"
        icon={Menu}
        aria-label="Abrir menu"
        aria-haspopup="dialog"
        aria-expanded={menuAberto}
        onClick={onAbrirMenu}
        className="-ml-2 size-11 md:hidden"
      />
      <Link
        href="/"
        aria-label="Atrium, ir para o Dashboard"
        className="hidden rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:block md:hidden"
      >
        <AtriumMark className="size-8" aria-hidden="true" title="" />
      </Link>

      {/* Um nível só repetiria o h1 da página: a trilha aparece a partir do segundo nível (menos é mais). */}
      <Breadcrumb
        className={cn("min-w-0 flex-1", trilha.length < 2 && "invisible")}
        aria-hidden={trilha.length < 2 || undefined}
      >
        <BreadcrumbList className="flex-nowrap">
          {trilha.map((item, i) => {
            const ultimo = i === trilha.length - 1;
            return (
              <Fragment key={`${item.rotulo}-${i}`}>
                <BreadcrumbItem className={cn(!ultimo && "hidden md:inline-flex")}>
                  {ultimo || !item.href ? (
                    ultimo ? (
                      <BreadcrumbPage>{item.rotulo}</BreadcrumbPage>
                    ) : (
                      <span className="truncate py-1">{item.rotulo}</span>
                    )
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.rotulo}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {ultimo ? null : <BreadcrumbSeparator className="hidden md:inline-flex" />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex shrink-0 items-center gap-1">
        {busca}
        {notificacoes}
        {tema}
        {usuario ? <div className="ml-1">{usuario}</div> : null}
      </div>
    </header>
  );
}
