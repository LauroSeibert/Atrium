import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { DialogOverlay } from "./Dialog";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export const drawerContentVariants = cva(
  ["fixed inset-y-0 z-(--z-modal) flex w-full flex-col border-border bg-surface-raised text-text shadow-2"],
  {
    variants: {
      size: { sm: "max-w-80", md: "sm:max-w-md", lg: "sm:max-w-2xl" },
      /** `left` para a navegação no mobile (Fase 7); `right` para detalhes e formulários. */
      side: {
        right: "right-0 border-l data-[state=closed]:animate-slide-out-right data-[state=open]:animate-slide-in-right",
        left: "left-0 border-r data-[state=closed]:animate-slide-out-left data-[state=open]:animate-slide-in-left",
      },
    },
    defaultVariants: { size: "md", side: "right" },
  },
);

export type DrawerContentProps = ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof drawerContentVariants>;

/** Painel lateral (direita no desktop, tela cheia no mobile; `size="sm"` limita a 320 px também no mobile). */
export function DrawerContent({ className, size, side, children, ...props }: DrawerContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content className={cn(drawerContentVariants({ size, side }), className)} {...props}>
        {children}
        <DialogPrimitive.Close asChild>
          <Button
            variant="ghost"
            size="sm"
            icon={X}
            aria-label="Fechar"
            className="absolute top-4 right-4 max-lg:size-11"
          />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DrawerHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 border-b border-border p-6 pr-14", className)} {...props} />;
}

export function DrawerBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex-1 overflow-y-auto p-6", className)} {...props} />;
}

export function DrawerFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 border-t border-border p-6 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export function DrawerTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("display text-2xl text-text", className)} {...props} />;
}

export function DrawerDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-text-muted", className)} {...props} />;
}
