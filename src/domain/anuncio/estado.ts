/**
 * Máquina do Anúncio (`status`) — ESTADOS-E-FLUXOS §3.8, RF-75 (demonstração).
 * rascunho → publicado ⇄ pausado; qualquer um → encerrado (final).
 */
import type { Base } from "../comum/base";
import { transacao, type Mudanca } from "../comum/transacao";
import { OperacaoInvalida, PERMITIDO, TransicaoInvalida, negar, type Contexto, type Permissao } from "../comum/tipos";
import type { Imovel } from "../imovel/schema";
import { canalAnuncio, type AlertaAnuncio, type Anuncio, type CanalAnuncio, type StatusAnuncio } from "./schema";

export const TRANSICOES_ANUNCIO: Readonly<Record<StatusAnuncio, readonly StatusAnuncio[]>> = {
  rascunho: ["publicado", "encerrado"],
  publicado: ["pausado", "encerrado"],
  pausado: ["publicado", "encerrado"],
  encerrado: [],
};

const imovelPublicavel = (i: Pick<Imovel, "status"> | undefined) =>
  i?.status === "disponivel" || i?.status === "reservado";

export function podeTransicionarAnuncio(base: Pick<Base, "imoveis">, a: Anuncio, para: StatusAnuncio): Permissao {
  if (para === a.status) return negar("O anúncio já está nesse status.");
  if (!TRANSICOES_ANUNCIO[a.status].includes(para))
    return negar(a.status === "encerrado" ? "Anúncio encerrado não muda mais." : "Essa mudança não é permitida.");
  if (para === "publicado" && !imovelPublicavel(base.imoveis.find((i) => i.id === a.imovelId)))
    return negar("Só imóvel disponível ou reservado pode ser publicado.");
  return PERMITIDO;
}

/** Encerrar é final: a interface precisa confirmar antes (a tela só lê `exigeConfirmacao`). */
export const exigeConfirmacaoAnuncio = (para: StatusAnuncio): boolean => para === "encerrado";

export type TransicaoAnuncio = { para: StatusAnuncio; exigeConfirmacao: boolean };

export function transicoesPermitidasAnuncio(base: Pick<Base, "imoveis">, a: Anuncio): TransicaoAnuncio[] {
  return TRANSICOES_ANUNCIO[a.status]
    .filter((para) => podeTransicionarAnuncio(base, a, para).ok)
    .map((para) => ({ para, exigeConfirmacao: exigeConfirmacaoAnuncio(para) }));
}

/** "Imóvel indisponível": publicado, mas o imóvel foi vendido/alugado/inativado depois. Não muda o status. */
export function alertaAnuncio(base: Pick<Base, "imoveis">, a: Anuncio): AlertaAnuncio | null {
  if (a.status !== "publicado") return null;
  return imovelPublicavel(base.imoveis.find((i) => i.id === a.imovelId)) ? null : "imovelIndisponivel";
}

/** Efeitos: 1ª publicação grava `publicadoEm`; Atividade `anuncioAlterado` no imóvel; registro de `status`. */
export function transicionarAnuncio(
  base: Base,
  anuncioId: string,
  para: StatusAnuncio,
  ctx: Contexto,
): Mudanca<Anuncio> {
  return transacao(base, ctx, (t) => {
    const a = t.get("anuncios", anuncioId);
    const p = podeTransicionarAnuncio(base, a, para);
    if (!p.ok) throw new TransicaoInvalida("anuncio", a.status, para, p.motivo);
    const salvo = t.put("anuncios", {
      ...a,
      status: para,
      publicadoEm: para === "publicado" && a.publicadoEm === null ? ctx.agora : a.publicadoEm,
    });
    t.atividade({
      tipo: "anuncioAlterado",
      alvo: { tipo: "imovel", id: a.imovelId },
      dados: { anuncioId: a.id, canal: a.canal, de: a.status, para },
    });
    return salvo;
  });
}

export function podeCriarAnuncio(
  base: Pick<Base, "imoveis" | "anuncios">,
  imovelId: string,
  canal: CanalAnuncio,
): Permissao {
  if (!base.imoveis.some((i) => i.id === imovelId)) return negar("Imóvel não encontrado.");
  if (base.anuncios.some((a) => a.imovelId === imovelId && a.canal === canal && a.status !== "encerrado"))
    return negar("Já existe um anúncio desse imóvel nesse canal.");
  return PERMITIDO;
}

/** Cria em `rascunho` (invariante 6: no máximo um não encerrado por imóvel × canal). */
export function criarAnuncio(base: Base, imovelId: string, canal: CanalAnuncio, ctx: Contexto): Mudanca<Anuncio> {
  const c = canalAnuncio.parse(canal);
  return transacao(base, ctx, (t) => {
    const p = podeCriarAnuncio(base, imovelId, c);
    if (!p.ok) throw new OperacaoInvalida(p.motivo);
    return t.put("anuncios", {
      id: t.novoId("anc"),
      imovelId,
      canal: c,
      status: "rascunho",
      publicadoEm: null,
      visualizacoes: 0,
      contatos: 0,
      criadoEm: ctx.agora,
      atualizadoEm: ctx.agora,
    });
  });
}
