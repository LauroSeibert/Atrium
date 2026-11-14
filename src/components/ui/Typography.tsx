import { Label as LabelPrimitive } from "radix-ui";
import type { ComponentProps, ElementType, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/* ---------- Heading ---------- */

const headingVariants = cva("font-semibold tracking-tight text-text", {
  variants: {
    size: {
      "3xl": "text-3xl",
      "2xl": "text-2xl",
      xl: "text-xl",
      lg: "text-lg",
      base: "text-base",
    },
  },
  defaultVariants: { size: "xl" },
});

type HeadingLevel = 1 | 2 | 3 | 4;
const defaultSize: Record<HeadingLevel, NonNullable<VariantProps<typeof headingVariants>["size"]>> = {
  1: "2xl",
  2: "xl",
  3: "lg",
  4: "base",
};

export type HeadingProps = ComponentProps<"h2"> &
  VariantProps<typeof headingVariants> & {
    /** Nível semântico (h1–h4). O tamanho visual é independente via `size`. */
    level?: HeadingLevel;
  };

/** Título. Separa semântica (`level`) de aparência (`size`) para manter a hierarquia correta. */
export function Heading({ level = 2, size, className, ...props }: HeadingProps) {
  const Tag = `h${level}` as ElementType;
  return <Tag className={cn(headingVariants({ size: size ?? defaultSize[level] }), className)} {...props} />;
}

/* ---------- Text ---------- */

const textVariants = cva("", {
  variants: {
    size: { xs: "text-xs", sm: "text-sm", base: "text-base" },
    tone: {
      default: "text-text",
      muted: "text-text-muted",
      success: "text-success",
      warning: "text-warning",
      danger: "text-danger",
      info: "text-info",
    },
    weight: { regular: "font-regular", medium: "font-medium", semibold: "font-semibold" },
  },
  defaultVariants: { size: "sm", tone: "default", weight: "regular" },
});

export type TextProps = ComponentProps<"p"> &
  VariantProps<typeof textVariants> & {
    as?: "p" | "span" | "div" | "strong" | "em";
  };

/** Texto corrido. Corpo padrão 14 px (`sm`); `muted` para informação secundária. */
export function Text({ as: Tag = "p", size, tone, weight, className, ...props }: TextProps) {
  return <Tag className={cn(textVariants({ size, tone, weight }), className)} {...props} />;
}

/* ---------- Label ---------- */

export type LabelProps = ComponentProps<typeof LabelPrimitive.Root> & {
  /** Mostra "(opcional)" ou o asterisco de obrigatório. */
  requirement?: "required" | "optional";
};

/** Rótulo de campo, sempre visível (nunca use placeholder como rótulo). */
export function Label({ className, children, requirement, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "text-sm font-medium text-text peer-disabled:cursor-not-allowed peer-disabled:text-text-muted",
        className,
      )}
      {...props}
    >
      {children}
      {requirement === "required" ? (
        <span className="text-danger" aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
      {requirement === "optional" ? <span className="font-regular text-text-muted"> (opcional)</span> : null}
    </LabelPrimitive.Root>
  );
}

/* ---------- Caption ---------- */

/** Texto auxiliar pequeno (legendas, metadados, ajuda de campo). */
export function Caption({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-xs text-text-muted", className)} {...props} />;
}

/* ---------- Numeric ---------- */

export type NumericProps = ComponentProps<"span"> & {
  children: ReactNode;
  size?: "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  weight?: "regular" | "medium" | "semibold";
};

/** Número com algarismos tabulares (tabelas e KPIs). Formate antes com `@/lib/format`. */
export function Numeric({ size = "sm", weight = "medium", className, ...props }: NumericProps) {
  const sizes = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
  } as const;
  const weights = { regular: "font-regular", medium: "font-medium", semibold: "font-semibold" } as const;
  return <span className={cn("tnum", sizes[size], weights[weight], className)} {...props} />;
}
