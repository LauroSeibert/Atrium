import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const dialogContentVariants = cva(
  [
    "fixed top-1/2 left-1/2 z-(--z-modal) flex max-h-screen w-11/12 -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto",
    "rounded-lg border border-border bg-surface-raised p-6 text-text shadow-2 sm:p-8",
    "data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in",
  ],
  {
    variants: { size: { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" } },
    defaultVariants: { size: "md" },
  },
);

export function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-(--z-modal) bg-text/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in",
        className,
      )}
      {...props}
    />
  );
}

export type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    /** Mostra o botão "Fechar" no canto (padrão: true). */
    showClose?: boolean;
  };

export function DialogContent({ className, size, children, showClose = true, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content className={cn(dialogContentVariants({ size }), className)} {...props}>
        {children}
        {showClose ? (
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="sm" icon={X} aria-label="Fechar" className="absolute top-3 right-3" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 pr-8", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("display text-2xl text-text", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-text-muted", className)} {...props} />;
}
