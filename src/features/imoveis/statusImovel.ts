/**
 * Opções de mudança de status (RF-25, RF-49) derivadas do domínio: nada de `if (status === …)` aqui.
 * Cada imóvel chega com as `transicoes` que o domínio permite (fakeApi.listImoveis / getImovel),
 * já com a guarda de contrato ativo; aqui só se agrega para o lote.
 */
import {
  negar,
  PERMITIDO,
  STATUS_IMOVEL,
  TRANSICOES_USUARIO,
  type Imovel,
  type Permissao,
  type StatusImovel,
} from "@/domain";
import { STATUS_IMOVEL_UI } from "@/components/patterns/rotulos";

/** Estados que o usuário pode escolher como destino (união da tabela do domínio). */
export const DESTINOS_USUARIO: readonly StatusImovel[] = STATUS_IMOVEL.filter((s) =>
  Object.values(TRANSICOES_USUARIO).some((destinos) => destinos.includes(s)),
);

export type OpcaoStatus = {
  para: StatusImovel;
  permissao: Permissao;
  exigeMotivo: boolean;
  /** Quantos dos imóveis aceitam a mudança. */
  aplicaveis: number;
};

export type TransicaoImovel = { para: StatusImovel; exigeMotivo: boolean };
export type ImovelComTransicoes = Imovel & { transicoes: readonly TransicaoImovel[] };

export function opcoesDeStatus(imoveis: readonly ImovelComTransicoes[]): OpcaoStatus[] {
  return DESTINOS_USUARIO.map((para) => {
    const aceitam = imoveis.map((i) => i.transicoes.find((t) => t.para === para)).filter((t) => t !== undefined);
    return {
      para,
      aplicaveis: aceitam.length,
      exigeMotivo: aceitam.some((t) => t.exigeMotivo),
      permissao:
        aceitam.length > 0
          ? PERMITIDO
          : negar(
              imoveis.length === 1
                ? `Não dá para marcar como ${STATUS_IMOVEL_UI[para].rotulo.toLowerCase()}.`
                : `Nenhum dos selecionados pode ficar ${STATUS_IMOVEL_UI[para].rotulo.toLowerCase()}.`,
            ),
    };
  });
}
