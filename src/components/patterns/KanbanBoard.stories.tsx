import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  destinosNegociacao,
  MOTIVOS_PERDA,
  podeTransicionarNegociacao,
  PERMITIDO,
  transicionarNegociacao,
  type Base,
  type Etapa,
  type MotivoPerda,
} from "@/domain";
import {
  AGORA_HISTORIAS,
  BASE_HISTORIAS,
  CARDS_HISTORIAS,
  CASOS_HISTORIAS,
  cardsDeNegociacao,
} from "@/mocks/data/historias";
import type { Recurso } from "@/lib/recurso";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/Dialog";
import { KanbanBoard, type MoverNegociacaoEvento } from "./KanbanBoard";
import type { NegociacaoCard } from "./LeadCard";
import { MOTIVO_PERDA_ROTULO } from "./rotulos";

const agora = new Date(AGORA_HISTORIAS);
const responsaveis = Object.fromEntries(BASE_HISTORIAS.corretores.map((c) => [c.id, c.nome]));
const ctx = { autorId: BASE_HISTORIAS.corretores[0]!.id, agora: AGORA_HISTORIAS };

const sucesso = (dados: readonly NegociacaoCard[]): Recurso<readonly NegociacaoCard[]> => ({ fase: "success", dados });

/** Destinos "Mover para…" vindos do domínio (a UI só pergunta). */
const destinosDe = (base: Base) => (card: NegociacaoCard) => {
  const n = base.negociacoes.find((x) => x.id === card.id);
  return n ? destinosNegociacao(base, n) : [];
};

/** Soltar na própria coluna só reordena (sempre permitido); entre colunas, o domínio decide. */
const podeSoltar = (base: Base) => (negociacaoId: string, para: Etapa) => {
  const n = base.negociacoes.find((x) => x.id === negociacaoId);
  if (!n) return PERMITIDO; // cards sintéticos das histórias extremas
  return n.etapa === para ? PERMITIDO : podeTransicionarNegociacao(base, n, para);
};

const meta = {
  title: "Padrões/KanbanBoard",
  component: KanbanBoard,
  args: {
    estado: sucesso(CARDS_HISTORIAS),
    responsaveis,
    destinosDe: destinosDe(BASE_HISTORIAS),
    podeSoltar: podeSoltar(BASE_HISTORIAS),
    onMover: fn(),
    onAbrir: fn(),
    onTentarNovamente: fn(),
    agora,
  },
  decorators: [
    (Story) => (
      <div className="p-4 sm:p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof KanbanBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A "tela" simulada: aplica o movimento com `transicionarNegociacao` e pede o motivo ao ir para "perdido" (RF-32). */
function TelaInterativa({ extras = [] }: { extras?: readonly NegociacaoCard[] }) {
  const [base, setBase] = useState<Base>(BASE_HISTORIAS);
  const [pendente, setPendente] = useState<MoverNegociacaoEvento | null>(null);
  const [aviso, setAviso] = useState("");

  function aplicar(e: MoverNegociacaoEvento, motivo?: MotivoPerda) {
    try {
      setBase(
        (b) =>
          transicionarNegociacao(b, { negociacaoId: e.negociacaoId, para: e.para, ordem: e.ordem, motivo }, ctx).base,
      );
      setAviso("");
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : "Não foi possível mover.");
    }
  }
  function aoMover(e: MoverNegociacaoEvento) {
    if (e.para === "perdido") setPendente(e);
    else aplicar(e);
  }

  return (
    <div className="flex flex-col gap-3">
      {aviso ? (
        <p role="alert" className="text-sm text-danger">
          {aviso}
        </p>
      ) : null}
      <KanbanBoard
        estado={sucesso([...cardsDeNegociacao(base), ...extras])}
        responsaveis={responsaveis}
        destinosDe={destinosDe(base)}
        podeSoltar={podeSoltar(base)}
        onMover={aoMover}
        onAbrir={fn()}
        agora={agora}
      />
      <Dialog open={pendente !== null} onOpenChange={(o) => !o && setPendente(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Motivo da perda</DialogTitle>
            <DialogDescription>Informe por que a negociação foi perdida para concluir.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {MOTIVOS_PERDA.map((m) => (
              <Button
                key={m}
                variant="secondary"
                onClick={() => {
                  if (pendente) aplicar(pendente, m);
                  setPendente(null);
                }}
              >
                {MOTIVO_PERDA_ROTULO[m]}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Dados do domínio; a coluna "Contato" está vazia de propósito (caso de borda `etapaVazia`). */
export const Normal: Story = {};

export const Interativo: Story = { render: () => <TelaInterativa /> };

export const Carregando: Story = { args: { estado: { fase: "loading" } } };

export const Vazio: Story = { args: { estado: sucesso([]) } };

export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha de rede") } } };

export const DadosExtremos: Story = {
  render: () => {
    const longo = CARDS_HISTORIAS.find((n) => n.lead.id === CASOS_HISTORIAS.leadNomeLongo)!;
    const muitos = Array.from({ length: 30 }, (_, i) => ({
      ...longo,
      id: `neg_extremo${i}`,
      etapa: "novo" as const,
      motivoPerda: null,
      ordem: 100 + i,
      valor: i === 0 ? 99_999_999_999 : i % 3 === 0 ? null : 1_500_000,
      imovel: i % 4 === 0 ? null : longo.imovel,
    }));
    return <TelaInterativa extras={muitos} />;
  },
};

/** Arrastar com teclado: foque a alça, Espaço pega, setas escolhem a etapa, Espaço solta, Esc cancela. */
export const Teclado: Story = {
  render: () => <TelaInterativa />,
  play: async ({ canvasElement }) => {
    const alca = within(canvasElement).getAllByRole("button", { name: /^Arrastar / })[0]!;
    alca.focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{Escape}");
    await expect(alca).toBeInTheDocument();
  },
};

/** Alternativa sem arrastar (WCAG 2.5.7): menu "Mover para…" no card. */
export const MoverPorMenu: Story = {
  render: () => <TelaInterativa />,
  play: async ({ canvasElement }) => {
    const tela = within(canvasElement);
    await userEvent.click(tela.getAllByRole("button", { name: /^Mover .* para…$/ })[0]!);
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByText("Mover para…")).toBeInTheDocument();
  },
};
