"use client";
/**
 * Confirmação de mudança de status de um ou mais imóveis (RF-25, RF-49, RF-05). Quem pode ir para onde,
 * e se exige motivo, chega pronto do domínio (`opcoesLoteImovel` / `transicoes` do fakeApi); aqui só se confirma e grava.
 */
import { useEffect } from "react";
import { ConfirmDestructive, type FaseConfirmacao } from "@/components/patterns/ConfirmDestructive";
import { STATUS_IMOVEL_UI } from "@/components/patterns/rotulos";
import type { Imovel, ResultadoLote, StatusImovel } from "@/domain";
import { fakeApi } from "@/mocks/services/fakeApi";
import { useEscrita } from "@/features/dados/escrita";

export type AlvoStatus = {
  imoveis: Imovel[];
  para: StatusImovel;
  exigeMotivo: boolean;
  /** Quantos dos imóveis aceitam a mudança (o resto é recusado pelo domínio). */
  aplicaveis: number;
};

export function DialogoStatusImovel({
  alvo,
  onFechar,
  onConcluir,
}: {
  alvo: AlvoStatus | null;
  onFechar: () => void;
  onConcluir?: () => void;
}) {
  const { estado, executar, limpar } = useEscrita();
  useEffect(() => {
    if (!alvo) limpar();
  }, [alvo, limpar]);
  if (!alvo) return null;

  const { imoveis, para, exigeMotivo, aplicaveis } = alvo;
  const rotulo = STATUS_IMOVEL_UI[para].rotulo;
  const unico = imoveis.length === 1;
  const fase: FaseConfirmacao =
    estado.fase === "enviando"
      ? { fase: "confirmando" }
      : estado.fase === "erro"
        ? { fase: "erro", mensagem: estado.mensagem }
        : { fase: "idle" };

  const impactos = [
    unico
      ? `O imóvel passa a ficar ${rotulo.toLowerCase()}.`
      : `${aplicaveis} imóveis passam a ficar ${rotulo.toLowerCase()}.`,
    "A mudança entra no histórico de alterações.",
    ...(aplicaveis < imoveis.length
      ? [`${imoveis.length - aplicaveis} não aceitam essa mudança e ficam como estão.`]
      : []),
  ];

  async function confirmar(motivo?: string) {
    const ids = imoveis.map((i) => i.id);
    const r = unico
      ? await executar(() => fakeApi.setStatusImovel(ids[0]!, para, motivo), {
          sucesso: `${imoveis[0]!.codigo} marcado como ${rotulo.toLowerCase()}`,
          silenciarErro: true,
        })
      : await executar(() => fakeApi.setStatusImoveis(ids, para, motivo), {
          sucesso: (res: ResultadoLote) =>
            res.alterados.length === 0
              ? "Nenhum imóvel foi alterado"
              : `${res.alterados.length} ${res.alterados.length === 1 ? "imóvel marcado" : "imóveis marcados"} como ${rotulo.toLowerCase()}${res.recusados.length > 0 ? ` (${res.recusados.length} recusados)` : ""}`,
          silenciarErro: true,
        });
    if (r.fase === "ok") {
      onConcluir?.();
      onFechar();
    }
  }

  return (
    <ConfirmDestructive
      aberto
      onAbertoChange={(a) => {
        if (!a) onFechar();
      }}
      titulo={
        unico
          ? `Marcar ${imoveis[0]!.codigo} como ${rotulo.toLowerCase()}?`
          : `Marcar ${imoveis.length} imóveis como ${rotulo.toLowerCase()}?`
      }
      impactos={impactos}
      motivo={
        exigeMotivo
          ? {
              tipo: "texto",
              rotulo: "Motivo",
              obrigatorio: true,
              maxLength: 200,
              mensagemObrigatorio: "Informe o motivo.",
            }
          : undefined
      }
      rotuloConfirmar={`Marcar como ${rotulo.toLowerCase()}`}
      fase={fase}
      onConfirmar={(m) => void confirmar(m)}
    />
  );
}
