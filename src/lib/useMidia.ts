"use client";
import { useSyncExternalStore } from "react";

const assinar = (consulta: string) => (avisar: () => void) => {
  if (typeof window.matchMedia !== "function") return () => {};
  const m = window.matchMedia(consulta);
  m.addEventListener("change", avisar);
  return () => m.removeEventListener("change", avisar);
};
const cache = new Map<string, (avisar: () => void) => () => void>();

/** Media query reativa. No servidor, na hidratação e sem `matchMedia` (jsdom) vale `padrao`. */
export function useMidia(consulta: string, padrao = true): boolean {
  if (!cache.has(consulta)) cache.set(consulta, assinar(consulta));
  return useSyncExternalStore(
    cache.get(consulta)!,
    () => (typeof window.matchMedia === "function" ? window.matchMedia(consulta).matches : padrao),
    () => padrao,
  );
}

/**
 * `true` a partir do breakpoint `md` (48rem = 768 px): tabela; abaixo, cartões. Renderize **um** dos dois,
 * nunca ambos com `hidden` (duplica conteúdo, landmarks e ids no DOM).
 */
export const useTelaLarga = () => useMidia("(min-width: 48rem)");
