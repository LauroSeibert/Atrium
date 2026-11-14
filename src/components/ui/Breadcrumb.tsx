import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export function Breadcrumb({ className, ...props }: ComponentProps<"nav">) {
  return <nav aria-label="Trilha de navegação" className={className} {...props} />;
}

export function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return <ol className={cn("flex flex-wrap items-center gap-1 text-sm text-text-muted", className)} {...props} />;
}

export function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return <li className={cn("inline-flex min-w-0 items-center gap-1", className)} {...props} />;
}

/** Link da trilha. Use `asChild` com `next/link`. Itens longos são truncados em telas pequenas. */
export function BreadcrumbLink({ asChild = false, className, ...props }: ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "a";
  return (
    <Comp
      className={cn(
        "inline-block max-w-32 truncate rounded-sm py-1 transition-colors duration-(--dur-fast) ease-standard hover:text-text hover:underline sm:max-w-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}

/** Página atual (último item). */
export function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-current="page"
      className={cn("inline-block max-w-48 truncate py-1 font-medium text-text sm:max-w-none", className)}
      {...props}
    />
  );
}

export function BreadcrumbSeparator({ className }: { className?: string }) {
  return (
    <li role="presentation" aria-hidden="true" className={cn("inline-flex text-text-muted", className)}>
      <Icon icon={ChevronRight} size={16} />
    </li>
  );
}
