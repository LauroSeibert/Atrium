"use client";

import Link from "next/link";
import { LayoutGroup, motion } from "motion/react";
import { useId } from "react";
import type { ContadoresNavegacao } from "@/domain";
import { cn } from "@/lib/cn";
import { useTransicaoToken } from "@/lib/motion";
import { Icon } from "../ui/Icon";
import { Tooltip } from "../ui/Tooltip";
import { rotaAtiva, type ItemNavegacao } from "./navegacao";

// Contadores discretos: só número; cor de estado apenas quando pede atenção (atraso/risco).
const TOM_CONTADOR = {
  primary: "text-primary",
  info: "text-text-muted",
  danger: "bg-danger-bg text-danger",
  warning: "bg-warning-bg text-warning",
  neutral: "text-text-muted",
} as const;

const formatarContador = (n: number) => (n > 99 ? "99+" : String(n));

export type NavegacaoPrincipalProps = {
  itens: readonly ItemNavegacao[];
  pathname: string;
  /** Só ícones (com tooltip). O nome acessível do link continua completo. */
  recolhida?: boolean;
  /** Números dos badges (RF-62). Ausente (carregando/erro) = sem badge, sem quebrar a navegação. */
  contadores?: ContadoresNavegacao;
  /** Chamado ao escolher um item (ex.: fechar o drawer no mobile). */
  onNavegar?: () => void;
  /** Alvos de 44 px no mobile (RNF-04). */
  tamanho?: "padrao" | "toque";
};

/**
 * Lista de links do shell (RF-01). Item ativo com `aria-current="page"` e indicador que desliza
 * entre os itens (motion `layoutId`, duração dos tokens; some com `prefers-reduced-motion`).
 */
export function NavegacaoPrincipal({
  itens,
  pathname,
  recolhida = false,
  contadores,
  onNavegar,
  tamanho = "padrao",
}: NavegacaoPrincipalProps) {
  const grupo = useId();
  const transicao = useTransicaoToken("--dur-slow", "--easing-standard");

  return (
    <LayoutGroup id={grupo}>
      <ul className="flex flex-col gap-0.5">
        {itens.map((item) => {
          const ativo = rotaAtiva(pathname, item.href);
          const n = item.contador && contadores ? contadores[item.contador.chave] : 0;
          const descricao = item.contador && n > 0 ? item.contador.descrever(n) : undefined;
          const link = (
            <Link
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              aria-label={
                recolhida
                  ? // inclui o texto visível do badge ("99+") no nome (WCAG 2.5.3)
                    [item.rotulo, descricao && (n > 99 ? `${formatarContador(n)}: ${descricao}` : descricao)]
                      .filter(Boolean)
                      .join(", ")
                  : undefined
              }
              onClick={onNavegar}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-md px-2.5 font-medium outline-none",
                tamanho === "toque" ? "h-11 text-base" : "h-9 text-sm",
                "transition-colors duration-(--dur-fast) ease-standard",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                recolhida && "w-10 justify-center px-0",
                ativo ? "text-text" : "text-text-muted hover:bg-surface-muted hover:text-text",
              )}
            >
              {ativo ? (
                <motion.span
                  layoutId="indicador-ativo"
                  transition={transicao}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-md bg-surface-muted"
                />
              ) : null}
              <Icon icon={item.icone} size={16} className={cn("relative shrink-0", ativo && "text-primary")} />
              {/* rótulo entra com fade ao expandir a sidebar (some na hora ao recolher: saída mais rápida) */}
              {recolhida ? null : (
                <span className="relative min-w-0 flex-1 animate-fade-in truncate">{item.rotulo}</span>
              )}
              {n > 0 && item.contador ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "tnum relative inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium",
                    TOM_CONTADOR[item.contador.tom],
                    recolhida && "absolute -top-1 -right-1 bg-surface-muted ring-2 ring-bg-subtle",
                  )}
                >
                  {formatarContador(n)}
                </span>
              ) : null}
              {descricao && !recolhida ? <span className="sr-only">, {descricao}</span> : null}
            </Link>
          );
          return (
            <li key={item.href} className={cn(recolhida && "flex justify-center")}>
              {recolhida ? (
                <Tooltip content={descricao ? `${item.rotulo} · ${descricao}` : item.rotulo} side="right">
                  {link}
                </Tooltip>
              ) : (
                link
              )}
            </li>
          );
        })}
      </ul>
    </LayoutGroup>
  );
}
