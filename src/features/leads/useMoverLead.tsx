"use client";
/**
 * Mover lead de etapa (RF-31, RF-32, RF-39), compartilhado entre o kanban/lista e o detalhe.
 * A tela só pergunta ao domínio (`exigeMotivo` vem de `destinosLead`, via fakeApi.listLeads) e chama o fakeApi,
 * que chama `transicionarLead`. Aqui ficam só os diálogos: motivo da perda e vínculo opcional de contrato.
 */
import { useState, type ReactNode } from "react";
import { MOTIVOS_PERDA, type Etapa, type Lead, type MotivoPerda } from "@/domain";
import { ConfirmDestructive, type FaseConfirmacao } from "@/components/patterns/ConfirmDestructive";
import { ETAPA_UI, MOTIVO_PERDA_ROTULO } from "@/components/patterns/rotulos";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { fakeApi } from "@/mocks/services/fakeApi";
import { executarEscrita, useEscrita } from "@/features/dados/escrita";

export type PedidoMover = { lead: Lead; para: Etapa; ordem?: number; exigeMotivo: boolean };
type CandidatoContrato = { id: string; rotulo: string };

export function useMoverLead() {
  const [pedido, setPedido] = useState<PedidoMover | null>(null);
  const [fase, setFase] = useState<FaseConfirmacao>({ fase: "idle" });
  const [vinculo, setVinculo] = useState<{ lead: Lead; candidatos: CandidatoContrato[] } | null>(null);

  async function ofertarVinculo(lead: Lead) {
    // RF-39 (opcional): contratos existentes dos imóveis do lead que o domínio aceita vincular.
    const vinculaveis = await fakeApi.listContratosVinculaveis(lead.id).catch(() => []);
    const candidatos = vinculaveis.map((c) => ({
      id: c.id,
      rotulo: `${c.numero}${c.imovel ? ` · ${c.imovel.codigo}` : ""}`,
    }));
    if (candidatos.length > 0) setVinculo({ lead, candidatos });
  }

  async function aplicar(p: PedidoMover, motivo?: MotivoPerda): Promise<boolean> {
    const { lead, para, ordem } = p;
    const r = await executarEscrita(() => fakeApi.moveLead(lead.id, para, ordem, motivo), {
      sucesso: para === lead.etapa ? "Ordem atualizada" : `${lead.nome} movido para ${ETAPA_UI[para].rotulo}`,
      silenciarErro: p.exigeMotivo,
    });
    if (r.fase === "erro") {
      if (p.exigeMotivo) setFase({ fase: "erro", mensagem: r.erro.message });
      return false;
    }
    void ofertarVinculo(r.resultado);
    return true;
  }

  /** Ponto de entrada único: arrastar, menu "Mover para…" e teclado. */
  function mover(lead: Lead, para: Etapa, ordem: number | undefined, exigeMotivo: boolean) {
    if (exigeMotivo) {
      setFase({ fase: "idle" });
      setPedido({ lead, para, ordem, exigeMotivo });
      return;
    }
    void aplicar({ lead, para, ordem, exigeMotivo });
  }

  async function confirmarMotivo(motivo?: string) {
    if (!pedido) return;
    setFase({ fase: "confirmando" });
    const ok = await aplicar(pedido, motivo as MotivoPerda);
    if (ok) {
      setPedido(null);
      setFase({ fase: "idle" });
    }
  }

  const dialogos: ReactNode = (
    <>
      <ConfirmDestructive
        aberto={pedido !== null}
        onAbertoChange={(a) => {
          if (!a) setPedido(null);
        }}
        titulo={pedido ? `Marcar ${pedido.lead.nome} como perdido?` : "Marcar como perdido?"}
        impactos={[
          "O lead sai do funil ativo e vai para a coluna Perdido.",
          "O motivo fica registrado na linha do tempo.",
        ]}
        motivo={{
          tipo: "select",
          rotulo: "Motivo da perda",
          obrigatorio: true,
          mensagemObrigatorio: "Informe o motivo da perda.",
          opcoes: MOTIVOS_PERDA.map((m) => ({ value: m, label: MOTIVO_PERDA_ROTULO[m] })),
        }}
        rotuloConfirmar="Marcar como perdido"
        fase={fase}
        onConfirmar={(m) => void confirmarMotivo(m)}
      />
      {vinculo ? <DialogoVinculo key={vinculo.lead.id} {...vinculo} onFechar={() => setVinculo(null)} /> : null}
    </>
  );

  return { mover, dialogos };
}

function DialogoVinculo({
  lead,
  candidatos,
  onFechar,
}: {
  lead: Lead;
  candidatos: CandidatoContrato[];
  onFechar: () => void;
}) {
  const [contratoId, setContratoId] = useState(candidatos[0]!.id);
  const { estado, executar } = useEscrita();
  async function vincular() {
    const r = await executar(() => fakeApi.vincularContrato(lead.id, contratoId), {
      sucesso: "Contrato vinculado ao lead",
      silenciarErro: true,
    });
    if (r.fase === "ok") onFechar();
  }
  return (
    <Dialog open onOpenChange={(a) => !a && estado.fase !== "enviando" && onFechar()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Vincular contrato?</DialogTitle>
          <DialogDescription>Ligue {lead.nome} a um contrato existente.</DialogDescription>
        </DialogHeader>
        <Field label="Contrato" requirement="optional">
          <Select
            value={contratoId}
            onValueChange={setContratoId}
            options={candidatos.map((c) => ({ value: c.id, label: c.rotulo }))}
          />
        </Field>
        {estado.fase === "erro" ? (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            {estado.mensagem}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="secondary" onClick={onFechar} disabled={estado.fase === "enviando"}>
            Agora não
          </Button>
          <Button loading={estado.fase === "enviando"} onClick={() => void vincular()}>
            Vincular contrato
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
