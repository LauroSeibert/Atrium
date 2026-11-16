import { Label as LabelPrimitive } from "radix-ui";
import type { ComponentProps, ElementType, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/* ---------- Heading ---------- */

/** De `xl` para cima o título é editorial (Instrument Serif, sempre 400); `lg`/`base` são Geist 500. */
const headingVariants = cva("text-text", {
  variants: {
    size: {
      "3xl": "display text-3xl",
      "2xl": "display text-2xl",
      xl: "display text-xl",
      lg: "text-lg font-medium",
      base: "text-base font-medium",
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

/* ---------- Eyebrow ---------- */

/** Rótulo em caixa alta acima de títulos e KPIs ("Financeiro · visão geral"). */
export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("eyebrow", className)} {...props} />;
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
        "text-caption font-medium text-text peer-disabled:cursor-not-allowed peer-disabled:text-text-muted",
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

/** Número em Geist Mono com algarismos tabulares (dinheiro em tabelas e listas). Formate antes com `@/lib/format`. */
export function Numeric({ size = "sm", weight = "regular", className, ...props }: NumericProps) {
  const sizes = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
  } as const;
  const weights = { regular: "font-regular", medium: "font-medium", semibold: "font-semibold" } as const;
  return <span className={cn("num", sizes[size], weights[weight], className)} {...props} />;
}

/* ---------- Destaque ---------- */

/** Separa prefixo/sufixo de unidade de um valor já formatado: "R$ 3,7 mi" → ["R$ ", "3,7", " mi"]. */
export function partesDestaque(texto: string): [string, string, string] {
  const m = /^(-?\s*R\$\s?)?(.*?)((?:\s(?:mil|mi|bi))|(?:,\d{2})|%)?$/u.exec(texto);
  if (!m) return ["", texto, ""];
  return [m[1] ?? "", m[2] ?? texto, m[3] ?? ""];
}

export type DestaqueProps = ComponentProps<"span"> & {
  /** Valor já formatado (`@/lib/format`). */
  valor: string;
  /** `4xl` KPI (padrão), `5xl` título, `6xl` resultado do mês, `3xl`/`2xl` destaques menores. */
  size?: "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
};

/**
 * Número de destaque em Instrument Serif com as unidades menores e em text-2
 * ("R$ 3,7 mi", "R$ 3.712.120,00"). Os números são o herói da tela.
 */
export function Destaque({ valor, size = "4xl", className, ...props }: DestaqueProps) {
  const [antes, numero, depois] = partesDestaque(valor);
  const tamanhos = {
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
    "6xl": "text-6xl tracking-tight",
  } as const;
  return (
    <span className={cn("display tnum leading-display", tamanhos[size], className)} {...props}>
      {antes ? <span className="unidade">{antes}</span> : null}
      {numero}
      {depois ? <span className="unidade">{depois}</span> : null}
    </span>
  );
}
