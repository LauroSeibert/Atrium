import type { Base } from "../comum/base";
import { transacao } from "../comum/transacao";
import type { Contexto } from "../comum/tipos";
import { corretorSchema, type Corretor } from "./schema";

export const dadosPerfilSchema = corretorSchema.pick({ nome: true, email: true, telefone: true });

/** RF-50: o usuário atual edita o próprio perfil (sem campos monitorados). */
export function salvarPerfil(base: Base, corretorId: string, dados: unknown, ctx: Contexto) {
  const d = dadosPerfilSchema.parse(dados);
  return transacao(base, ctx, (t) => t.put("corretores", { ...t.get("corretores", corretorId), ...d }));
}

/**
 * Recorte padrão das listas pela persona (RF-08): corretor vê só o que é dele; gestor e financeiro veem tudo.
 * Devolve o id do responsável a filtrar, ou `undefined` para não filtrar.
 */
export function recortePadrao(usuario: Pick<Corretor, "id" | "papel">): string | undefined {
  return usuario.papel === "corretor" ? usuario.id : undefined;
}

/**
 * Responsável a filtrar dada a escolha explícita da URL ("meus" | "todos"); sem escolha vale o recorte da persona.
 */
export function recorteResponsavel(
  usuario: Pick<Corretor, "id" | "papel">,
  escolha: "meus" | "todos" | undefined,
): string | undefined {
  if (escolha === undefined) return recortePadrao(usuario);
  return escolha === "meus" ? usuario.id : undefined;
}

/** Quem pode ser responsável por negócio (opções de filtro por corretor). */
export function vendedores<C extends Pick<Corretor, "papel">>(corretores: readonly C[]): C[] {
  return corretores.filter((c) => c.papel === "corretor");
}
