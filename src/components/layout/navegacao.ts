/**
 * Mapa de navegação do shell (REQUISITOS §6, RF-01, RF-61, RF-62). Só apresentação:
 * rótulos, ícones, rotas e trilhas. Os números dos badges vêm do domínio (`contadoresNavegacao`).
 */
import {
  ArrowLeftRight,
  BadgePercent,
  CalendarDays,
  ChartColumn,
  ChartPie,
  Contact,
  FileSignature,
  House,
  LayoutDashboard,
  Megaphone,
  Settings,
  TrendingDown,
  TrendingUp,
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

/** Link folha do menu. */
export type ItemNavegacao = {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  contador?: ContadorNavegacao;
  /** Ativo só na rota exata (ex.: "Visão geral" em `/financeiro`, que não deve ficar ativo em `/financeiro/receitas`). */
  exato?: true;
};

/** Rótulo de seção (não clicável) com os itens que ele agrupa. */
export type GrupoNavegacao = { rotulo: string; itens: readonly ItemNavegacao[] };

/** Item que só abre uma lista de filhos (sem rota própria); fica ativo quando algum filho está. */
export type ItemComSubmenu = { rotulo: string; icone: LucideIcon; filhos: readonly ItemNavegacao[] };

export type EntradaNavegacao = ItemNavegacao | GrupoNavegacao | ItemComSubmenu;

export const ehGrupo = (e: EntradaNavegacao): e is GrupoNavegacao => "itens" in e;
export const ehSubmenu = (e: EntradaNavegacao): e is ItemComSubmenu => "filhos" in e;
export const ehItem = (e: EntradaNavegacao): e is ItemNavegacao => "href" in e;

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Árvore do menu (docs/BRIEF-MENU.md). */
export const NAV_PRINCIPAL: readonly EntradaNavegacao[] = [
  { href: "/", rotulo: "Dashboard", icone: LayoutDashboard },
  {
    rotulo: "Comercial",
    itens: [
      {
        href: "/leads",
        rotulo: "Leads",
        icone: Users,
        contador: { chave: "leadsNovos", tom: "info", descrever: (n) => plural(n, "lead novo", "leads novos") },
      },
      { href: "/agenda", rotulo: "Agenda", icone: CalendarDays },
      { href: "/contatos", rotulo: "Contatos", icone: Contact },
    ],
  },
  {
    rotulo: "Operação",
    itens: [
      { href: "/imoveis", rotulo: "Imóveis", icone: House },
      { href: "/anuncios", rotulo: "Anúncios", icone: Megaphone },
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
    ],
  },
  {
    rotulo: "Financeiro",
    icone: Wallet,
    filhos: [
      { href: "/financeiro", rotulo: "Visão geral", icone: ChartPie, exato: true },
      { href: "/financeiro/receitas", rotulo: "Receitas", icone: TrendingUp },
      { href: "/financeiro/despesas", rotulo: "Despesas", icone: TrendingDown },
      { href: "/financeiro/comissoes", rotulo: "Comissões", icone: BadgePercent },
      { href: "/financeiro/repasses", rotulo: "Repasses", icone: ArrowLeftRight },
    ],
  },
  { href: "/relatorios", rotulo: "Relatórios", icone: ChartColumn },
];

/** Separado no rodapé da sidebar. */
export const NAV_RODAPE: readonly EntradaNavegacao[] = [
  { href: "/configuracoes", rotulo: "Configurações", icone: Settings },
];

/** Referências do time (fora do menu principal; acessíveis pela paleta ⌘K). */
export const NAV_REFERENCIA: readonly ItemNavegacao[] = [
  { href: "/design-system/colors", rotulo: "Design system: cores", icone: ChartPie },
  { href: "/design-system/illustrations", rotulo: "Design system: ilustrações", icone: ChartPie },
];

/** `"/"` só é ativo na raiz; os demais também nas sub-rotas (`/imoveis/123` ativa Imóveis). Com `exato`, só na rota idêntica. */
export function rotaAtiva(pathname: string, href: string, exato = false): boolean {
  if (href === "/" || exato) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const itemAtivo = (pathname: string, item: ItemNavegacao) => rotaAtiva(pathname, item.href, item.exato);

/** O pai de um submenu fica ativo quando algum filho está. */
export const submenuAtivo = (pathname: string, submenu: ItemComSubmenu) =>
  submenu.filhos.some((f) => itemAtivo(pathname, f));

/** Grupo "contém a rota atual" (para abrir por padrão no drawer). */
export const grupoAtivo = (pathname: string, grupo: GrupoNavegacao) => grupo.itens.some((i) => itemAtivo(pathname, i));

/** Item folha para a paleta ⌘K: `rotuloCompleto` desambigua filhos ("Financeiro › Receitas"). */
export type FolhaNavegacao = ItemNavegacao & { rotuloCompleto: string };

/** Lista achatada dos itens folha (links), na ordem do menu. */
export function itensFolha(entradas: readonly EntradaNavegacao[]): FolhaNavegacao[] {
  return entradas.flatMap((e): FolhaNavegacao[] => {
    if (ehGrupo(e)) return e.itens.map((i) => ({ ...i, rotuloCompleto: i.rotulo }));
    if (ehSubmenu(e)) return e.filhos.map((f) => ({ ...f, rotuloCompleto: `${e.rotulo} › ${f.rotulo}` }));
    return [{ ...e, rotuloCompleto: e.rotulo }];
  });
}

/** Folhas do menu principal + rodapé, para a paleta "Ir para". */
export const NAV_FOLHAS: readonly FolhaNavegacao[] = itensFolha([...NAV_PRINCIPAL, ...NAV_RODAPE]);

export type ItemTrilha = { rotulo: string; href?: string };

const MODULOS: Record<
  string,
  { rotulo: string; detalhe: string; novo?: string; semIndice?: true; subs?: Record<string, string> }
> = {
  imoveis: { rotulo: "Imóveis", detalhe: "Imóvel", novo: "Novo imóvel" },
  leads: { rotulo: "Leads", detalhe: "Lead", novo: "Novo lead" },
  contratos: { rotulo: "Contratos", detalhe: "Contrato" },
  agenda: { rotulo: "Agenda", detalhe: "Agenda" },
  contatos: { rotulo: "Contatos", detalhe: "Contato", novo: "Novo contato" },
  anuncios: { rotulo: "Anúncios", detalhe: "Anúncio" },
  relatorios: { rotulo: "Relatórios", detalhe: "Relatórios" },
  financeiro: {
    rotulo: "Financeiro",
    detalhe: "Financeiro",
    subs: { receitas: "Receitas", despesas: "Despesas", comissoes: "Comissões", repasses: "Repasses" },
  },
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
    return { rotulo: modulo?.subs?.[seg] ?? SUBPAGINAS[seg] ?? modulo?.detalhe ?? decodificar(seg), href };
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

/** Rota do detalhe do imóvel: usa o código visível (`/imoveis/AT-0042`), não o id interno. */
export function rotaDoImovel(imovel: { codigo: string }): string {
  return `/imoveis/${imovel.codigo}`;
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
    case "despesa":
      return "/financeiro/despesas";
    case "anuncio":
      return "/anuncios";
    case "negociacao":
      // A referência só traz o id da negociação (as atividades dela apontam para o lead): vai ao quadro.
      return "/leads";
  }
}
