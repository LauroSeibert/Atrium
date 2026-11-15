/**
 * Máquina de estado do Imóvel (`status`) — ESTADOS-E-FLUXOS §3.2, RF-25, RF-49.
 * Usuário: disponivel ↔ reservado, disponivel/reservado → inativo (motivo), inativo → disponivel.
 * Sistema (só a máquina do contrato): → vendido/alugado, vendido/alugado → disponivel.
 */
import type { Base } from "../comum/base";
import { transacao, type Mudanca, type Transacao } from "../comum/transacao";
import { OperacaoInvalida, PERMITIDO, TransicaoInvalida, negar, type Contexto, type Permissao } from "../comum/tipos";
import { dadosImovelSchema, type DadosImovel, type Imovel, type StatusImovel } from "./schema";

export const TRANSICOES_USUARIO: Readonly<Record<StatusImovel, readonly StatusImovel[]>> = {
  disponivel: ["reservado", "inativo"],
  reservado: ["disponivel", "inativo"],
  inativo: ["disponivel"],
  vendido: [],
  alugado: [],
};

export const TRANSICOES_SISTEMA: Readonly<Record<StatusImovel, readonly StatusImovel[]>> = {
  disponivel: ["vendido", "alugado"],
  reservado: ["vendido", "alugado"],
  vendido: ["disponivel"],
  alugado: ["disponivel"],
  inativo: [],
};

export function temContratoAtivo(base: Pick<Base, "contratos">, imovelId: string): boolean {
  return base.contratos.some((c) => c.imovelId === imovelId && c.status === "ativo");
}

export function podeTransicionarImovel(base: Pick<Base, "contratos">, imovel: Imovel, para: StatusImovel): Permissao {
  if (para === imovel.status) return negar("O imóvel já está nesse status.");
  if (temContratoAtivo(base, imovel.id)) return negar("Imóvel com contrato ativo: o status segue o contrato.");
  if (!TRANSICOES_USUARIO[imovel.status].includes(para))
    return negar(
      para === "vendido" || para === "alugado"
        ? "Vendido e alugado só via contrato."
        : "Essa mudança de status não é permitida.",
    );
  return PERMITIDO;
}

export function transicoesPermitidasImovel(base: Pick<Base, "contratos">, imovel: Imovel) {
  return TRANSICOES_USUARIO[imovel.status]
    .filter((para) => podeTransicionarImovel(base, imovel, para).ok)
    .map((para) => ({ para, exigeMotivo: para === "inativo" }));
}

function aplicarStatus(t: Transacao, imovel: Imovel, para: StatusImovel, motivo: string | null, origem: string) {
  t.put("imoveis", { ...imovel, status: para, motivoInativo: para === "inativo" ? motivo : null });
  t.atividade({
    tipo: "statusAlterado",
    alvo: { tipo: "imovel", id: imovel.id },
    dados: { de: imovel.status, para, motivo, origem },
  });
}

function validarUsuario(base: Base, imovel: Imovel, para: StatusImovel, motivo?: string) {
  const p = podeTransicionarImovel(base, imovel, para);
  if (!p.ok) throw new TransicaoInvalida("imovel", imovel.status, para, p.motivo);
  if (para === "inativo" && !motivo?.trim())
    throw new TransicaoInvalida("imovel", imovel.status, para, "Informe o motivo para inativar.");
}

/** `transicionarImovel` (ação do usuário, RF-25). */
export function transicionarImovel(
  base: Base,
  imovelId: string,
  para: StatusImovel,
  ctx: Contexto,
  motivo?: string,
): Mudanca<Imovel> {
  return transacao(base, ctx, (t) => {
    const imovel = t.get("imoveis", imovelId);
    validarUsuario(base, imovel, para, motivo);
    aplicarStatus(t, imovel, para, motivo?.trim() ?? null, "usuario");
    return t.get("imoveis", imovelId);
  });
}

export type ResultadoLote = { alterados: string[]; recusados: { id: string; motivo: string }[] };

/** Ação em lote (RF-49): aplica onde é permitido, informa os recusados; um único desfazer. */
export function transicionarImoveis(
  base: Base,
  ids: readonly string[],
  para: StatusImovel,
  ctx: Contexto,
  motivo?: string,
): Mudanca<ResultadoLote> {
  return transacao(base, ctx, (t) => {
    const r: ResultadoLote = { alterados: [], recusados: [] };
    for (const id of ids) {
      const imovel = t.find("imoveis", id);
      if (!imovel) {
        r.recusados.push({ id, motivo: "Imóvel não encontrado." });
        continue;
      }
      try {
        validarUsuario(base, imovel, para, motivo);
      } catch (e) {
        r.recusados.push({ id, motivo: (e as Error).message });
        continue;
      }
      aplicarStatus(t, imovel, para, motivo?.trim() ?? null, "usuario");
      r.alterados.push(id);
    }
    return r;
  });
}

/** Uso exclusivo da máquina do contrato (dentro da mesma transação). */
export function transicionarImovelPorContrato(t: Transacao, imovelId: string, para: StatusImovel, contratoId: string) {
  const imovel = t.get("imoveis", imovelId);
  if (!TRANSICOES_SISTEMA[imovel.status].includes(para))
    throw new TransicaoInvalida("imovel", imovel.status, para, "Status do imóvel incompatível com o contrato.");
  aplicarStatus(t, imovel, para, null, contratoId);
}

/** Cria ou edita (RF-27). Preço/condomínio/IPTU mudados geram Atividade + registro. */
export function salvarImovel(base: Base, dados: DadosImovel & { id?: string }, ctx: Contexto): Mudanca<Imovel> {
  const d = dadosImovelSchema.parse(dados);
  return transacao(base, ctx, (t) => {
    if (!dados.id) {
      const n = Math.max(0, ...t.all("imoveis").map((i) => Number(i.codigo.slice(3)))) + 1;
      const novo = t.put("imoveis", {
        ...d,
        id: t.novoId("imv"),
        codigo: `AT-${String(n).padStart(4, "0")}`,
        status: "disponivel",
        favorito: false,
        motivoInativo: null,
        criadoEm: ctx.agora,
        atualizadoEm: ctx.agora,
      });
      t.atividade({ tipo: "imovelCriado", alvo: { tipo: "imovel", id: novo.id }, dados: { codigo: novo.codigo } });
      return novo;
    }
    const atual = t.get("imoveis", dados.id);
    if (atual.finalidade !== d.finalidade && temContratoAtivo(base, atual.id))
      throw new OperacaoInvalida("Não dá para mudar a finalidade de imóvel com contrato ativo.");
    const salvo = t.put("imoveis", { ...atual, ...d });
    for (const campo of ["preco", "condominio", "iptu"] as const) {
      if (atual[campo] !== salvo[campo])
        t.atividade({
          tipo: "precoAlterado",
          alvo: { tipo: "imovel", id: atual.id },
          dados: { campo, de: atual[campo], para: salvo[campo] },
        });
    }
    return salvo;
  });
}

/** RF-28. Não é fluxo crítico, mas passa pela transação para ganhar `desfazer`. */
export function alternarFavorito(base: Base, imovelId: string, ctx: Contexto) {
  return transacao(base, ctx, (t) => {
    const i = t.get("imoveis", imovelId);
    return t.put("imoveis", { ...i, favorito: !i.favorito });
  });
}
