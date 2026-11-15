import { Tabs as TabsPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;

/** Lista de abas com linha inferior; setas ←/→ navegam (Radix, roving tabindex). */
export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("flex max-w-full items-end gap-1 overflow-x-auto border-b border-border", className)}
      {...props}
    />
  );
}

export type TabsTriggerProps = ComponentProps<typeof TabsPrimitive.Trigger> & {
  /** Contador exibido junto ao rótulo, ex.: "Leads (4)". */
  count?: number;
};

export function TabsTrigger({ className, children, count, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative inline-flex h-10 shrink-0 cursor-pointer items-center px-3 text-sm font-medium whitespace-nowrap text-text-muted",
        "transition-colors duration-(--dur-fast) ease-standard hover:text-text",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-transparent",
        "after:transition-colors after:duration-(--dur-base) after:ease-standard",
        "data-[state=active]:text-text data-[state=active]:after:bg-primary",
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined ? (
        <>
          {" "}
          <span className="tnum">({count})</span>
        </>
      ) : null}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        // Troca de aba (Fase 9): o painel novo entra com fade curto (o Radix desmonta o inativo).
        "animate-fade-in pt-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}
