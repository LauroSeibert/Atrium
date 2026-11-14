import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/cn";

const sizes = { 16: "size-4", 20: "size-5", 24: "size-6" } as const;

export type IconProps = Omit<LucideProps, "size" | "ref"> & {
  /** Ícone do Lucide, ex.: `import { House } from "lucide-react"`. */
  icon: LucideIcon;
  size?: keyof typeof sizes;
  /** Rótulo acessível. Sem ele o ícone é decorativo (`aria-hidden`). */
  label?: string;
};

/** Wrapper do Lucide: traço 1,5 px e tamanhos 16/20/24 consistentes. */
export function Icon({ icon: LucideComponent, size = 20, label, className, ...props }: IconProps) {
  return (
    <LucideComponent
      strokeWidth={1.5}
      className={cn("shrink-0", sizes[size], className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
      {...props}
    />
  );
}
