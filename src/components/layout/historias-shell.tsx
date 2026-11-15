/**
 * Apoio das histórias do shell (Fase 7): dados do mock, decorators e navegação local.
 * Não é uma história (fora do padrão `*.stories.tsx`). Só props e mock; nenhuma regra de negócio.
 */
import type { Decorator } from "@storybook/nextjs-vite";
import { useState, type MouseEvent } from "react";
import { contadoresNavegacao, listarNotificacoes, type Notificacao } from "@/domain";
import { AGORA_HISTORIAS, BASE_HISTORIAS } from "@/mocks/data/historias";
import { TooltipProvider } from "../ui/Tooltip";

export const AGORA = new Date(AGORA_HISTORIAS);

export const GESTOR = BASE_HISTORIAS.corretores.find((c) => c.papel === "gestor")!;
export const PESSOAS = BASE_HISTORIAS.corretores.filter((c) => c.ativo).slice(0, 6);
export const AUTORES: Record<string, string> = Object.fromEntries(BASE_HISTORIAS.corretores.map((c) => [c.id, c.nome]));

export const CONTADORES = contadoresNavegacao(BASE_HISTORIAS, AGORA_HISTORIAS);
export const NOTIFICACOES: Notificacao[] = listarNotificacoes(BASE_HISTORIAS, AGORA_HISTORIAS, GESTOR.id, []);

export { rotaDaNotificacao as hrefDaNotificacao } from "./navegacao";

/** Viewport de 360 px (o menor suportado, RNF-04). Use com `globals: { viewport: VIEWPORT_360 }`. */
export const VIEWPORTS_SHELL = {
  m360: { name: "Mobile 360", styles: { width: "360px", height: "800px" }, type: "mobile" },
} as const;
export const VIEWPORT_360 = { value: "m360", isRotated: false } as const;

/** `Tooltip` exige o provider que, no app, fica no layout (PainelShell). */
export const comTooltips: Decorator = (Story) => (
  <TooltipProvider>
    <Story />
  </TooltipProvider>
);

/** Widgets soltos (sino, menus) precisam de um landmark `main` para a regra `region` do axe. */
export function emMain(classe = "flex min-h-80 justify-end p-6"): Decorator {
  return function EmMain(Story) {
    return (
      <main className={classe}>
        <Story />
      </main>
    );
  };
}

/**
 * Navegação local das histórias: um clique em `<a>` interno troca o pathname em vez de navegar
 * (usado em `onClickCapture` no contêiner; vale também para portais, pois o React propaga por eles).
 */
export function useNavegacaoLocal(inicial: string) {
  const [pathname, setPathname] = useState(inicial);
  const capturar = (e: MouseEvent<HTMLElement>) => {
    const a = (e.target as HTMLElement).closest("a");
    const href = a?.getAttribute("href");
    if (a && href?.startsWith("/")) {
      e.preventDefault();
      setPathname(href.split("?")[0]!);
    }
  };
  return { pathname, capturar };
}
