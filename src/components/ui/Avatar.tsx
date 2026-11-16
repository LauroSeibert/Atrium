import { cva, type VariantProps } from "class-variance-authority";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";

const avatarVariants = cva(
  "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted font-semibold text-text select-none",
  {
    variants: {
      size: {
        24: "size-6 text-xs",
        32: "size-8 text-xs",
        40: "size-10 text-sm",
        48: "size-12 text-base",
      },
    },
    defaultVariants: { size: 40 },
  },
);

export type AvatarSize = 24 | 32 | 40 | 48;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0]!.charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : "";
  return (first + last).toLocaleUpperCase("pt-BR");
}

export type AvatarProps = Omit<AvatarPrimitive.AvatarProps, "children"> & {
  /** Nome da pessoa: vira rótulo acessível e gera as iniciais do fallback. */
  name: string;
  src?: string;
  size?: AvatarSize;
};

/** Foto ou iniciais. */
export function Avatar({ name, src, size, className, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root role="img" aria-label={name} className={cn(avatarVariants({ size }), className)} {...props}>
      {src ? <AvatarPrimitive.Image src={src} alt="" className="size-full object-cover" /> : null}
      <AvatarPrimitive.Fallback aria-hidden="true" delayMs={src ? 300 : 0}>
        {getInitials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export type AvatarGroupProps = VariantProps<typeof avatarVariants> & {
  people: { name: string; src?: string }[];
  /** Máximo de avatares visíveis; o resto vira "+N". */
  max?: number;
  className?: string;
  "aria-label"?: string;
};

/** Avatares sobrepostos com anel da cor de fundo e contador "+N". */
export function AvatarGroup({ people, max = 4, size = 32, className, ...props }: AvatarGroupProps) {
  const visible = people.slice(0, max);
  const rest = people.length - visible.length;
  const ring = "ring-2 ring-bg";
  return (
    <div role="group" className={cn("inline-flex items-center -space-x-2", className)} {...props}>
      {visible.map((p) => (
        <Avatar key={p.name} name={p.name} src={p.src} size={size ?? 32} className={ring} />
      ))}
      {rest > 0 ? (
        <span role="img" aria-label={`e mais ${rest}`} className={cn(avatarVariants({ size }), ring)}>
          <span aria-hidden="true">+{rest}</span>
        </span>
      ) : null}
    </div>
  );
}
