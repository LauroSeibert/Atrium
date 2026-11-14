import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const skeletonVariants = cva("animate-pulse bg-surface-warm motion-reduce:animate-none", {
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
