/** Só para testes: `next/navigation` com URL em memória que re-renderiza quem usa `useSearchParams`. */
import { useSyncExternalStore } from "react";

let url = "/imoveis";
const ouvintes = new Set<() => void>();
const aviso = () => ouvintes.forEach((f) => f());

export const navegacao = {
  push: (u: string) => {
    url = u;
    aviso();
  },
  replace: (u: string) => {
    url = u;
    aviso();
  },
  back: () => {},
  refresh: () => {},
  prefetch: () => {},
  definirUrl(u: string) {
    url = u;
    aviso();
  },
  url: () => url,
};

const assinar = (f: () => void) => {
  ouvintes.add(f);
  return () => void ouvintes.delete(f);
};

export const moduloNavegacaoFalsa = {
  useRouter: () => navegacao,
  usePathname: () => url.split("?")[0]!,
  useSearchParams: () => {
    const q = useSyncExternalStore(
      assinar,
      () => url.split("?")[1] ?? "",
      () => "",
    );
    return new URLSearchParams(q);
  },
};
