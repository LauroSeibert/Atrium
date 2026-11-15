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
