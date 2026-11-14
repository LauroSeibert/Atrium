import { Popover as PopoverPrimitive } from "radix-ui";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export type PopoverContentProps = ComponentProps<typeof PopoverPrimitive.Content> & {
  /** Mostra botão "Fechar" no canto. */
  showClose?: boolean;
};

export function PopoverContent({
  className,
  children,
  showClose = false,
  align = "center",
  sideOffset = 8,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "relative z-(--z-popover) w-72 rounded-lg border border-border bg-surface-raised p-4 text-sm text-text shadow-2",
          "data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in",
          className,
        )}
        {...props}
      >
        {children}
        {showClose ? (
          <PopoverPrimitive.Close asChild>
            <Button variant="ghost" size="sm" icon={X} aria-label="Fechar" className="absolute top-2 right-2" />
          </PopoverPrimitive.Close>
        ) : null}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
