import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { TelaAgenda } from "@/features/agenda/TelaAgenda";
import { TelaAnuncios } from "@/features/anuncios/TelaAnuncios";
import { TelaContatos } from "@/features/contatos/TelaContatos";
import { TelaComissoes } from "@/features/financeiro/TelaComissoes";
import { TelaDespesas } from "@/features/financeiro/TelaDespesas";
import { TelaReceitas } from "@/features/financeiro/TelaReceitas";
import { TelaRepasses } from "@/features/financeiro/TelaRepasses";
import { TelaRelatorios } from "@/features/relatorios/TelaRelatorios";
import { TelaConfiguracoes } from "@/features/configuracoes/TelaConfiguracoes";
import { TelaContrato } from "@/features/contratos/TelaContrato";
import { TelaContratos } from "@/features/contratos/TelaContratos";
import { TelaDashboard } from "@/features/dashboard/TelaDashboard";
import { TelaFinanceiro } from "@/features/financeiro/TelaFinanceiro";
import { TelaFormImovel } from "@/features/imoveis/TelaFormImovel";
import { TelaImovel } from "@/features/imoveis/TelaImovel";
import { TelaImoveis } from "@/features/imoveis/TelaImoveis";
import { TelaLead } from "@/features/leads/TelaLead";
import { TelaLeads } from "@/features/leads/TelaLeads";
import { PainelShell } from "@/features/shell/PainelShell";
import { fakeApi } from "@/mocks/services/fakeApi";

/**
 * Telas da Fase 8 dentro do shell, com o fakeApi de verdade rodando no navegador (latência e
 * persistência no localStorage). No catálogo não há roteador: links e filtros na URL não navegam;
 * o resto (mover lead, registrar pagamento, formulários, toasts e Desfazer) funciona.
 */
const meta = {
  title: "Telas",
  // O axe das telas roda no e2e do app (e2e/fluxos.spec.ts), com dados carregados e nos dois temas.
  tags: ["skip-a11y"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function tela(pathname: string, conteudo: (loaded: Record<string, string>) => ReactNode): Story {
  return {
    parameters: { nextjs: { navigation: { pathname } } },
    render: (_args, { loaded }) => <PainelShell>{conteudo(loaded as Record<string, string>)}</PainelShell>,
  };
}

const idImovel = async () => ({ id: (await fakeApi.listImoveis({}, { pagina: 1, porPagina: 1 })).itens[0]!.id });
const idLead = async () => ({ id: (await fakeApi.listLeads({ etapas: ["visita"] }))[0]!.id });
const idContrato = async () => ({
  id: (await fakeApi.listContratos({ status: ["ativo"] }, { pagina: 1, porPagina: 1 })).itens[0]!.contrato.id,
});

export const Dashboard = tela("/", () => <TelaDashboard />);
export const Imoveis = { ...tela("/imoveis", () => <TelaImoveis />), name: "Imóveis" };
export const Imovel = {
  ...tela("/imoveis/x", (l) => <TelaImovel id={l.id!} />),
  name: "Imóvel",
  loaders: [idImovel],
};
export const NovoImovel = { ...tela("/imoveis/novo", () => <TelaFormImovel />), name: "Novo imóvel" };
export const Leads = tela("/leads", () => <TelaLeads />);
export const Agenda = tela("/agenda", () => <TelaAgenda />);
export const Contatos = tela("/contatos", () => <TelaContatos />);
export const Anuncios = { ...tela("/anuncios", () => <TelaAnuncios />), name: "Anúncios" };
export const Lead = { ...tela("/leads/x", (l) => <TelaLead id={l.id!} modo="pagina" />), loaders: [idLead] };
export const Contratos = tela("/contratos", () => <TelaContratos />);
export const Contrato = { ...tela("/contratos/x", (l) => <TelaContrato id={l.id!} />), loaders: [idContrato] };
export const Financeiro = tela("/financeiro", () => <TelaFinanceiro />);
export const Receitas = tela("/financeiro/receitas", () => <TelaReceitas />);
export const Despesas = tela("/financeiro/despesas", () => <TelaDespesas />);
export const Comissoes = { ...tela("/financeiro/comissoes", () => <TelaComissoes />), name: "Comissões" };
export const Repasses = tela("/financeiro/repasses", () => <TelaRepasses />);
export const Relatorios = { ...tela("/relatorios", () => <TelaRelatorios />), name: "Relatórios" };
export const Configuracoes = { ...tela("/configuracoes", () => <TelaConfiguracoes />), name: "Configurações" };
