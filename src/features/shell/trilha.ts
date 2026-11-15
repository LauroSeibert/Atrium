"use client";
/**
 * Rótulo da página atual na trilha (RF-61), definido pela tela quando ela conhece o nome real
 * ("IMV-0012" em vez de "Imóvel"). Amarrado ao pathname: ao navegar, o rótulo antigo deixa de valer.
 */
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { create } from "zustand";

type TrilhaStore = { pathname?: string; rotulo?: string; definir: (pathname: string, rotulo?: string) => void };

export const useTrilhaStore = create<TrilhaStore>((set) => ({
  definir: (pathname, rotulo) => set({ pathname, rotulo }),
}));

/** Use na tela: `<DefinirTrilha rotulo={imovel.codigo} />`. Não renderiza nada. */
export function DefinirTrilha({ rotulo }: { rotulo?: string }) {
  const pathname = usePathname();
  const definir = useTrilhaStore((s) => s.definir);
  useEffect(() => {
    definir(pathname, rotulo);
  }, [definir, pathname, rotulo]);
  return null;
}

export function useRotuloDaTrilha(pathname: string): string | undefined {
  return useTrilhaStore((s) => (s.pathname === pathname ? s.rotulo : undefined));
}
