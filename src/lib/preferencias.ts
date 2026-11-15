"use client";
/**
 * Preferências de interface persistidas no navegador (RNF-16): sidebar recolhida, densidade, visualização…
 * Tolerante a falhas: em modo privado/storage bloqueado, vale o padrão e nada quebra.
 * Tema NÃO passa por aqui: é do next-themes (RF-03).
 */
import { useCallback, useSyncExternalStore } from "react";

const PREFIXO = "atrium:";
const EVENTO = "atrium:preferencia";

/** Último valor escrito em cada chave: vale quando o localStorage falha (modo privado, cota, bloqueio). */
const memoria = new Map<string, unknown>();

export function lerPreferencia<T>(chave: string, padrao: T): T {
  // O que foi escrito nesta aba vale primeiro: cobre setItem que falha (cota, Safari privado) com getItem que não falha.
  if (memoria.has(chave)) return memoria.get(chave) as T;
  try {
    const bruto = window.localStorage.getItem(PREFIXO + chave);
    return bruto === null ? padrao : (JSON.parse(bruto) as T);
  } catch {
    return memoria.has(chave) ? (memoria.get(chave) as T) : padrao;
  }
}

export function gravarPreferencia<T>(chave: string, valor: T): void {
  try {
    window.localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch {
    // storage indisponível: a preferência vale só nesta aba (evento abaixo)
  }
  memoria.set(chave, valor);
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: chave }));
}

function assinar(avisar: () => void) {
  const deOutraAba = (e: StorageEvent) => {
    if (e.key?.startsWith(PREFIXO)) memoria.delete(e.key.slice(PREFIXO.length));
    avisar();
  };
  window.addEventListener("storage", deOutraAba);
  window.addEventListener(EVENTO, avisar);
  return () => {
    window.removeEventListener("storage", deOutraAba);
    window.removeEventListener(EVENTO, avisar);
  };
}

/**
 * `[valor, definir]` de uma preferência. No servidor e na hidratação vale `padrao`
 * (sem divergência de HTML); depois, o valor salvo. Use só valores serializáveis em JSON e primitivos.
 */
export function usePreferencia<T extends string | number | boolean>(chave: string, padrao: T) {
  const valor = useSyncExternalStore(
    assinar,
    () => lerPreferencia(chave, padrao),
    () => padrao,
  );
  const definir = useCallback((novo: T) => gravarPreferencia(chave, novo), [chave]);
  return [valor, definir] as const;
}
