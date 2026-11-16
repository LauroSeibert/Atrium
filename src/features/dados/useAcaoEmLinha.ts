"use client";
/**
 * Ação em linha de lista (pagar, mudar status, marcar visita): uma por vez, em qualquer linha.
 * Estado é união discriminada (qual linha está enviando); enquanto envia, novos acionamentos são ignorados
 * (duplo clique ou outra linha), tanto no estado quanto numa guarda síncrona.
 */
import { useCallback, useRef, useState } from "react";
import type { Escrita } from "@/mocks/services/fakeApi";
import { executarEscrita, type OpcoesEscrita, type ResultadoEscrita } from "./escrita";

export type AcaoEmLinha = { fase: "idle" } | { fase: "enviando"; id: string };

export function useAcaoEmLinha() {
  const [estado, setEstado] = useState<AcaoEmLinha>({ fase: "idle" });
  const ocupado = useRef(false);

  const executar = useCallback(
    async <T>(
      id: string,
      operacao: () => Promise<Escrita<T>>,
      opcoes: OpcoesEscrita<T>,
    ): Promise<ResultadoEscrita<T> | undefined> => {
      if (ocupado.current) return undefined;
      ocupado.current = true;
      setEstado({ fase: "enviando", id });
      try {
        return await executarEscrita(operacao, { erro: "Não foi possível concluir", ...opcoes });
      } finally {
        ocupado.current = false;
        setEstado({ fase: "idle" });
      }
    },
    [],
  );

  return { estado, executar };
}

/** A linha `id` está enviando agora (para o `loading` do botão dela). */
export const enviandoLinha = (estado: AcaoEmLinha, id: string) => estado.fase === "enviando" && estado.id === id;
