import type { ComponentProps } from "react";
import { FachadaCampo } from "./FachadaCampo";
import { FachadaCobertura } from "./FachadaCobertura";
import { FachadaComercial } from "./FachadaComercial";
import { FachadaModerna } from "./FachadaModerna";
import { FachadaPredio } from "./FachadaPredio";
import { FachadaSobrado } from "./FachadaSobrado";
import { FachadaTerrea } from "./FachadaTerrea";
import { FachadaTerreno } from "./FachadaTerreno";
import { FachadaLinha } from "./FachadaLinha";

export type FachadaVariante =
  "terrea" | "sobrado" | "moderna" | "predio" | "cobertura" | "campo" | "comercial" | "terreno";

export const FACHADA_VARIANTES: readonly { variante: FachadaVariante; rotulo: string }[] = [
  { variante: "terrea", rotulo: "Casa térrea" },
  { variante: "sobrado", rotulo: "Sobrado" },
  { variante: "moderna", rotulo: "Casa moderna" },
  { variante: "predio", rotulo: "Prédio" },
  { variante: "cobertura", rotulo: "Cobertura" },
  { variante: "campo", rotulo: "Casa de campo" },
  { variante: "comercial", rotulo: "Sala comercial" },
  { variante: "terreno", rotulo: "Terreno" },
];

const COMPONENTES = {
  terrea: FachadaTerrea,
  sobrado: FachadaSobrado,
  moderna: FachadaModerna,
  predio: FachadaPredio,
  cobertura: FachadaCobertura,
  campo: FachadaCampo,
  comercial: FachadaComercial,
  terreno: FachadaTerreno,
} satisfies Record<FachadaVariante, unknown>;

export type SvgFachadaProps = { variant: FachadaVariante } & ComponentProps<typeof FachadaTerrea>;

/** Ilustração de fachada por tipo de imóvel (Fase 5 §5.4). `estilo="linha"` (padrão) segue o DESIGN.md. */
export function SvgFachada({ variant, estilo = "linha", ...props }: SvgFachadaProps & { estilo?: "linha" | "cheia" }) {
  if (estilo === "linha") {
    return <FachadaLinha variante={variant} {...props} />;
  }
  const Componente = COMPONENTES[variant];
  return <Componente {...props} />;
}
