"use client";
import { useCallback } from "react";
import { useRecurso } from "@/lib/recurso";
import { useRevisaoDados } from "./revisao";

/**
 * Leitura do fakeApi para telas: `useRecurso` (união discriminada, RNF-09) que relê sozinha após
 * qualquer escrita (`invalidarDados`). `carregar` deve ser estável (`useCallback` com os filtros).
 * Busca uma vez ao montar; o refetch mantém os dados visíveis (fase `loading` com `dados`).
 */
export function useConsulta<T>(carregar: () => Promise<T>, parcial?: (dados: T) => string | undefined) {
  const revisao = useRevisaoDados();
  const comRevisao = useCallback(() => {
    void revisao; // a revisão faz parte da identidade da consulta: mudou, relê
    return carregar();
  }, [carregar, revisao]);
  return useRecurso(comRevisao, parcial);
}
