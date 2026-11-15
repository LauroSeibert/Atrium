import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

export type FachadaCampoProps = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

export function FachadaCampo({ titulo = "Ilustração de casa de campo", ...props }: FachadaCampoProps) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <circle cx="70" cy="56" r="24" fill={P.accent} />
      <polygon points="0,200 90,150 180,200 260,140 400,210 400,300 0,300" fill={P.wallAlt} />
      <rect y="228" width="400" height="72" fill={P.ground} />
      <rect x="120" y="150" width="180" height="84" fill={P.wall} />
      <polygon points="100,152 210,88 320,152" fill={P.roof} />
      <rect x="262" y="90" width="20" height="40" fill={P.wallAlt} />
      <rect x="132" y="170" width="44" height="34" rx="2" fill={P.detail} />
      <rect x="152" y="170" width="4" height="34" fill={P.wall} />
      <rect x="244" y="170" width="44" height="34" rx="2" fill={P.detail} />
      <rect x="264" y="170" width="4" height="34" fill={P.wall} />
      <rect x="192" y="176" width="36" height="58" rx="2" fill={P.detail} />
      <rect x="186" y="234" width="48" height="6" fill={P.ink} />
      <rect x="120" y="212" width="180" height="6" fill={P.wallAlt} />
      <rect x="40" y="206" width="6" height="34" fill={P.ink} />
      <circle cx="43" cy="190" r="26" fill={P.accent} />
      <rect x="332" y="224" width="6" height="30" fill={P.ink} />
      <rect x="326" y="212" width="18" height="16" fill={P.accent} />
      <rect x="320" y="258" width="70" height="4" fill={P.ink} />
      <rect x="326" y="246" width="4" height="22" fill={P.ink} />
      <rect x="350" y="246" width="4" height="22" fill={P.ink} />
      <rect x="374" y="246" width="4" height="22" fill={P.ink} />
      <rect x="320" y="250" width="70" height="4" fill={P.ink} />
    </Ilustracao>
  );
}
