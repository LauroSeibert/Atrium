import type { ReactNode } from "react";
import { SkipLink } from "./SkipLink";

export type AppShellProps = {
  /** `<Sidebar>` completa (a partir de 1024 px). */
  sidebar: ReactNode;
  /** `<Sidebar recolhida fixa>`: trilho de ícones no tablet (768–1023 px). Sem ele, o tablet usa a gaveta. */
  sidebarCompacta?: ReactNode;
  /** `<Topbar>`. */
  topbar: ReactNode;
  /** `<MobileNav>` (drawer; renderiza por portal). */
  mobileNav?: ReactNode;
  children: ReactNode;
};

/**
 * Esqueleto do painel (Fase 7): skip link, sidebar fixa à esquerda, topbar fixa no topo e área de
 * conteúdo com largura máxima de 1280 px e padding responsivo. Só layout: nada de dados aqui.
 */
export function AppShell({ sidebar, sidebarCompacta, topbar, mobileNav, children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh bg-bg">
      <SkipLink />
      {sidebarCompacta ? (
        <div className="sticky top-0 hidden h-dvh shrink-0 md:block lg:hidden">{sidebarCompacta}</div>
      ) : null}
      <div className="sticky top-0 hidden h-dvh shrink-0 lg:block">{sidebar}</div>
      {mobileNav}
      <div className="flex min-w-0 flex-1 flex-col">
        {topbar}
        <main
          id="conteudo"
          tabIndex={-1}
          className="mx-auto w-full max-w-320 flex-1 px-4 pt-6 pb-24 outline-none md:px-8 md:pt-8 md:pb-12 xl:px-10 xl:pt-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
