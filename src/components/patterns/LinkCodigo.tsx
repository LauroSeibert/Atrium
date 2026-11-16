import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type LinkCodigoProps = {
  href: string;
  /** Código ou número (ex.: "CT-2026-0012", "AT-0042"). */
  children: ReactNode;
  /** Nome acessível, se o texto sozinho não bastar. */
  "aria-label"?: string;
  className?: string;
};

/** Link em fonte mono para o código de um contrato ou imóvel (tabelas e cartões). */
export function LinkCodigo({ href, children, className, ...props }: LinkCodigoProps) {
  return (
    <Link
      href={href}
      {...props}
      className={cn(
        "w-fit rounded-sm font-mono text-sm font-medium whitespace-nowrap text-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      {children}
    </Link>
  );
}
