/**
 * Mapa de navegação do shell (REQUISITOS §6, RF-01, RF-61, RF-62). Só apresentação:
 * rótulos, ícones, rotas e trilhas. Os números dos badges vêm do domínio (`contadoresNavegacao`).
 */
import {
  ChartPie,
  FileSignature,
  House,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ContadoresNavegacao, Notificacao, RefEntidade } from "@/domain";
import type { Tom } from "@/components/patterns/rotulos";

export type ContadorNavegacao = {
  chave: keyof ContadoresNavegacao;
  tom: Extract<Tom, "primary" | "danger" | "warning" | "info" | "neutral">;
  /** Texto para leitor de tela e tooltip: "12 leads novos". */
  descrever: (n: number) => string;
};

export type ItemNavegacao = {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  contador?: ContadorNavegacao;
};

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Ordem do menu (Lei de Hick: 5 itens principais). */
export const NAV_PRINCIPAL: readonly ItemNavegacao[] = [
  { href: "/", rotulo: "Dashboard", icone: LayoutDashboard },
  { href: "/imoveis", rotulo: "Imóveis", icone: House },
  {
    href: "/leads",
    rotulo: "Leads",
    icone: Users,
    contador: { chave: "leadsNovos", tom: "info", descrever: (n) => plural(n, "lead novo", "leads novos") },
  },
  {
    href: "/contratos",
    rotulo: "Contratos",
    icone: FileSignature,
    contador: {
      chave: "parcelasAtrasadas",
      tom: "danger",
      descrever: (n) => plural(n, "parcela atrasada", "parcelas atrasadas"),
    },
  },
  { href: "/financeiro", rotulo: "Financeiro", icone: Wallet },
];

/** Separado no rodapé da sidebar. */
export const NAV_RODAPE: readonly ItemNavegacao[] = [
  { href: "/configuracoes", rotulo: "Configurações", icone: Settings },
];

/** Referências do time (fora do menu principal; acessíveis pela paleta ⌘K). */
export const NAV_REFERENCIA: readonly ItemNavegacao[] = [
  { href: "/design-system/colors", rotulo: "Design system: cores", icone: ChartPie },
  { href: "/design-system/illustrations", rotulo: "Design system: ilustrações", icone: ChartPie },
];

/** `"/"` só é ativo na raiz; os demais também nas sub-rotas (`/imoveis/123` ativa Imóveis). */
export function rotaAtiva(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type ItemTrilha = { rotulo: string; href?: string };

const MODULOS: Record<string, { rotulo: string; detalhe: string; novo?: string; semIndice?: true }> = {
  imoveis: { rotulo: "Imóveis", detalhe: "Imóvel", novo: "Novo imóvel" },
  leads: { rotulo: "Leads", detalhe: "Lead", novo: "Novo lead" },
  contratos: { rotulo: "Contratos", detalhe: "Contrato" },
  financeiro: { rotulo: "Financeiro", detalhe: "Financeiro" },
  configuracoes: { rotulo: "Configurações", detalhe: "Configurações" },
  "design-system": { rotulo: "Design system", detalhe: "Referência", semIndice: true },
};

/** `%` malformado na URL não pode derrubar a topbar. */
function decodificar(seg: string): string {
  try {
    return decodeURIComponent(seg);
  } catch {
    return seg;
  }
}

const SUBPAGINAS: Record<string, string> = { editar: "Editar", colors: "Cores", illustrations: "Ilustrações" };

/**
 * Trilha (breadcrumb, RF-61) derivada da rota. O último item é a página atual (sem `href`).
 * `rotuloAtual` substitui o rótulo genérico do segmento dinâmico (ex.: "IMV-0012" em vez de "Imóvel");
 * em `/x/[id]/editar` ele vai para o item do id.
 */
export function trilhaDaRota(pathname: string, rotuloAtual?: string): ItemTrilha[] {
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length === 0) return [{ rotulo: rotuloAtual ?? "Dashboard" }];
  const modulo = MODULOS[segs[0]!];
  let href = "";
  const itens: ItemTrilha[] = segs.map((seg, i) => {
    href += `/${seg}`;
    if (i === 0) return { rotulo: modulo?.rotulo ?? seg, href: modulo?.semIndice ? undefined : href };
    if (seg === "novo" && modulo?.novo) return { rotulo: modulo.novo, href };
    return { rotulo: SUBPAGINAS[seg] ?? modulo?.detalhe ?? decodificar(seg), href };
  });
  if (rotuloAtual && itens.length > 1) {
    const editando = segs[segs.length - 1] === "editar" && itens.length > 2;
    itens[itens.length - (editando ? 2 : 1)]!.rotulo = rotuloAtual;
  }
  delete itens[itens.length - 1]!.href;
  return itens;
}

/** Destino de uma notificação (RF-64): a entidade da atividade ou o contrato da parcela. */
export function rotaDaNotificacao(n: Notificacao): string {
  return n.tipo === "atividade" ? rotaDaEntidade(n.atividade.alvo) : `/contratos/${n.contratoId}`;
}

/** Rota de uma entidade referenciada (notificações, busca, atividades). */
export function rotaDaEntidade(ref: RefEntidade): string {
  switch (ref.tipo) {
    case "imovel":
      return `/imoveis/${ref.id}`;
    case "lead":
      return `/leads/${ref.id}`;
    case "contrato":
      return `/contratos/${ref.id}`;
    default:
      return "/";
  }
}
