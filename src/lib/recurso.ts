"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Estado assíncrono de tela como UNIÃO DISCRIMINADA (ESTADOS-E-FLUXOS §2 regra 6, §3.5; RNF-09).
 * idle → loading → success | partial | error; error → loading (tentar de novo);
 * success → loading mantendo `dados` (refetch sem piscar).
 */
export type Recurso<T> =
  | { fase: "idle" }
  | { fase: "loading"; dados?: T }
  | { fase: "success"; dados: T }
  | { fase: "partial"; dados: T; aviso: string }
  | { fase: "error"; erro: Error; dados?: T };

export const RECURSO_IDLE: Recurso<never> = { fase: "idle" };

/** Transições puras do estado de tela (testáveis sem React). */
export const recurso = {
  carregar: <T>(r: Recurso<T>): Recurso<T> => ({ fase: "loading", dados: "dados" in r ? r.dados : undefined }),
  sucesso: <T>(dados: T, aviso?: string): Recurso<T> =>
    aviso ? { fase: "partial", dados, aviso } : { fase: "success", dados },
  falha: <T>(r: Recurso<T>, erro: unknown): Recurso<T> => ({
    fase: "error",
    erro: erro instanceof Error ? erro : new Error(String(erro)),
    dados: "dados" in r ? r.dados : undefined,
  }),
};

/**
 * Um único hook por recurso. `carregar` (e `parcial`, se houver) devem ser estáveis: envolva em
 * `useCallback` com as dependências da consulta — mudar a função refaz a busca.
 * `parcial(dados)` devolve um aviso quando os dados vieram incompletos (fase `partial`).
 */
export function useRecurso<T>(carregar: () => Promise<T>, parcial?: (dados: T) => string | undefined) {
  const [estado, setEstado] = useState<Recurso<T>>(RECURSO_IDLE);
  const chamada = useRef(0);

  const executar = useCallback(() => {
    const minha = ++chamada.current;
    // Em microtarefa: o efeito não chama setState de forma síncrona (react-hooks/set-state-in-effect).
    Promise.resolve()
      .then(() => {
        if (minha === chamada.current) setEstado((r) => recurso.carregar(r));
        return carregar();
      })
      .then(
        (dados) => {
          if (minha === chamada.current) setEstado(recurso.sucesso(dados, parcial?.(dados)));
        },
        (erro) => {
          if (minha === chamada.current) setEstado((r) => recurso.falha(r, erro));
        },
      );
  }, [carregar, parcial]);

  useEffect(() => {
    executar();
    const ref = chamada;
    return () => {
      ref.current++; // descarta resposta atrasada de um efeito anterior
    };
  }, [executar]);

  return { estado, recarregar: executar };
}

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
