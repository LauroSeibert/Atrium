"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

const assinar = () => () => {};

/**
 * Barra de ação inferior no mobile (< 768 px, RF-63): a ação primária da tela fica ao alcance do polegar
 * (Lei de Fitts). Vai para o `body` por portal, para não herdar o `transform` da transição de rota.
 */
export function MobileActionBar({ children, className }: { children: ReactNode; className?: string }) {
  const montado = useSyncExternalStore(
    assinar,
    () => true,
    () => false,
  );
  if (!montado) return null;
  return createPortal(
    <div
      role="region"
      data-barra-acao=""
      aria-label="Ação principal"
      className={cn(
        "fixed inset-x-0 bottom-0 z-(--z-sticky) flex gap-2 border-t border-border bg-surface-raised px-4 pt-3 pb-safe shadow-3 md:hidden",
        "*:flex-1",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}
