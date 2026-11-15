import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const skeletonVariants = cva([
  // Shimmer suave (Fase 9): faixa clara que atravessa em laço; só transform. Desligado com reduced-motion.
  "relative overflow-hidden bg-surface-warm",
  "after:absolute after:inset-0 after:animate-shimmer after:bg-linear-to-r after:from-transparent after:via-bg-subtle/70 after:to-transparent dark:after:via-border-strong/25",
  "motion-reduce:after:hidden",
], {
  variants: {
    shape: {
      text: "h-4 w-full rounded-sm",
      circle: "size-10 rounded-full",
      rect: "h-24 w-full rounded-md",
    },
  },
  defaultVariants: { shape: "text" },
});

export type SkeletonProps = ComponentProps<"div"> & VariantProps<typeof skeletonVariants>;

/** Placeholder de carregamento. Decorativo: o contêiner deve anunciar o carregamento (aria-busy). */
export function Skeleton({ shape, className, ...props }: SkeletonProps) {
  return <div aria-hidden="true" className={cn(skeletonVariants({ shape }), className)} {...props} />;
}
