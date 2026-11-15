"use client";

import { Search } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "../ui/Icon";
import { Kbd } from "../ui/Kbd";

const assinar = () => () => {};
const ehMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Abre a paleta ⌘K (RF-02). Campo falso no desktop, botão de ícone no mobile. O atalho real fica em `useAtalhoPaleta`. */
export function SearchTrigger({ onAbrir, className }: { onAbrir: () => void; className?: string }) {
  const mac = useSyncExternalStore(assinar, ehMac, () => true);
  const atalho = mac ? "⌘K" : "Ctrl K";
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-keyshortcuts={mac ? "Meta+K" : "Control+K"}
      aria-haspopup="dialog"
      className={cn(
        "inline-flex h-11 cursor-pointer items-center gap-2 rounded-md text-sm text-text-muted outline-none lg:h-10",
        "transition-colors duration-(--dur-fast) ease-standard",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "w-11 justify-center hover:bg-bg-subtle hover:text-text lg:w-10",
        "md:w-48 md:justify-start md:border md:border-border-strong md:bg-surface md:px-3 md:hover:bg-surface xl:w-64",
        className,
      )}
    >
      <Icon icon={Search} size={20} className="md:size-4" />
      {/* Nome acessível = texto visível + complemento (WCAG 2.5.3): "Buscar imóveis, leads, contratos e ações". */}
      <span className="sr-only min-w-0 flex-1 truncate text-left md:not-sr-only">Buscar</span>
      <span className="sr-only"> imóveis, leads, contratos e ações</span>
      <Kbd aria-hidden="true" className="hidden md:inline-flex">
        {atalho}
      </Kbd>
    </button>
  );
}
