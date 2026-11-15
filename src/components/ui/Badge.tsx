import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export const badgeVariants = cva("inline-flex shrink-0 items-center gap-1 rounded-full font-medium whitespace-nowrap", {
  variants: {
    tone: {
      neutral: "bg-surface-muted text-text",
      primary: "bg-primary-subtle text-primary",
      success: "bg-success-bg text-success",
      warning: "bg-warning-bg text-warning",
      danger: "bg-danger-bg text-danger",
      info: "bg-info-bg text-info",
    },
    size: {
      sm: "h-5 px-1.5 text-xs",
      md: "h-6 px-2.5 text-xs",
    },
  },
  defaultVariants: { tone: "neutral", size: "md" },
});

export type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** Ponto colorido antes do texto. Cor nunca é o único sinal: o texto sempre aparece. */
    dot?: boolean;
    icon?: LucideIcon;
  };

/** Rótulo curto de status/categoria. Sempre com texto; ponto ou ícone são reforço. */
export function Badge({ tone, size, dot, icon, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {dot ? <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-current" /> : null}
      {icon ? <Icon icon={icon} size={16} /> : null}
      {children}
    </span>
  );
}

export type TagProps = Omit<BadgeProps, "dot" | "icon"> & {
  /** Quando informado, mostra o botão de remover. */
  onRemove?: () => void;
  /** `aria-label` do botão de remover. Padrão: `Remover <texto>` quando o conteúdo é texto. */
  removeLabel?: string;
};

/** Tag: Badge com botão opcional de remover (filtros aplicados). */
export function Tag({ onRemove, removeLabel, children, className, ...props }: TagProps) {
  const label = removeLabel ?? (typeof children === "string" ? `Remover ${children}` : "Remover");
  return (
    <Badge className={cn(onRemove && "pr-0", className)} {...props}>
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={label}
          className="inline-flex size-6 cursor-pointer items-center justify-center rounded-full transition duration-(--dur-fast) ease-standard hover:bg-text/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Icon icon={X} size={16} />
        </button>
      ) : null}
    </Badge>
  );
}
