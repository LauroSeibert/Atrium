import { z } from "zod";
import { centavos, corretorId, imovelId, isoDataHora } from "../comum/tipos";

export const TIPOS_IMOVEL = ["casa", "apartamento", "cobertura", "terreno", "comercial"] as const;
export const FINALIDADES = ["venda", "locacao"] as const;
export const STATUS_IMOVEL = ["disponivel", "reservado", "vendido", "alugado", "inativo"] as const;
export const TIPOS_COMODO = [
  "sala",
  "cozinha",
  "quarto",
  "banheiro",
  "varanda",
  "garagem",
  "areaGourmet",
  "escritorio",
] as const;

export const tipoImovel = z.enum(TIPOS_IMOVEL);
export const finalidade = z.enum(FINALIDADES);
export const statusImovel = z.enum(STATUS_IMOVEL);
export const tipoComodo = z.enum(TIPOS_COMODO);

export type TipoImovel = z.infer<typeof tipoImovel>;
export type Finalidade = z.infer<typeof finalidade>;
export type StatusImovel = z.infer<typeof statusImovel>;
export type TipoComodo = z.infer<typeof tipoComodo>;

export const comodoSchema = z.object({
  tipo: tipoComodo,
  nome: z.string().min(1),
  area: z.number().positive().nullable(),
});
export type Comodo = z.infer<typeof comodoSchema>;

/** Ilustração da fachada (Fase 5 §5.4); `null` = sem ilustração → PropertyImage usa o fallback. */
export const FACHADAS = [
  "terrea",
  "sobrado",
  "moderna",
  "predio",
  "cobertura",
  "campo",
  "comercial",
  "terreno",
] as const;
export const fachada = z.enum(FACHADAS);
export type Fachada = z.infer<typeof fachada>;

export const UFS = ["SP", "RJ", "MG", "PR", "SC", "RS"] as const;

export const enderecoSchema = z.object({
  logradouro: z.string().min(1),
  numero: z.string().min(1),
  bairro: z.string().min(1),
  cidade: z.string().min(1),
  uf: z.enum(UFS),
  cep: z.string().regex(/^\d{8}$/, "CEP com 8 dígitos"),
});

/** Campos que o formulário (RF-27) edita. `status`, `favorito` e datas são do domínio. */
export const dadosImovelSchema = z
  .object({
    titulo: z.string().min(3).max(140),
    descricao: z.string().max(2000),
    tipo: tipoImovel,
    finalidade,
    preco: centavos.positive(),
    condominio: centavos.nullable(),
    iptu: centavos.nullable(),
    areaUtil: z.number().positive(),
    areaTotal: z.number().positive(),
    quartos: z.int().nonnegative(),
    suites: z.int().nonnegative(),
    banheiros: z.int().nonnegative(),
    vagas: z.int().nonnegative(),
    endereco: enderecoSchema,
    comodos: z.array(comodoSchema),
    diferenciais: z.array(z.string().min(1)),
    corretorId,
    fachada: fachada.nullable(),
  })
  .superRefine((d, ctx) => {
    if (d.areaUtil > d.areaTotal)
      ctx.addIssue({ code: "custom", path: ["areaUtil"], message: "Área útil não pode passar da área total" });
    if (d.suites > d.quartos)
      ctx.addIssue({ code: "custom", path: ["suites"], message: "Suítes não podem passar do número de quartos" });
    if (d.tipo === "terreno") {
      if (d.quartos + d.suites + d.banheiros + d.vagas > 0)
        ctx.addIssue({ code: "custom", path: ["quartos"], message: "Terreno não tem quartos, banheiros nem vagas" });
      if (d.comodos.length > 0) ctx.addIssue({ code: "custom", path: ["comodos"], message: "Terreno não tem cômodos" });
      if (d.condominio !== null && d.condominio > 0)
        ctx.addIssue({ code: "custom", path: ["condominio"], message: "Terreno não tem condomínio" });
    } else if (d.comodos.length === 0) {
      ctx.addIssue({ code: "custom", path: ["comodos"], message: "Informe ao menos um cômodo" });
    }
  });
export type DadosImovel = z.infer<typeof dadosImovelSchema>;

export const imovelSchema = z
  .object({
    id: imovelId,
    codigo: z.string().regex(/^AT-\d{4}$/),
    status: statusImovel,
    favorito: z.boolean(),
    motivoInativo: z.string().min(1).nullable(),
    criadoEm: isoDataHora,
    atualizadoEm: isoDataHora,
  })
  .and(dadosImovelSchema)
  .superRefine((i, ctx) => {
    if ((i.status === "inativo") !== (i.motivoInativo !== null))
      ctx.addIssue({ code: "custom", path: ["motivoInativo"], message: "motivoInativo só (e sempre) quando inativo" });
  });
export type Imovel = z.infer<typeof imovelSchema>;

/** Campos que geram registro de alteração (ESTADOS-E-FLUXOS §4). */
export const CAMPOS_MONITORADOS_IMOVEL = ["preco", "condominio", "iptu", "status"] as const;
