import type { ComponentProps, ComponentType } from "react";
import { ComodoAreaGourmet } from "./ComodoAreaGourmet";
import { ComodoBanheiro } from "./ComodoBanheiro";
import { ComodoCozinha } from "./ComodoCozinha";
import { ComodoEscritorio } from "./ComodoEscritorio";
import { ComodoGaragem } from "./ComodoGaragem";
import { ComodoQuarto } from "./ComodoQuarto";
import { ComodoSala } from "./ComodoSala";
import { ComodoVaranda } from "./ComodoVaranda";

/** Tipos de cômodo do modelo de dados (docs/MODELO-DE-DADOS.md). */
export type ComodoVariante =
  "sala" | "cozinha" | "quarto" | "banheiro" | "varanda" | "garagem" | "areaGourmet" | "escritorio";

export const COMODO_VARIANTES: readonly { variante: ComodoVariante; rotulo: string }[] = [
  { variante: "sala", rotulo: "Sala" },
  { variante: "cozinha", rotulo: "Cozinha" },
  { variante: "quarto", rotulo: "Quarto" },
  { variante: "banheiro", rotulo: "Banheiro" },
  { variante: "varanda", rotulo: "Varanda" },
  { variante: "garagem", rotulo: "Garagem" },
  { variante: "areaGourmet", rotulo: "Área gourmet" },
  { variante: "escritorio", rotulo: "Escritório" },
];

const COMPONENTES: Record<ComodoVariante, ComponentType<ComponentProps<typeof ComodoSala>>> = {
  sala: ComodoSala,
  cozinha: ComodoCozinha,
  quarto: ComodoQuarto,
  banheiro: ComodoBanheiro,
  varanda: ComodoVaranda,
  garagem: ComodoGaragem,
  areaGourmet: ComodoAreaGourmet,
  escritorio: ComodoEscritorio,
};

export type SvgComodoProps = ComponentProps<typeof ComodoSala> & { variant: ComodoVariante };

/** Ilustração de cômodo por tipo (RF de imóvel/cômodos). */
export function SvgComodo({ variant, ...props }: SvgComodoProps) {
  const Componente = COMPONENTES[variant];
  return <Componente {...props} />;
}
