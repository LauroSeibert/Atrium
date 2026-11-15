"use client";
/**
 * Ponte entre os tokens de movimento (CSS) e o `motion` (JS). Nenhuma duração ou curva literal:
 * lê `--dur-*` e `--easing-*` do documento, então `prefers-reduced-motion` (tokens → 1 ms) vale aqui também.
 */
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

export type TokenDuracao = "--dur-fast" | "--dur-base" | "--dur-slow" | "--dur-page";
export type TokenEasing = "--easing-standard" | "--easing-enter" | "--easing-exit" | "--easing-spring";
export type TransicaoMotion = { duration: number; ease: [number, number, number, number] };

const SEM_MOVIMENTO: TransicaoMotion = { duration: 0, ease: [0, 0, 1, 1] };

/** "200ms" | "0.2s" → segundos. */
export function segundos(valor: string): number | null {
  const m = valor.trim().match(/^(-?[\d.]+)(ms|s)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === "ms" ? n / 1000 : n;
}

/** "cubic-bezier(a, b, c, d)" → [a, b, c, d]. */
export function bezier(valor: string): [number, number, number, number] | null {
  const m = valor.trim().match(/^cubic-bezier\(([^)]+)\)$/);
  if (!m) return null;
  const partes = m[1]!.split(",").map((p) => Number(p.trim()));
  return partes.length === 4 && partes.every(Number.isFinite) ? (partes as [number, number, number, number]) : null;
}

/** Lê os tokens do `:root`. Fora do navegador (SSR) não anima. */
export function transicaoDeTokens(dur: TokenDuracao, easing: TokenEasing): TransicaoMotion {
  if (typeof window === "undefined") return SEM_MOVIMENTO;
  const estilo = getComputedStyle(document.documentElement);
  const duration = segundos(estilo.getPropertyValue(dur));
  const ease = bezier(estilo.getPropertyValue(easing));
  return duration === null || ease === null ? SEM_MOVIMENTO : { duration, ease };
}

const assinarMovimento = (avisar: () => void) => {
  const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  mq?.addEventListener?.("change", avisar);
  return () => mq?.removeEventListener?.("change", avisar);
};

/** Transição do `motion` a partir dos tokens; reage à troca de `prefers-reduced-motion`. */
export function useTransicaoToken(dur: TokenDuracao, easing: TokenEasing = "--easing-standard"): TransicaoMotion {
  const chave = useSyncExternalStore(
    assinarMovimento,
    () => JSON.stringify(transicaoDeTokens(dur, easing)),
    () => JSON.stringify(SEM_MOVIMENTO),
  );
  return JSON.parse(chave) as TransicaoMotion;
}

/** Mesma transição em formato CSS (ex.: dnd-kit): `{ duration: ms, easing: "cubic-bezier(…)" }`. */
export function paraCss(t: TransicaoMotion): { duration: number; easing: string } {
  return { duration: Math.round(t.duration * 1000), easing: `cubic-bezier(${t.ease.join(", ")})` };
}

type DocumentoComTransicao = Document & { startViewTransition?: (atualizar: () => void) => unknown };

/**
 * Aplica uma troca visual global (ex.: tema) com crossfade das View Transitions, quando o navegador
 * suporta e o usuário não pediu menos movimento. Sem suporte, aplica direto (sem flash: o next-themes
 * já desliga as transições de cor durante a troca). Duração e curva vêm do CSS (`--dur-base`).
 */
export function trocarComTransicao(aplicar: () => void): void {
  if (typeof document === "undefined") return aplicar();
  const doc = document as DocumentoComTransicao;
  const reduzido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduzido) return aplicar();
  // flushSync: o React aplica a troca (e seus efeitos) dentro do callback, antes do quadro novo ser capturado.
  doc.startViewTransition(() => flushSync(aplicar));
}
