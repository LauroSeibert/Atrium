import { AlertDialog as AlertPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export type AlertDialogProps = {
  /** Elemento que abre o diálogo (recebe o foco de volta ao fechar). */
  trigger?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  /** Explique o impacto da ação. */
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  /** Spinner no botão de confirmar; bloqueia os cliques. */
  loading?: boolean;
  /** Fecha ao confirmar (padrão). Use `false` em ações assíncronas controlando `open`. */
  closeOnConfirm?: boolean;
  className?: string;
};

/** Confirmação de ação destrutiva. O foco inicial vai para "Cancelar" (ação segura). */
export function AlertDialog({
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  loading = false,
  closeOnConfirm = true,
  className,
}: AlertDialogProps) {
  return (
    <AlertPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      // Durante `loading`, ignora fechamento (Esc/overlay) para não perder a ação em andamento.
      onOpenChange={(next) => {
        if (loading && !next) return;
        onOpenChange?.(next);
      }}
    >
      {trigger ? <AlertPrimitive.Trigger asChild>{trigger}</AlertPrimitive.Trigger> : null}
      <AlertPrimitive.Portal>
        <AlertPrimitive.Overlay className="fixed inset-0 z-(--z-modal) bg-text/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <AlertPrimitive.Content
          onEscapeKeyDown={(event) => {
            if (loading) event.preventDefault();
          }}
          className={cn(
            "fixed top-1/2 left-1/2 z-(--z-modal) flex w-11/12 max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border border-border bg-surface-raised p-6 text-text shadow-2 sm:p-8",
            "data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in",
            className,
          )}
        >
          <div className="flex flex-col gap-2">
            <AlertPrimitive.Title className="display text-2xl">{title}</AlertPrimitive.Title>
            <AlertPrimitive.Description className="text-sm text-text-muted">{description}</AlertPrimitive.Description>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertPrimitive.Cancel asChild>
              <Button variant="secondary" onClick={onCancel} disabled={loading}>
                {cancelLabel}
              </Button>
            </AlertPrimitive.Cancel>
            <AlertPrimitive.Action asChild>
              <Button
                variant="destructive"
                loading={loading}
                onClick={(event) => {
                  if (!closeOnConfirm) event.preventDefault();
                  onConfirm?.();
                }}
              >
                {confirmLabel}
              </Button>
            </AlertPrimitive.Action>
          </div>
        </AlertPrimitive.Content>
      </AlertPrimitive.Portal>
    </AlertPrimitive.Root>
  );
}
