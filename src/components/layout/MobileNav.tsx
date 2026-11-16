"use client";

import type { ContadoresNavegacao } from "@/domain";
import { AtriumLogo } from "../brand/AtriumLogo";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "../ui/Drawer";
import { NAV_PRINCIPAL, NAV_RODAPE, type EntradaNavegacao } from "./navegacao";
import { NavegacaoPrincipal } from "./NavegacaoPrincipal";

export type MobileNavProps = {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  pathname: string;
  contadores?: ContadoresNavegacao;
  itens?: readonly EntradaNavegacao[];
  rodape?: readonly EntradaNavegacao[];
};

/** Navegação em drawer abaixo de 1024 px (RF-01, RF-63). Foco preso no painel, Esc fecha, escolher um item fecha. */
export function MobileNav({
  aberto,
  onAbertoChange,
  pathname,
  contadores,
  itens = NAV_PRINCIPAL,
  rodape = NAV_RODAPE,
}: MobileNavProps) {
  const fechar = () => onAbertoChange(false);
  return (
    <Drawer open={aberto} onOpenChange={onAbertoChange}>
      <DrawerContent side="left" size="sm" className="bg-bg-subtle">
        <div className="flex h-14 shrink-0 items-center px-4 pr-14">
          <DrawerTitle className="sr-only">Menu</DrawerTitle>
          <DrawerDescription className="sr-only">Navegação entre os módulos do Atrium.</DrawerDescription>
          <AtriumLogo aria-hidden="true" className="h-7 w-auto" />
        </div>
        <nav aria-label="Módulos" className="flex-1 overflow-y-auto px-3 py-2">
          <NavegacaoPrincipal
            itens={itens}
            pathname={pathname}
            contadores={contadores}
            onNavegar={fechar}
            tamanho="toque"
            gruposRecolhiveis
          />
        </nav>
        <nav aria-label="Preferências" className="px-3 py-3">
          <NavegacaoPrincipal itens={rodape} pathname={pathname} onNavegar={fechar} tamanho="toque" />
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
