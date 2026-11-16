"use client";
/**
 * Contêiner do shell (Fase 7): liga os componentes de `src/components/layout` (que só recebem props)
 * ao roteador, ao tema (next-themes), às preferências persistidas e ao fakeApi.
 * Nenhuma regra de negócio aqui: contadores e notificações vêm prontos do domínio via fakeApi
 * e são relidos após cada escrita (`invalidarDados`), não a cada navegação.
 */
import { FilePlus, FileSignature, House, Moon, PanelLeft, Sun, UserPlus, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MobileNav } from "@/components/layout/MobileNav";
import {
  NAV_FOLHAS,
  NAV_REFERENCIA,
  rotaDaNotificacao,
  type ItemNavegacao,
  trilhaDaRota,
  rotaDoImovel,
} from "@/components/layout/navegacao";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { SearchTrigger } from "@/components/layout/SearchTrigger";
import { Sidebar } from "@/components/layout/Sidebar";
import { proximoTema, temaDoSistema, ThemeSwitch } from "@/components/layout/ThemeSwitch";
import { Topbar } from "@/components/layout/Topbar";
import { UserMenu } from "@/components/layout/UserMenu";
import {
  CommandPalette,
  useAtalhoPaleta,
  type GrupoPaleta,
  type ItemPaleta,
} from "@/components/patterns/CommandPalette";
import { Toaster } from "@/components/ui/Toast";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { trocarComTransicao } from "@/lib/motion";
import { useRecurso, type Recurso } from "@/lib/recurso";
import { fakeApi } from "@/mocks/services/fakeApi";
import { invalidarDados } from "@/features/dados/revisao";
import { useConsulta } from "@/features/dados/useConsulta";
import { COOKIE_SIDEBAR } from "./cookies";
import { useRotuloDaTrilha } from "./trilha";

const assinarNada = () => () => {};
const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/** Busca remota da paleta com espera curta entre teclas (evita uma chamada por letra). */
function useBuscaGlobal(termo: string) {
  const [termoEstavel, setTermoEstavel] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setTermoEstavel(termo), 200);
    return () => clearTimeout(t);
  }, [termo]);
  const buscar = useCallback(
    (): ReturnType<typeof fakeApi.search> =>
      normalizar(termoEstavel).length < 2
        ? Promise.resolve({ imoveis: [], leads: [], contratos: [] })
        : fakeApi.search(termoEstavel),
    [termoEstavel],
  );
  const recurso = useRecurso(buscar);
  // Enquanto a digitação não assenta, mostra "Buscando…" em vez do resultado do termo anterior.
  const assentado = normalizar(termo) === normalizar(termoEstavel);
  const estado: typeof recurso.estado = assentado ? recurso.estado : { fase: "loading" };
  return { ...recurso, estado };
}

/** Cookie espelho da preferência, lido no servidor para a sidebar já nascer recolhida (sem piscar). */

export function PainelShell({
  children,
  recolhidaInicial = false,
}: {
  children: ReactNode;
  recolhidaInicial?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const rotuloAtual = useRotuloDaTrilha(pathname);
  // Fonte única: o cookie, lido no servidor. Assim o HTML já chega com a sidebar no estado certo
  // e nada muda depois da hidratação (antes o localStorage podia divergir e a sidebar "encolhia" ao carregar).
  const [recolhida, setRecolhidaEstado] = useState(recolhidaInicial);
  const setRecolhida = useCallback((v: boolean) => {
    setRecolhidaEstado(v);
    document.cookie = `${COOKIE_SIDEBAR}=${v ? 1 : 0}; path=/; max-age=31536000; samesite=lax`;
  }, []);
  const [menuAberto, setMenuAberto] = useState(false);
  const [paletaAberta, setPaletaAberta] = useState(false);
  const [busca, setBusca] = useState("");

  // Tema (RF-03): next-themes persiste; só é conhecido depois de montar.
  const { resolvedTheme, setTheme } = useTheme();
  const montado = useSyncExternalStore(
    assinarNada,
    () => true,
    () => false,
  );
  // Um clique alterna claro/escuro; se o novo tema for o do sistema, volta a seguir o sistema.
  const alternarTema = useCallback(
    () => trocarComTransicao(() => setTheme(proximoTema(resolvedTheme === "dark" ? "dark" : "light", temaDoSistema()))),
    [resolvedTheme, setTheme],
  );

  // Dados do shell
  // Dados do shell: buscados uma vez ao montar e relidos após cada escrita das telas (invalidarDados).
  const perfil = useConsulta(useCallback(() => fakeApi.getPerfil(), []));
  const corretores = useConsulta(useCallback(() => fakeApi.listCorretores(), []));
  const notificacoes = useConsulta(useCallback(() => fakeApi.listNotificacoes(), []));
  const contadores = useConsulta(useCallback(() => fakeApi.getContadoresNavegacao(), []));
  const resultados = useBuscaGlobal(busca);

  const dadosContadores = "dados" in contadores.estado ? contadores.estado.dados : undefined;
  const autores = useMemo(() => {
    const lista = "dados" in corretores.estado ? (corretores.estado.dados ?? []) : [];
    return Object.fromEntries(lista.map((c) => [c.id, c.nome]));
  }, [corretores.estado]);

  const ir = useCallback((href: string) => router.push(href), [router]);
  useAtalhoPaleta(() => setPaletaAberta(true));

  const grupos = useMemo<GrupoPaleta[]>(() => {
    const doMenu = (itens: readonly (ItemNavegacao & { rotuloCompleto?: string })[]): ItemPaleta[] =>
      itens.map((i) => ({
        id: i.href,
        rotulo: i.rotuloCompleto ?? i.rotulo,
        icone: i.icone,
        onSelect: () => ir(i.href),
      }));
    const estaticos: GrupoPaleta[] = [
      {
        id: "acoes",
        rotulo: "Ações",
        itens: [
          { id: "novo-imovel", rotulo: "Novo imóvel", icone: FilePlus, onSelect: () => ir("/imoveis/novo") },
          { id: "novo-lead", rotulo: "Novo lead", icone: UserPlus, onSelect: () => ir("/leads?novo=1") },
          {
            id: "tema",
            rotulo: resolvedTheme === "dark" ? "Usar tema claro" : "Usar tema escuro",
            icone: resolvedTheme === "dark" ? Sun : Moon,
            onSelect: alternarTema,
          },
          {
            id: "menu",
            rotulo: recolhida ? "Expandir menu lateral" : "Recolher menu lateral",
            icone: PanelLeft,
            onSelect: () => setRecolhida(!recolhida),
          },
        ],
      },
      { id: "ir", rotulo: "Ir para", itens: doMenu([...NAV_FOLHAS, ...NAV_REFERENCIA]) },
    ];
    // Com busca remota a paleta não filtra sozinha: filtramos os grupos fixos aqui.
    const termo = normalizar(busca);
    const fixos = termo
      ? estaticos
          .map((g) => ({ ...g, itens: g.itens.filter((i) => normalizar(i.rotulo).includes(termo)) }))
          .filter((g) => g.itens.length > 0)
      : estaticos;
    const r = resultados.estado.fase === "success" ? resultados.estado.dados : undefined;
    if (!r || termo.length < 2) return fixos;
    const remotos: GrupoPaleta[] = [
      {
        id: "imoveis",
        rotulo: "Imóveis",
        itens: r.imoveis.map((i) => ({
          id: i.id,
          rotulo: i.titulo,
          descricao: i.codigo,
          icone: House,
          onSelect: () => ir(rotaDoImovel(i)),
        })),
      },
      {
        id: "leads",
        rotulo: "Leads",
        itens: r.leads.map((l) => ({ id: l.id, rotulo: l.nome, icone: Users, onSelect: () => ir(`/leads/${l.id}`) })),
      },
      {
        id: "contratos",
        rotulo: "Contratos",
        itens: r.contratos.map((c) => ({
          id: c.id,
          rotulo: c.numero,
          icone: FileSignature,
          onSelect: () => ir(`/contratos/${c.id}`),
        })),
      },
    ].filter((g) => g.itens.length > 0);
    return [...remotos, ...fixos];
  }, [busca, resultados.estado, ir, resolvedTheme, alternarTema, recolhida, setRecolhida]);

  const estadoBusca: Recurso<unknown> | undefined = normalizar(busca).length >= 2 ? resultados.estado : undefined;

  return (
    <TooltipProvider>
      <AppShell
        sidebar={
          <Sidebar
            pathname={pathname}
            recolhida={recolhida}
            onAlternarRecolhida={() => setRecolhida(!recolhida)}
            contadores={dadosContadores}
          />
        }
        sidebarCompacta={
          <Sidebar pathname={pathname} recolhida fixa onAlternarRecolhida={() => {}} contadores={dadosContadores} />
        }
        mobileNav={
          <MobileNav
            aberto={menuAberto}
            onAbertoChange={setMenuAberto}
            pathname={pathname}
            contadores={dadosContadores}
          />
        }
        topbar={
          <Topbar
            trilha={trilhaDaRota(pathname, rotuloAtual)}
            onAbrirMenu={() => setMenuAberto(true)}
            menuAberto={menuAberto}
            busca={<SearchTrigger onAbrir={() => setPaletaAberta(true)} />}
            notificacoes={
              <NotificationCenter
                estado={notificacoes.estado}
                onTentarNovamente={notificacoes.recarregar}
                onAbertoChange={(aberto) => aberto && notificacoes.recarregar()}
                onMarcarLida={(id) => void fakeApi.marcarLida(id).then(invalidarDados)}
                onMarcarTodas={() => void fakeApi.marcarLida("todas").then(invalidarDados)}
                hrefDe={rotaDaNotificacao}
                autores={autores}
              />
            }
            tema={
              <ThemeSwitch
                temaResolvido={montado ? (resolvedTheme as "light" | "dark") : undefined}
                onAlternar={alternarTema}
              />
            }
            usuario={
              <UserMenu
                usuario={perfil.estado}
                personas={"dados" in corretores.estado ? corretores.estado.dados : undefined}
                onTrocarPersona={(id) => void fakeApi.setUsuarioAtual(id).then(invalidarDados)}
              />
            }
          />
        }
      >
        {children}
      </AppShell>
      <CommandPalette
        aberto={paletaAberta}
        onAbertoChange={(a) => {
          setPaletaAberta(a);
          if (!a) setBusca("");
        }}
        grupos={grupos}
        estado={estadoBusca}
        onTentarNovamente={resultados.recarregar}
        onBuscaChange={setBusca}
      />
      <Toaster />
    </TooltipProvider>
  );
}
