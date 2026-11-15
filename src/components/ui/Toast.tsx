"use client";

import { Toast as ToastPrimitive } from "radix-ui";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { Icon } from "./Icon";

export type ToastTone = "success" | "error" | "info";

export type ToastInput = {
  title: string;
  description?: string;
  tone: ToastTone;
  /** Ação como "Desfazer" (RF-04). */
  action?: { label: string; onClick: () => void };
  /** ms. Padrão: 5000 (8000 para erro). */
  duration?: number;
};

type ToastItem = ToastInput & { id: string };

type ToastStore = {
  toasts: ToastItem[];
  add: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const MAX_VISIVEIS = 3;
let seq = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (input) => {
    const id = `toast-${++seq}`;
    set((state) => ({ toasts: [...state.toasts, { ...input, id }].slice(-MAX_VISIVEIS) }));
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Dispara um toast de qualquer lugar. Retorna o id (use `toast.dismiss(id)`). */
export function toast(input: ToastInput): string {
  return useToastStore.getState().add(input);
}
toast.dismiss = (id: string) => useToastStore.getState().dismiss(id);

const tones = {
  success: { icon: CircleCheck, color: "text-success", bar: "bg-success-bg" },
  error: { icon: CircleAlert, color: "text-danger", bar: "bg-danger-bg" },
  info: { icon: Info, color: "text-info", bar: "bg-info-bg" },
} as const;

/** Provider + viewport. Monte uma vez no layout raiz. Erros são anunciados de forma assertiva. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <ToastPrimitive.Provider label="Notificações" swipeDirection="right">
      {toasts.map((t) => {
        const tone = tones[t.tone];
        return (
          <ToastPrimitive.Root
            key={t.id}
            type={t.tone === "error" ? "foreground" : "background"}
            duration={t.duration ?? (t.tone === "error" ? 8000 : 5000)}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
            className="relative flex items-start gap-3 rounded-lg border border-border bg-surface-raised p-4 pr-12 text-sm text-text shadow-3 data-[state=closed]:animate-fade-out data-[state=open]:animate-slide-in-up"
          >
            <span
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                tone.bar,
                tone.color,
              )}
            >
              <Icon icon={tone.icon} size={20} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <ToastPrimitive.Title className="font-medium break-words">{t.title}</ToastPrimitive.Title>
              {t.description ? (
                <ToastPrimitive.Description className="break-words text-text-muted">
                  {t.description}
                </ToastPrimitive.Description>
              ) : null}
              {t.action ? (
                <ToastPrimitive.Action asChild altText={`${t.action.label}: ${t.title}`}>
                  <Button variant="link" size="sm" className="self-start font-semibold" onClick={t.action.onClick}>
                    {t.action.label}
                  </Button>
                </ToastPrimitive.Action>
              ) : null}
            </div>
            <ToastPrimitive.Close asChild>
              <Button variant="ghost" size="sm" icon={X} aria-label="Fechar" className="absolute top-2 right-2" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport
        data-toast-viewport=""
        className="fixed right-0 bottom-0 z-(--z-toast) m-0 flex w-full flex-col gap-2 p-4 outline-none sm:max-w-sm"
      />
    </ToastPrimitive.Provider>
  );
}
