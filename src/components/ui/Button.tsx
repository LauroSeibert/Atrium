import { Slot } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import { Spinner } from "./Spinner";

export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap select-none",
    "transition duration-(--dur-fast) ease-standard",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "active:scale-98 motion-reduce:active:scale-100",
    "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-hover",
        secondary: "border border-border-strong bg-surface text-text hover:bg-bg-subtle",
        ghost: "text-text hover:bg-bg-subtle",
        destructive: "bg-danger text-on-danger hover:bg-danger-hover",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
      },
      iconOnly: { true: "px-0" },
    },
    compoundVariants: [
      { iconOnly: true, size: "sm", className: "w-8" },
      { iconOnly: true, size: "md", className: "w-10" },
      { iconOnly: true, size: "lg", className: "w-11" },
    ],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type BaseProps = Omit<ComponentProps<"button">, "children"> &
  Omit<VariantProps<typeof buttonVariants>, "iconOnly"> & {
    /** Renderiza o filho (ex.: `<Link>`) com o estilo de botão. */
    asChild?: boolean;
    /** Mostra spinner, mantém a largura e bloqueia cliques (aria-busy). */
    loading?: boolean;
    leadingIcon?: LucideIcon;
    trailingIcon?: LucideIcon;
  };

type WithText = BaseProps & { children: ReactNode; icon?: never; "aria-label"?: string };
/** Botão só com ícone exige `aria-label` (o tipo obriga). */
type IconOnly = BaseProps & { icon: LucideIcon; children?: never; "aria-label": string };

export type ButtonProps = WithText | IconOnly;

/**
 * Botão. Uma ação `primary` por vista (Von Restorff); demais `secondary`/`ghost`.
 * Alvos: sm 32 px (só em tabelas densas), md 40 px (padrão desktop), lg 44 px (mobile).
 */
export function Button({
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  leadingIcon,
  trailingIcon,
  icon,
  className,
  children,
  type,
  ...props
}: ButtonProps) {
  const iconSize = size === "lg" ? 20 : 16;
  const iconOnly = Boolean(icon);
  const classes = cn(buttonVariants({ variant, size, iconOnly }), className);

  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      type={type ?? "button"}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size={iconSize} />
        </span>
      ) : null}
      <span className={cn("inline-flex items-center gap-2", loading && "opacity-0")}>
        {icon ? <Icon icon={icon} size={iconSize} /> : null}
        {leadingIcon ? <Icon icon={leadingIcon} size={iconSize} /> : null}
        {children}
        {trailingIcon ? <Icon icon={trailingIcon} size={iconSize} /> : null}
      </span>
    </button>
  );
}
