/**
 * Validação completa de uma Base: schemas Zod de cada entidade + invariantes de
 * MODELO-DE-DADOS §3. Usada pelos testes do gerador (Gate 5) e ao carregar do localStorage.
 */
import { atividadeSchema, registroAlteracaoSchema } from "./atividade/schema";
import type { Base } from "./comum/base";
import { dataLocal } from "./comum/tipos";
import { contratoSchema } from "./contrato/schema";
import { corretorSchema } from "./corretor/schema";
import { imovelSchema } from "./imovel/schema";
import { leadSchema } from "./lead/schema";
import { visitaSchema } from "./visita/schema";

export function validarBase(base: Base): string[] {
  const erros: string[] = [];
  const validar = (
    nome: string,
    schema: { safeParse: (v: unknown) => { success: boolean; error?: unknown } },
    lista: readonly { id: string }[],
  ) => {
    for (const item of lista) {
      const r = schema.safeParse(item);
      if (!r.success) erros.push(`${nome} ${item.id}: ${String(r.error)}`);
    }
  };
  validar("corretor", corretorSchema, base.corretores);
  validar("imóvel", imovelSchema, base.imoveis);
  validar("lead", leadSchema, base.leads);
  validar("visita", visitaSchema, base.visitas);
  validar("contrato", contratoSchema, base.contratos);
  validar("atividade", atividadeSchema, base.atividades);
  validar("alteração", registroAlteracaoSchema, base.alteracoes);

  const ids = new Set<string>();
  for (const l of [
    base.corretores,
    base.imoveis,
    base.leads,
    base.visitas,
    base.contratos,
    base.atividades,
    base.alteracoes,
  ])
    for (const e of l) {
      if (ids.has(e.id)) erros.push(`ID duplicado: ${e.id}`);
      ids.add(e.id);
    }
  const codigos = new Set(base.imoveis.map((i) => i.codigo));
  if (codigos.size !== base.imoveis.length) erros.push("Código de imóvel duplicado");

  const corretor = new Set(base.corretores.map((c) => c.id));
  const imovel = new Map(base.imoveis.map((i) => [i.id, i]));
  const lead = new Map(base.leads.map((l) => [l.id, l]));
  const ref = (ok: boolean, msg: string) => ok || erros.push(msg);

  for (const i of base.imoveis) ref(corretor.has(i.corretorId), `imóvel ${i.id}: corretor inexistente`);
  for (const l of base.leads) {
    ref(corretor.has(l.responsavelId), `lead ${l.id}: responsável inexistente`);
    for (const v of l.imoveisVistos) ref(imovel.has(v), `lead ${l.id}: imóvel visto inexistente ${v}`);
  }
  for (const v of base.visitas) {
    ref(
      imovel.has(v.imovelId) && lead.has(v.leadId) && corretor.has(v.corretorId),
      `visita ${v.id}: referência inexistente`,
    );
  }

  const ativosPorImovel = new Map<string, number>();
  for (const c of base.contratos) {
    const i = imovel.get(c.imovelId);
    if (!i) {
      erros.push(`contrato ${c.id}: imóvel inexistente`);
      continue;
    }
    // 6. tipo = finalidade
    ref(c.tipo === i.finalidade, `contrato ${c.id}: tipo ≠ finalidade do imóvel`);
    // 1. status do imóvel acompanha o contrato
    if (c.status === "ativo") {
      ativosPorImovel.set(i.id, (ativosPorImovel.get(i.id) ?? 0) + 1);
      ref(
        i.status === (c.tipo === "venda" ? "vendido" : "alugado"),
        `contrato ${c.id}: imóvel deveria estar ${c.tipo === "venda" ? "vendido" : "alugado"}`,
      );
    }
    if (c.status === "encerrado" && c.tipo === "venda")
      ref(i.status === "vendido", `contrato ${c.id}: venda encerrada ⇒ imóvel vendido`);
    // 3. leadId ⇒ lead fechado
    if (c.leadId) ref(lead.get(c.leadId)?.etapa === "fechado", `contrato ${c.id}: lead vinculado não está fechado`);
    // 7. parcelas
    // Rascunho, ou cancelado direto do rascunho, pode não ter cronograma.
    if (c.parcelas.length || c.status === "ativo" || c.status === "encerrado") {
      if (c.tipo === "venda")
        ref(c.parcelas.reduce((s, p) => s + p.valor, 0) === c.valor, `contrato ${c.id}: parcelas ≠ valor`);
      else
        ref(
          c.parcelas.every((p) => p.valor === c.valor),
          `contrato ${c.id}: aluguel ≠ valor da parcela`,
        );
    }
    for (const m of c.comissoes) {
      ref(corretor.has(m.corretorId), `contrato ${c.id}: comissão de corretor inexistente`);
      ref(m.valor === Math.round((m.base * m.percentual) / 100), `contrato ${c.id}: comissão ≠ base × percentual`);
    }
    for (const p of c.parcelas)
      if (p.pagoEm)
        ref(dataLocal(p.pagoEm) >= c.inicio.slice(0, 7) + "-01", `contrato ${c.id}: pagamento antes do início`);
  }
  for (const [id, n] of ativosPorImovel) ref(n === 1, `imóvel ${id}: mais de um contrato ativo`);
  // 2. vendido/alugado só via contrato
  for (const i of base.imoveis) {
    if (i.status === "alugado") ref(ativosPorImovel.has(i.id), `imóvel ${i.id}: alugado sem contrato ativo`);
    if (i.status === "vendido")
      ref(
        base.contratos.some(
          (c) => c.imovelId === i.id && c.tipo === "venda" && (c.status === "ativo" || c.status === "encerrado"),
        ),
        `imóvel ${i.id}: vendido sem contrato de venda`,
      );
  }
  for (const a of [...base.atividades, ...base.alteracoes]) ref(corretor.has(a.autorId), `${a.id}: autor inexistente`);
  return erros;
}
