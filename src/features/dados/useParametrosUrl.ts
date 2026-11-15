"use client";
/**
 * Estado de tela na URL (RF-06): filtros, ordenação, página e visualização viram query string,
 * então o link é compartilhável e o "voltar" funciona. Usa `router.replace` para digitar na busca
 * sem empilhar histórico; mudanças de filtro voltam para a página 1.
 * Quem usa precisa estar dentro de `<Suspense>` (exigência do `useSearchParams` no Next 16).
 */
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export type Parametros = Record<string, string | string[] | undefined>;

export function useParametrosUrl() {
  const busca = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const ler = useCallback((chave: string) => busca.get(chave) ?? undefined, [busca]);
  const lerLista = useCallback((chave: string) => busca.get(chave)?.split(",").filter(Boolean) ?? [], [busca]);

  /** Aplica as mudanças (valor vazio/undefined remove a chave). `pagina` volta a 1 salvo se vier nas mudanças. */
  const definir = useCallback(
    (mudancas: Parametros, opcoes: { empilhar?: boolean } = {}) => {
      const p = new URLSearchParams(busca.toString());
      for (const [k, v] of Object.entries(mudancas)) {
        const texto = Array.isArray(v) ? v.join(",") : v;
        if (texto === undefined || texto === "") p.delete(k);
        else p.set(k, texto);
      }
      if (!("pagina" in mudancas)) p.delete("pagina");
      const qs = p.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (opcoes.empilhar) router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [busca, pathname, router],
  );

  const limpar = useCallback(
    (manter: string[] = []) => {
      const p = new URLSearchParams();
      for (const k of manter) {
        const v = busca.get(k);
        if (v) p.set(k, v);
      }
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [busca, pathname, router],
  );

  return useMemo(() => ({ busca, ler, lerLista, definir, limpar }), [busca, ler, lerLista, definir, limpar]);
}

/** Espera curta entre teclas para a busca (RF-22). */
export const DEBOUNCE_BUSCA_MS = 250;
