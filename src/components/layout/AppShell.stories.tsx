import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import type { Notificacao } from "@/domain";
import { Button } from "../ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card";
import { AppShell } from "./AppShell";
import {
  AGORA,
  AUTORES,
  comTooltips,
  CONTADORES,
  GESTOR,
  hrefDaNotificacao,
  NOTIFICACOES,
  PESSOAS,
  useNavegacaoLocal,
  VIEWPORT_360,
  VIEWPORTS_SHELL,
} from "./historias-shell";
import { MobileNav } from "./MobileNav";
import { trilhaDaRota } from "./navegacao";
import { NotificationCenter } from "./NotificationCenter";
import { PageHeader } from "./PageHeader";
import { PageSkeleton } from "./PageSkeleton";
import { SearchTrigger } from "./SearchTrigger";
import { Sidebar } from "./Sidebar";
import { ThemeSwitch } from "./ThemeSwitch";
import { Topbar } from "./Topbar";
import { UserMenu } from "./UserMenu";

type PainelProps = {
  pathnameInicial?: string;
  recolhidaInicial?: boolean;
  menuAbertoInicial?: boolean;
  carregando?: boolean;
};

/** Painel completo com estado local: tudo por props, sem PainelShell, roteador nem fakeApi. */
function PainelDemonstracao({
  pathnameInicial = "/imoveis",
  recolhidaInicial = false,
  menuAbertoInicial = false,
  carregando = false,
}: PainelProps) {
  const { pathname, capturar } = useNavegacaoLocal(pathnameInicial);
  const [recolhida, setRecolhida] = useState(recolhidaInicial);
  const [menuAberto, setMenuAberto] = useState(menuAbertoInicial);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(NOTIFICACOES);
  const [tema, setTema] = useState<"light" | "dark">("light");

  const trilha = trilhaDaRota(pathname);
  const tela = trilha[trilha.length - 1]!.rotulo;

  return (
    <div onClickCapture={capturar} className="contents">
      <AppShell
        sidebar={
          <Sidebar
            pathname={pathname}
            recolhida={recolhida}
            onAlternarRecolhida={() => setRecolhida((r) => !r)}
            contadores={CONTADORES}
          />
        }
        mobileNav={
          <MobileNav aberto={menuAberto} onAbertoChange={setMenuAberto} pathname={pathname} contadores={CONTADORES} />
        }
        topbar={
          <Topbar
            trilha={trilha}
            onAbrirMenu={() => setMenuAberto(true)}
            menuAberto={menuAberto}
            busca={<SearchTrigger onAbrir={fn()} />}
            notificacoes={
              <NotificationCenter
                estado={{ fase: "success", dados: notificacoes }}
                aberto={notificacoesAbertas}
                onAbertoChange={setNotificacoesAbertas}
                agora={AGORA}
                autores={AUTORES}
                hrefDe={hrefDaNotificacao}
                onMarcarLida={(id) => setNotificacoes((l) => l.map((n) => (n.id === id ? { ...n, lida: true } : n)))}
                onMarcarTodas={() => setNotificacoes((l) => l.map((n) => ({ ...n, lida: true })))}
              />
            }
            tema={<ThemeSwitch temaResolvido={tema} onAlternar={() => setTema(tema === "dark" ? "light" : "dark")} />}
            usuario={
              <UserMenu usuario={{ fase: "success", dados: GESTOR }} personas={PESSOAS} onTrocarPersona={fn()} />
            }
          />
        }
      >
        {carregando ? (
          <PageSkeleton variante="lista" />
        ) : (
          <>
            <PageHeader
              titulo={tela}
              descricao="Conteúdo de demonstração do painel."
              acaoPrimaria={<Button>Nova ação</Button>}
            />
            <Card>
              <CardHeader>
                <CardTitle>Tela aberta: {tela}</CardTitle>
                <CardDescription>Rota atual: {pathname}</CardDescription>
              </CardHeader>
              <CardContent>
                Use o menu lateral, a trilha ou as notificações para trocar de tela. A navegação aqui é só local.
              </CardContent>
            </Card>
          </>
        )}
      </AppShell>
    </div>
  );
}

const meta = {
  title: "Shell/Painel completo",
  component: PainelDemonstracao,
  decorators: [comTooltips],
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/imoveis" } } },
} satisfies Meta<typeof PainelDemonstracao>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};
export const Recolhido: Story = { args: { recolhidaInicial: true } };
export const Mobile: Story = {
  name: "Mobile (360 px)",
  parameters: { viewport: { options: VIEWPORTS_SHELL } },
  globals: { viewport: VIEWPORT_360 },
};
export const MobileComMenuAberto: Story = {
  name: "Mobile com menu aberto",
  args: { menuAbertoInicial: true },
  parameters: { viewport: { options: VIEWPORTS_SHELL } },
  globals: { viewport: VIEWPORT_360 },
};
export const Carregando: Story = { args: { carregando: true } };
