/** Apoio das histórias: ações do menu do imóvel, com a permissão calculada pelo domínio. */
import { CircleCheck, CirclePause, Lock } from "lucide-react";
import { fn } from "storybook/test";
import { podeTransicionarImovel } from "@/domain";
import type { Imovel, StatusImovel } from "@/domain";
import { BASE_HISTORIAS } from "@/mocks/data/historias";
import type { AcaoImovel } from "./PropertyCard";

const ROTULO_ACAO: Record<string, { rotulo: string; icone: AcaoImovel["icone"] }> = {
  disponivel: { rotulo: "Marcar como disponível", icone: CircleCheck },
  reservado: { rotulo: "Marcar como reservado", icone: Lock },
  inativo: { rotulo: "Inativar imóvel", icone: CirclePause },
};

export function acoesDoImovel(imovel: Imovel): AcaoImovel[] {
  return (["disponivel", "reservado", "inativo"] satisfies StatusImovel[]).map((para) => ({
    id: para,
    ...ROTULO_ACAO[para]!,
    permissao: podeTransicionarImovel(BASE_HISTORIAS, imovel, para),
    destrutiva: para === "inativo",
    onSelect: fn(),
  }));
}
