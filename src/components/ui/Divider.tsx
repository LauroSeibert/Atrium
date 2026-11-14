import { Separator as SeparatorPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";

export type DividerProps = SeparatorPrimitive.SeparatorProps;

/** Divisória. Decorativa por padrão (sem papel semântico); passe `decorative={false}` para separar regiões. */
export function Divider({ orientation = "horizontal", decorative = true, className, ...props }: DividerProps) {
  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      decorative={decorative}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch",
        className,
      )}
      {...props}
    />
  );
}
