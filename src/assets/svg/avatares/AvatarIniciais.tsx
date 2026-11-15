import { getInitials } from "@/components/ui/Avatar";
import { Ilustracao, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

export type AvatarTom = "beige" | "verde";

export type AvatarIniciaisProps = Omit<IlustracaoProps, "viewBox" | "children" | "titulo"> & {
  /** Nome completo: gera as iniciais e é a descrição acessível. */
  nome: string;
  tom?: AvatarTom;
};

/** Pares fundo/texto dos tokens de UI já verificados (não usam a paleta `--illus-*`). */
const TONS = {
  beige: { fundo: "var(--surface-muted)", texto: "var(--text)" },
  verde: { fundo: "var(--primary)", texto: "var(--on-primary)" },
} as const;

/** Círculo com as iniciais do nome (exceção à regra "sem texto no SVG"). */
export function AvatarIniciais({ nome, tom = "beige", ...props }: AvatarIniciaisProps) {
  const { fundo, texto } = TONS[tom];
  return (
    <Ilustracao viewBox={VIEWBOX.avatar} titulo={nome} {...props}>
      <circle cx="32" cy="32" r="32" fill={fundo} />
      <text x="32" y="32" textAnchor="middle" dominantBaseline="central" fontSize={24} fontWeight={600} fill={texto}>
        {getInitials(nome)}
      </text>
    </Ilustracao>
  );
}
