import type { IlustracaoProps } from "../Ilustracao";
import { VazioErro } from "./VazioErro";
import { VazioSemContratos } from "./VazioSemContratos";
import { VazioSemLeads } from "./VazioSemLeads";
import { VazioSemResultados } from "./VazioSemResultados";

export type VazioVariante = "semResultados" | "erro" | "semLeads" | "semContratos";

export const VAZIO_VARIANTES: readonly { variant: VazioVariante; rotulo: string }[] = [
  { variant: "semResultados", rotulo: "Nenhum resultado" },
  { variant: "erro", rotulo: "Erro" },
  { variant: "semLeads", rotulo: "Sem leads" },
  { variant: "semContratos", rotulo: "Sem contratos" },
];

const COMPONENTES = {
  semResultados: VazioSemResultados,
  erro: VazioErro,
  semLeads: VazioSemLeads,
  semContratos: VazioSemContratos,
} as const;

export type SvgVazioProps = Omit<IlustracaoProps, "viewBox" | "children" | "titulo"> & {
  variant: VazioVariante;
  /** Sobrescreve a descrição acessível padrão da variante. */
  titulo?: string;
};

/** Ilustração de estado vazio escolhida por `variant`. */
export function SvgVazio({ variant, ...props }: SvgVazioProps) {
  const Componente = COMPONENTES[variant];
  return <Componente {...props} />;
}

export { VazioErro, VazioSemContratos, VazioSemLeads, VazioSemResultados };
