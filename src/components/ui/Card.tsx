import { Check } from "lucide-react";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

const base = "relative rounded-lg border bg-surface text-text shadow-1";
const interactiveClasses = [
  "block cursor-pointer text-left transition duration-(--dur-fast) ease-standard",
  "hover:border-border-strong hover:shadow-2",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
];

export type CardProps = ComponentProps<"div"> & {
  variant?: "base" | "interactive" | "selectable";
  /** `interactive`: o filho (ex.: `<a>`/`<Link>`) vira o card inteiro. */
  asChild?: boolean;
  /** `selectable`. */
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
};

/**
 * Card. `base` é estático; `interactive` usa `asChild` com um link/botão;
 * `selectable` é um botão com `aria-pressed` (Enter/Espaço alternam).
 */
export function Card({
  variant = "base",
  asChild = false,
  selected = false,
  onSelectedChange,
  className,
  children,
  ...props
}: CardProps) {
  if (variant === "selectable") {
    const { onClick, ...rest } = props as ComponentProps<"button">;
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={(e) => {
          onClick?.(e);
          onSelectedChange?.(!selected);
        }}
        className={cn(base, interactiveClasses, "w-full", selected ? "border-primary" : "border-border", className)}
        {...rest}
      >
        {selected ? <Icon icon={Check} size={20} className="absolute top-3 right-3 text-primary" /> : null}
        {children}
      </button>
    );
  }
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp className={cn(base, "border-border", variant === "interactive" && interactiveClasses, className)} {...props}>
      {children}
    </Comp>
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 p-6 pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("text-lg font-semibold text-text", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-sm text-text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-2 p-6 pt-0", className)} {...props} />;
}
