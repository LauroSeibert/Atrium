"use client";
/**
 * Mover negociação de etapa (RF-31, RF-32, RF-39, RF-70), compartilhado entre o kanban/lista e o detalhe do lead.
 * A tela só pergunta ao domínio (`exigeMotivo` vem de `destinosNegociacao`, via fakeApi) e chama o fakeApi,
 * que chama `transicionarNegociacao`. Aqui ficam só os diálogos: motivo da perda e vínculo opcional de contrato.
 */
import { useState, type ReactNode } from "react";
import { MOTIVOS_PERDA, type Etapa, type MotivoPerda } from "@/domain";
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

/** O que o diálogo precisa saber da negociação movida. `rotulo` = "Lead (AT-0001)". */
export type NegociacaoMovel = { id: string; etapa: Etapa; rotulo: string };
export type PedidoMover = { negociacao: NegociacaoMovel; para: Etapa; ordem?: number; exigeMotivo: boolean };
type CandidatoContrato = { id: string; rotulo: string };

export function useMoverNegociacao() {
  const [pedido, setPedido] = useState<PedidoMover | null>(null);
  const [fase, setFase] = useState<FaseConfirmacao>({ fase: "idle" });
  const [vinculo, setVinculo] = useState<{ negociacao: NegociacaoMovel; candidatos: CandidatoContrato[] } | null>(null);

  async function ofertarVinculo(negociacao: NegociacaoMovel) {
    // RF-39 (opcional): contratos existentes do imóvel da negociação que o domínio aceita vincular.
    const vinculaveis = await fakeApi.contratosVinculaveis(negociacao.id).catch(() => []);
    const candidatos = vinculaveis.map((c) => ({
      id: c.id,
      rotulo: `${c.numero}${c.imovel ? ` · ${c.imovel.codigo}` : ""}`,
    }));
    if (candidatos.length > 0) setVinculo({ negociacao, candidatos });
  }

  async function aplicar(p: PedidoMover, motivo?: MotivoPerda): Promise<boolean> {
    const { negociacao, para, ordem } = p;
    const r = await executarEscrita(() => fakeApi.moverNegociacao(negociacao.id, para, ordem, motivo), {
      sucesso:
        para === negociacao.etapa ? "Ordem atualizada" : `${negociacao.rotulo} movido para ${ETAPA_UI[para].rotulo}`,
      silenciarErro: p.exigeMotivo,
    });
    if (r.fase === "erro") {
      if (p.exigeMotivo) setFase({ fase: "erro", mensagem: r.erro.message });
      return false;
    }
    // O domínio decide se há contrato vinculável; o diálogo só aparece se vier algum.
    void ofertarVinculo({ ...negociacao, etapa: r.resultado.etapa });
    return true;
  }

  /** Ponto de entrada único: arrastar, menu "Mover para…" e teclado. */
  function mover(negociacao: NegociacaoMovel, para: Etapa, ordem: number | undefined, exigeMotivo: boolean) {
    if (exigeMotivo) {
      setFase({ fase: "idle" });
      setPedido({ negociacao, para, ordem, exigeMotivo });
      return;
    }
    void aplicar({ negociacao, para, ordem, exigeMotivo });
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
        titulo={pedido ? `Marcar ${pedido.negociacao.rotulo} como perdido?` : "Marcar como perdido?"}
        impactos={[
          "A negociação sai do funil ativo e vai para a coluna Perdido. As outras negociações do lead continuam.",
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
      {vinculo ? <DialogoVinculo key={vinculo.negociacao.id} {...vinculo} onFechar={() => setVinculo(null)} /> : null}
    </>
  );

  /** "Vincular contrato" direto (detalhe do lead), sem mover. */
  const vincular = (negociacao: NegociacaoMovel) => void ofertarVinculo(negociacao);

  return { mover, vincular, dialogos };
}

function DialogoVinculo({
  negociacao,
  candidatos,
  onFechar,
}: {
  negociacao: NegociacaoMovel;
  candidatos: CandidatoContrato[];
  onFechar: () => void;
}) {
  const [contratoId, setContratoId] = useState(candidatos[0]!.id);
  const { estado, executar } = useEscrita();
  async function vincular() {
    const r = await executar(() => fakeApi.vincularContrato(negociacao.id, contratoId), {
      sucesso: "Contrato vinculado à negociação",
      silenciarErro: true,
    });
    if (r.fase === "ok") onFechar();
  }
  return (
    <Dialog open onOpenChange={(a) => !a && estado.fase !== "enviando" && onFechar()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Vincular contrato?</DialogTitle>
          <DialogDescription>Ligue a negociação {negociacao.rotulo} a um contrato existente.</DialogDescription>
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
