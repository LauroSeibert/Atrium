/** Contatos (RF-74): só cadastro, sem máquina de estado (ESTADOS §3.11). */
import type { Base } from "../comum/base";
import { transacao, type Mudanca } from "../comum/transacao";
import { OperacaoInvalida, type Contexto } from "../comum/tipos";
import { dadosContatoSchema, type Contato, type DadosContato } from "./schema";

/** Cria (sem `id`) ou edita um contato. Vínculos só com imóveis e contratos existentes (invariante 7). */
export function salvarContato(base: Base, dados: DadosContato & { id?: string }, ctx: Contexto): Mudanca<Contato> {
  const d = dadosContatoSchema.parse(dados);
  const imovelIds = [...new Set(d.imovelIds)];
  const contratoIds = [...new Set(d.contratoIds)];
  return transacao(base, ctx, (t) => {
    for (const id of imovelIds) if (!t.find("imoveis", id)) throw new OperacaoInvalida("Imóvel não encontrado.");
    for (const id of contratoIds) if (!t.find("contratos", id)) throw new OperacaoInvalida("Contrato não encontrado.");
    const limpo = { ...d, imovelIds, contratoIds };
    if (!dados.id)
      return t.put("contatos", { ...limpo, id: t.novoId("ctt"), criadoEm: ctx.agora, atualizadoEm: ctx.agora });
    const atual = t.get("contatos", dados.id);
    // Campos opcionais ausentes = apagados (o formulário manda o contato inteiro).
    return t.put("contatos", {
      id: atual.id,
      criadoEm: atual.criadoEm,
      atualizadoEm: atual.atualizadoEm,
      ...limpo,
    });
  });
}
