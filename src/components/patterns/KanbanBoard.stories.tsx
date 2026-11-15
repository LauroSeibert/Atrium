import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  ETAPAS,
  MOTIVOS_PERDA,
  PERMITIDO,
  podeTransicionarLead,
  transicionarLead,
  type Base,
  type Etapa,
  type Lead,
  type MotivoPerda,
} from "@/domain";
import { AGORA_HISTORIAS, BASE_HISTORIAS, CASOS_HISTORIAS } from "@/mocks/data/historias";
import type { Recurso } from "@/lib/recurso";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/Dialog";
import { KanbanBoard, type MoverLeadEvento } from "./KanbanBoard";
import { MOTIVO_PERDA_ROTULO } from "./rotulos";

const agora = new Date(AGORA_HISTORIAS);
const responsaveis = Object.fromEntries(BASE_HISTORIAS.corretores.map((c) => [c.id, c.nome]));
const ctx = { autorId: BASE_HISTORIAS.corretores[0]!.id, agora: AGORA_HISTORIAS };

const sucesso = (dados: readonly Lead[]): Recurso<readonly Lead[]> => ({ fase: "success", dados });

/** Destinos "Mover para…" vindos do domínio (a UI só pergunta). */
const destinosDe = (base: Base) => (lead: Lead) =>
  ETAPAS.filter((e) => e !== lead.etapa).map((etapa) => ({
    etapa,
    permissao: podeTransicionarLead(base, lead, etapa),
  }));

/** Soltar na própria coluna só reordena (sempre permitido); entre colunas, o domínio decide. */
const podeSoltar = (base: Base) => (leadId: string, para: Etapa) => {
  const lead = base.leads.find((l) => l.id === leadId)!;
  return lead.etapa === para ? PERMITIDO : podeTransicionarLead(base, lead, para);
};

const meta = {
  title: "Padrões/KanbanBoard",
  component: KanbanBoard,
  args: {
    estado: sucesso(BASE_HISTORIAS.leads),
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

/** A "tela" simulada: aplica o movimento com `transicionarLead` e pede o motivo ao ir para "perdido" (RF-32). */
function TelaInterativa({ leadsIniciais }: { leadsIniciais?: readonly Lead[] }) {
  const [base, setBase] = useState<Base>(
    leadsIniciais ? { ...BASE_HISTORIAS, leads: [...leadsIniciais] } : BASE_HISTORIAS,
  );
  const [pendente, setPendente] = useState<MoverLeadEvento | null>(null);
  const [aviso, setAviso] = useState("");

  function aplicar(e: MoverLeadEvento, motivo?: MotivoPerda) {
    try {
      setBase((b) => transicionarLead(b, { leadId: e.leadId, para: e.para, ordem: e.ordem, motivo }, ctx).base);
      setAviso("");
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : "Não foi possível mover.");
    }
  }
  function aoMover(e: MoverLeadEvento) {
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
        estado={sucesso(base.leads)}
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
            <DialogDescription>Informe por que o lead foi perdido para concluir.</DialogDescription>
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
    const longo = BASE_HISTORIAS.leads.find((l) => l.id === CASOS_HISTORIAS.leadNomeLongo)!;
    const semContato = BASE_HISTORIAS.leads.find((l) => l.id === CASOS_HISTORIAS.leadSemContato)!;
    const muitos = Array.from({ length: 30 }, (_, i) => ({
      ...BASE_HISTORIAS.leads[i % BASE_HISTORIAS.leads.length]!,
      id: `lead_extremo${i}`,
      etapa: "novo" as const,
      motivoPerda: null,
      ordem: i,
      orcamento: i === 0 ? 99_999_999_999 : i % 3 === 0 ? null : 1_500_000,
    }));
    return <TelaInterativa leadsIniciais={[longo, semContato, ...muitos]} />;
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
