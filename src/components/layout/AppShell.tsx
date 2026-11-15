import type { ReactNode } from "react";
import { SkipLink } from "./SkipLink";

export type AppShellProps = {
  /** `<Sidebar>` (aparece a partir de 1024 px). */
  sidebar: ReactNode;
  /** `<Topbar>`. */
  topbar: ReactNode;
  /** `<MobileNav>` (drawer; renderiza por portal). */
  mobileNav?: ReactNode;
  children: ReactNode;
};

/**
 * Esqueleto do painel (Fase 7): skip link, sidebar fixa à esquerda, topbar fixa no topo e área de
 * conteúdo com largura máxima de 1440 px e padding responsivo. Só layout: nada de dados aqui.
 */
export function AppShell({ sidebar, topbar, mobileNav, children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh bg-bg">
      <SkipLink />
      <div className="sticky top-0 hidden h-dvh shrink-0 lg:block">{sidebar}</div>
      {mobileNav}
      <div className="flex min-w-0 flex-1 flex-col">
        {topbar}
        <main
          id="conteudo"
          tabIndex={-1}
          className="mx-auto w-full max-w-360 flex-1 px-4 pt-6 pb-24 outline-none md:px-6 md:pb-8 lg:px-8 lg:pt-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
