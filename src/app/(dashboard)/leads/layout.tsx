import type { ReactNode } from "react";

/** Quadro (`children`) + detalhe em drawer (`@drawer`, rota interceptada de `[id]`). */
export default function LeadsLayout({ children, drawer }: { children: ReactNode; drawer: ReactNode }) {
  return (
    <>
      {children}
      {drawer}
    </>
  );
}
