import type { Recurso } from "@/lib/recurso";

/** Dados de um recurso, quando houver (fases `loading` e `error` podem ou não trazê-los). */
export function dadosDe<T>(r: Recurso<T>): T | undefined {
  return r.fase === "idle" ? undefined : r.dados;
}

/** Aplica `f` aos dados do recurso, preservando a fase. */
export function mapear<A, R>(r: Recurso<A>, f: (dados: A) => R): Recurso<R> {
  switch (r.fase) {
    case "idle":
      return r;
    case "loading":
      return { fase: "loading", dados: r.dados === undefined ? undefined : f(r.dados) };
    case "success":
      return { fase: "success", dados: f(r.dados) };
    case "partial":
      return { fase: "partial", dados: f(r.dados), aviso: r.aviso };
    case "error":
      return { fase: "error", erro: r.erro, dados: r.dados === undefined ? undefined : f(r.dados) };
  }
}

/**
 * Junta dois recursos numa visão só: erro sem dados em qualquer um vira erro; só mostra conteúdo
 * quando os dois já têm dados; `loading` em qualquer um mantém a fase de carregamento.
 */
export function combinar<A, B, R>(a: Recurso<A>, b: Recurso<B>, f: (a: A, b: B) => R): Recurso<R> {
  for (const r of [a, b]) if (r.fase === "error" && r.dados === undefined) return { fase: "error", erro: r.erro };
  const da = dadosDe(a);
  const db = dadosDe(b);
  if (da === undefined || db === undefined) return { fase: "loading" };
  const dados = f(da, db);
  return a.fase === "loading" || b.fase === "loading" ? { fase: "loading", dados } : { fase: "success", dados };
}
