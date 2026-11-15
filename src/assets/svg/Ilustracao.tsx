import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Paleta das ilustrações (tokens semânticos `--illus-*`, claro/escuro em tokens.json).
 * Use SEMPRE estes valores em `fill`/`stroke`; nunca cor literal nem escala fixa
 * (`--green-*` não muda no tema escuro).
 */
export const P = {
  sky: "var(--illus-sky)",
  ground: "var(--illus-ground)",
  wall: "var(--illus-wall)",
  wallAlt: "var(--illus-wall-alt)",
  roof: "var(--illus-roof)",
  detail: "var(--illus-detail)",
  ink: "var(--illus-ink)",
  accent: "var(--illus-accent)",
} as const;

/** viewBox padronizados (RNF de ilustração, Fase 5 §5.4). */
export const VIEWBOX = {
  /** Fachadas e cômodos: 4:3. */
  cena: "0 0 400 300",
  /** Estados vazios: 4:3 menor. */
  vazio: "0 0 240 180",
  /** Avatares: 1:1. */
  avatar: "0 0 64 64",
} as const;

export type IlustracaoProps = Omit<ComponentProps<"svg">, "children" | "viewBox" | "role"> & {
  /** Descrição acessível (vira `<title>`). Ignorado quando `decorativa`. */
  titulo: string;
  /** Quando a imagem só repete o texto ao lado: `aria-hidden`, sem `<title>`. */
  decorativa?: boolean;
  viewBox: string;
  children: ReactNode;
};

/** Raiz comum de todas as ilustrações: `role="img"` + `<title>` ligado por `aria-labelledby`. */
export function Ilustracao({ titulo, decorativa, viewBox, className, children, ...props }: IlustracaoProps) {
  const id = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      role={decorativa ? undefined : "img"}
      aria-hidden={decorativa ? true : undefined}
      aria-labelledby={decorativa ? undefined : id}
      focusable="false"
      className={cn("block h-auto w-full", className)}
      {...props}
    >
      {decorativa ? null : <title id={id}>{titulo}</title>}
      {children}
    </svg>
  );
}
