/**
 * Validação completa de uma Base: schemas Zod de cada entidade + invariantes de
 * MODELO-DE-DADOS §3. Usada pelos testes do gerador (Gate 5) e ao carregar do localStorage.
 */
import { anuncioSchema } from "./anuncio/schema";
import { atividadeSchema, registroAlteracaoSchema } from "./atividade/schema";
import { COLECOES, type Base } from "./comum/base";
import { dataLocal } from "./comum/tipos";
import { contatoPessoaSchema } from "./contato/schema";
import { contratoSchema } from "./contrato/schema";
import { corretorSchema } from "./corretor/schema";
import { despesaSchema } from "./despesa/schema";
import { documentoSchema } from "./documento/schema";
import { imovelSchema } from "./imovel/schema";
import { leadSchema } from "./lead/schema";
import { estaAberta, negociacaoSchema } from "./negociacao/schema";
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
  validar("negociação", negociacaoSchema, base.negociacoes);
  validar("visita", visitaSchema, base.visitas);
  validar("contrato", contratoSchema, base.contratos);
  validar("contato", contatoPessoaSchema, base.contatos);
  validar("anúncio", anuncioSchema, base.anuncios);
  validar("documento", documentoSchema, base.documentos);
  validar("despesa", despesaSchema, base.despesas);
  validar("atividade", atividadeSchema, base.atividades);
  validar("alteração", registroAlteracaoSchema, base.alteracoes);

  const ids = new Set<string>();
  for (const l of [...COLECOES.map((c) => base[c] as readonly { id: string }[]), base.atividades, base.alteracoes])
    for (const e of l) {
      if (ids.has(e.id)) erros.push(`ID duplicado: ${e.id}`);
      ids.add(e.id);
    }
  const codigos = new Set(base.imoveis.map((i) => i.codigo));
  if (codigos.size !== base.imoveis.length) erros.push("Código de imóvel duplicado");

  const corretor = new Set(base.corretores.map((c) => c.id));
  const imovel = new Map(base.imoveis.map((i) => [i.id, i]));
  const lead = new Map(base.leads.map((l) => [l.id, l]));
  const negociacao = new Map(base.negociacoes.map((n) => [n.id, n]));
  const contrato = new Set(base.contratos.map((c) => c.id));
  const ref = (ok: boolean, msg: string) => ok || erros.push(msg);

  for (const i of base.imoveis) ref(corretor.has(i.corretorId), `imóvel ${i.id}: corretor inexistente`);
  for (const l of base.leads) {
    ref(corretor.has(l.responsavelId), `lead ${l.id}: responsável inexistente`);
    for (const v of l.imoveisVistos) ref(imovel.has(v), `lead ${l.id}: imóvel visto inexistente ${v}`);
  }
  // 5. todo lead tem negociação; no máximo uma aberta por lead × imóvel
  const comNegociacao = new Set(base.negociacoes.map((n) => n.leadId));
  for (const l of base.leads) ref(comNegociacao.has(l.id), `lead ${l.id}: sem negociação`);
  const abertas = new Set<string>();
  for (const n of base.negociacoes) {
    ref(lead.has(n.leadId), `negociação ${n.id}: lead inexistente`);
    ref(corretor.has(n.responsavelId), `negociação ${n.id}: responsável inexistente`);
    if (n.imovelId !== null) ref(imovel.has(n.imovelId), `negociação ${n.id}: imóvel inexistente`);
    if (n.imovelId !== null && estaAberta(n)) {
      const k = `${n.leadId}|${n.imovelId}`;
      ref(!abertas.has(k), `negociação ${n.id}: outra negociação aberta do mesmo lead × imóvel`);
      abertas.add(k);
    }
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
    // 9. tipo = finalidade
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
    // 3. negociacaoId ⇒ negociação fechada do mesmo imóvel
    if (c.negociacaoId) {
      const n = negociacao.get(c.negociacaoId);
      ref(n?.etapa === "fechado", `contrato ${c.id}: negociação vinculada não está fechada`);
      ref(!n || n.imovelId === c.imovelId, `contrato ${c.id}: negociação vinculada é de outro imóvel`);
    }
    // 10. parcelas
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
  const vinculadas = base.contratos.flatMap((c) => (c.negociacaoId ? [c.negociacaoId] : []));
  ref(new Set(vinculadas).size === vinculadas.length, "negociação com mais de um contrato vinculado");

  // 6. no máximo um anúncio não encerrado por imóvel × canal. "Publicado só com imóvel disponível/reservado"
  // vale na publicação (guard): depois disso o imóvel pode ser vendido e o alerta é derivado (`alertaAnuncio`).
  const anunciosVivos = new Set<string>();
  for (const a of base.anuncios) {
    ref(imovel.has(a.imovelId), `anúncio ${a.id}: imóvel inexistente`);
    if (a.status === "encerrado") continue;
    const k = `${a.imovelId}|${a.canal}`;
    ref(!anunciosVivos.has(k), `anúncio ${a.id}: outro anúncio não encerrado no mesmo imóvel × canal`);
    anunciosVivos.add(k);
  }
  // 7. referências de documento, despesa e contato
  for (const d of base.documentos) {
    ref(contrato.has(d.contratoId), `documento ${d.id}: contrato inexistente`);
    ref(corretor.has(d.enviadoPorId), `documento ${d.id}: autor inexistente`);
  }
  for (const d of base.despesas)
    if (d.contratoId !== null) ref(contrato.has(d.contratoId), `despesa ${d.id}: contrato inexistente`);
  for (const c of base.contatos) {
    for (const i of c.imovelIds) ref(imovel.has(i), `contato ${c.id}: imóvel inexistente ${i}`);
    for (const k of c.contratoIds) ref(contrato.has(k), `contato ${c.id}: contrato inexistente ${k}`);
  }
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
