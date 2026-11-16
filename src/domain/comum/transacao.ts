import { CAMPOS_MONITORADOS_ANUNCIO, type Anuncio } from "../anuncio/schema";
import type { Atividade, RegistroAlteracao, TipoAtividade, ValorBruto } from "../atividade/schema";
import type { Contrato } from "../contrato/schema";
import { CAMPOS_MONITORADOS_DESPESA, type Despesa } from "../despesa/schema";
import { CAMPOS_MONITORADOS_IMOVEL, type Imovel } from "../imovel/schema";
import { CAMPOS_MONITORADOS_LEAD, type Lead } from "../lead/schema";
import { CAMPOS_MONITORADOS_NEGOCIACAO, type Negociacao } from "../negociacao/schema";
import { validarBase } from "../invariantes";
import { buscar, COLECOES, type Base, type Colecao, type EntidadeDe } from "./base";
import { OperacaoInvalida, type Contexto, type RefEntidade, type TipoEntidade } from "./tipos";

/**
 * Núcleo atômico das escritas do domínio (ESTADOS-E-FLUXOS §2, regras 2 e 4).
 *
 * Toda função de transição roda dentro de `transacao`, que:
 * 1. aplica as mudanças numa cópia da Base;
 * 2. grava o **registro de alteração** de todo campo monitorado (preço, status, valores) que
 *    mudou — por comparação antes/depois, então não há como mudar sem registrar (§4);
 * 3. devolve `desfazer` (RF-04), que restaura o snapshot, remove as atividades geradas e,
 *    por ser também uma alteração, gera os registros inversos.
 */

export type Desfazer = (base: Base, ctx: Contexto) => Mudanca<null>;
export type Mudanca<T> = { base: Base; resultado: T; desfazer: Desfazer };

type NovaAtividade = {
  tipo: TipoAtividade;
  alvo: RefEntidade;
  relacionados?: RefEntidade[];
  dados?: Atividade["dados"];
};

export type Transacao = {
  readonly ctx: Contexto;
  get<C extends Colecao>(colecao: C, id: string): EntidadeDe<C>;
  find<C extends Colecao>(colecao: C, id: string): EntidadeDe<C> | undefined;
  all<C extends Colecao>(colecao: C): readonly EntidadeDe<C>[];
  /** Insere ou substitui pelo `id`; carimba `atualizadoEm` quando a entidade tem esse campo. */
  put<C extends Colecao>(colecao: C, entidade: EntidadeDe<C>): EntidadeDe<C>;
  remove(colecao: Colecao, id: string): void;
  atividade(a: NovaAtividade): Atividade;
  removerAtividades(ids: readonly string[]): void;
  novoId(prefixo: string): string;
};

const TIPO_DA_COLECAO: Partial<Record<Colecao, TipoEntidade>> = {
  imoveis: "imovel",
  leads: "lead",
  negociacoes: "negociacao",
  contratos: "contrato",
  anuncios: "anuncio",
  despesas: "despesa",
};

const pegar = <E, K extends keyof E>(e: E, campos: readonly K[]) =>
  Object.fromEntries(campos.map((k) => [k, e[k]])) as Record<string, ValorBruto>;

/** Campos que geram registro de alteração, achatados (`parcela.3.pagoEm`). */
export function camposMonitorados(colecao: Colecao, e: unknown): Record<string, ValorBruto> | null {
  if (colecao === "imoveis") return pegar(e as Imovel, CAMPOS_MONITORADOS_IMOVEL);
  if (colecao === "leads") return pegar(e as Lead, CAMPOS_MONITORADOS_LEAD);
  if (colecao === "negociacoes") return pegar(e as Negociacao, CAMPOS_MONITORADOS_NEGOCIACAO);
  if (colecao === "anuncios") return pegar(e as Anuncio, CAMPOS_MONITORADOS_ANUNCIO);
  if (colecao === "despesas") return pegar(e as Despesa, CAMPOS_MONITORADOS_DESPESA);
  if (colecao === "contratos") {
    const c = e as Contrato;
    const r: Record<string, ValorBruto> = {
      status: c.status,
      valor: c.valor,
      taxaAdministracao: c.taxaAdministracao,
    };
    for (const p of c.parcelas) {
      r[`parcela.${p.numero}.valor`] = p.valor;
      r[`parcela.${p.numero}.pagoEm`] = p.pagoEm;
    }
    c.comissoes.forEach((m, i) => {
      r[`comissao.${i + 1}.valor`] = m.valor;
      r[`comissao.${i + 1}.pagaEm`] = m.pagaEm;
    });
    return r;
  }
  return null;
}

const chave = (colecao: Colecao, id: string) => `${colecao}:${id}`;

export function transacao<T>(base: Base, ctx: Contexto, corpo: (t: Transacao) => T): Mudanca<T> {
  const colecoes = Object.fromEntries(COLECOES.map((c) => [c, [...base[c]]])) as {
    -readonly [C in Colecao]: EntidadeDe<C>[];
  };
  let atividades = [...base.atividades];
  let seq = base.seq;
  const antes = new Map<string, { colecao: Colecao; id: string; valor: unknown }>();
  const criadas: string[] = [];

  const lembrar = (colecao: Colecao, id: string) => {
    const k = chave(colecao, id);
    if (!antes.has(k)) antes.set(k, { colecao, id, valor: buscar(base, colecao, id) });
  };

  const t: Transacao = {
    ctx,
    find: (colecao, id) => (colecoes[colecao] as { id: string }[]).find((e) => e.id === id) as never,
    get(colecao, id) {
      const e = t.find(colecao, id);
      if (!e) throw new OperacaoInvalida(`Registro não encontrado: ${id}`);
      return e;
    },
    all: (colecao) => colecoes[colecao] as never,
    put(colecao, entidade) {
      lembrar(colecao, entidade.id);
      const carimbada = "atualizadoEm" in entidade ? { ...entidade, atualizadoEm: ctx.agora } : entidade;
      const lista = colecoes[colecao] as { id: string }[];
      const i = lista.findIndex((e) => e.id === entidade.id);
      if (i === -1) lista.push(carimbada);
      else lista[i] = carimbada;
      return carimbada as never;
    },
    remove(colecao, id) {
      lembrar(colecao, id);
      const lista = colecoes[colecao] as { id: string }[];
      const i = lista.findIndex((e) => e.id === id);
      if (i !== -1) lista.splice(i, 1);
    },
    atividade(a) {
      const nova: Atividade = {
        id: t.novoId("atv"),
        tipo: a.tipo,
        alvo: a.alvo,
        relacionados: a.relacionados ?? [],
        autorId: ctx.autorId,
        dados: a.dados ?? {},
        criadoEm: ctx.agora,
      };
      atividades.push(nova);
      criadas.push(nova.id);
      return nova;
    },
    removerAtividades(ids) {
      const set = new Set(ids);
      atividades = atividades.filter((a) => !set.has(a.id));
    },
    novoId: (prefixo) => `${prefixo}_${(seq++).toString(36).padStart(4, "0")}`,
  };

  const resultado = corpo(t);

  // Registro de alteração por diferença (ESTADOS-E-FLUXOS §4).
  const alteracoes: RegistroAlteracao[] = [];
  const depois = new Map<string, unknown>();
  for (const [k, { colecao, id, valor }] of antes) {
    const atual = (colecoes[colecao] as { id: string }[]).find((e) => e.id === id);
    depois.set(k, atual);
    const tipo = TIPO_DA_COLECAO[colecao];
    if (!tipo || valor === undefined || atual === undefined) continue; // criação/remoção não é "alteração"
    const a = camposMonitorados(colecao, valor)!;
    const b = camposMonitorados(colecao, atual)!;
    // Só campos presentes antes E depois: parcela/comissão recém-criada não é "alteração".
    for (const campo of Object.keys(b)) {
      if (!(campo in a)) continue;
      const de = a[campo] ?? null;
      const para = b[campo] ?? null;
      if (de === para) continue;
      alteracoes.push({
        id: t.novoId("alt"),
        em: ctx.agora,
        autorId: ctx.autorId,
        entidade: { tipo, id },
        campo,
        de,
        para,
      });
    }
  }

  const nova: Base = {
    ...colecoes,
    atividades,
    alteracoes: [...base.alteracoes, ...alteracoes],
    seq,
  };

  const desfazer: Desfazer = (baseAtual, ctxDesfazer) => {
    // Entidades em que só `ordem` mudou (renumeração da coluna) não são checadas nem restauradas:
    // a normalização no fim cuida delas.
    const soOrdem = (k: string) => assinatura(antes.get(k)!.valor) === assinatura(depois.get(k));
    for (const [k, valor] of depois) {
      if (soOrdem(k)) continue;
      const { colecao, id } = antes.get(k)!;
      if (assinatura(buscar(baseAtual, colecao, id)) !== assinatura(valor))
        throw new OperacaoInvalida("Os dados mudaram desde então; não dá mais para desfazer.");
    }
    const r = transacao(baseAtual, ctxDesfazer, (u) => {
      const etapas = new Set<string>();
      for (const [k, { colecao, id, valor }] of antes) {
        if (soOrdem(k)) continue;
        if (valor === undefined) u.remove(colecao, id);
        else restaurar(u, colecao, valor as EntidadeDe<typeof colecao>);
        if (colecao === "negociacoes") {
          if (valor) etapas.add((valor as Negociacao).etapa);
          const agora = depois.get(chave(colecao, id)) as Negociacao | undefined;
          if (agora) etapas.add(agora.etapa);
        }
      }
      // Outros movimentos podem ter renumerado as colunas: normaliza 0…n preservando a ordem relativa.
      for (const etapa of etapas)
        u.all("negociacoes")
          .filter((n) => n.etapa === etapa)
          .sort((x, y) => x.ordem - y.ordem)
          .forEach((n, i) => {
            if (n.ordem !== i) u.put("negociacoes", { ...n, ordem: i });
          });
      u.removerAtividades(criadas);
      return null;
    });
    // Outras operações podem ter se apoiado no estado novo (ex.: contrato vinculado à negociação fechada,
    // nova negociação do mesmo lead × imóvel, outro anúncio no mesmo canal). Restaurar o snapshot não pode
    // quebrar invariante: só os erros que o desfazer INTRODUZ contam (bases de teste parciais já podem ter outros).
    const jaHavia = new Set(validarBase(baseAtual));
    const novos = validarBase(r.base).filter((e) => !jaHavia.has(e));
    if (novos.length > 0) throw new OperacaoInvalida(`Não dá mais para desfazer: ${motivoLegivel(novos[0]!)}`);
    return r;
  };

  return { base: nova, resultado, desfazer };
}

/**
 * O que precisa estar igual para o desfazer valer: tudo, menos `ordem` (renumerada por movimentos
 * de outras negociações na mesma coluna) e `atualizadoEm`.
 */
function assinatura(e: unknown): string {
  if (e === undefined) return "undefined";
  return JSON.stringify(e, (k, v) => (k === "ordem" || k === "atualizadoEm" ? undefined : v));
}

/** Restaura o snapshot exatamente (inclusive `atualizadoEm` anterior). */
function restaurar<C extends Colecao>(u: Transacao, colecao: C, valor: EntidadeDe<C>) {
  u.put(colecao, valor);
  const lista = u.all(colecao) as unknown as { id: string }[];
  const i = lista.findIndex((e) => e.id === valor.id);
  lista[i] = valor;
}

/** Mensagem do invariante sem o prefixo técnico (`negociação neg_x: …`). */
function motivoLegivel(erro: string): string {
  const i = erro.indexOf(": ");
  return i >= 0 ? erro.slice(i + 2) : erro;
}
