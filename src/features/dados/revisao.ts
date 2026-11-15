"use client";
/**
 * Revisão global dos dados do mock: toda escrita bem-sucedida (e todo "Desfazer") incrementa o número,
 * e cada consulta montada (`useConsulta`) relê. Assim a tela, os badges da navegação (RF-62) e as
 * notificações (RF-64) refletem a mudança na hora, sem a tela saber quem mais depende do dado.
 */
import { useSyncExternalStore } from "react";

let revisao = 0;
const ouvintes = new Set<() => void>();

export function invalidarDados(): void {
  revisao++;
  ouvintes.forEach((avisar) => avisar());
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  return () => {
    ouvintes.delete(avisar);
  };
}

/** Número que muda a cada escrita. Começa em 0 no servidor e na hidratação. */
export function useRevisaoDados(): number {
  return useSyncExternalStore(
    assinar,
    () => revisao,
    () => 0,
  );
}
