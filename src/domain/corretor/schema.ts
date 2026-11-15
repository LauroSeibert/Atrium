import { z } from "zod";
import { centavos, corretorId } from "../comum/tipos";

export const PAPEIS = ["gestor", "corretor", "financeiro"] as const;
export const papel = z.enum(PAPEIS);

export const corretorSchema = z.object({
  id: corretorId,
  nome: z.string().min(1),
  email: z.email(),
  telefone: z.string().regex(/^\d{10,11}$/, "Telefone com DDD, só dígitos"),
  creci: z.string().regex(/^CRECI-[A-Z]{2} \d{5,6}-[FJ]$/),
  avatar: z.object({
    iniciais: z.string().min(1).max(2),
    /** 1–6 = ilustração `AvatarIlustrado`; ausente = só iniciais. */
    variante: z.int().min(1).max(6).optional(),
  }),
  papel,
  metaMensal: centavos,
  ativo: z.boolean(),
});
export type Corretor = z.infer<typeof corretorSchema>;
export type Papel = z.infer<typeof papel>;
