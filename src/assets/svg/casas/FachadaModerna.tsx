import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

export type FachadaModernaProps = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

export function FachadaModerna({
  titulo = "Ilustração de casa moderna com volumes retos",
  ...props
}: FachadaModernaProps) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <circle cx="338" cy="56" r="20" fill={P.accent} />
      <rect y="240" width="400" height="60" fill={P.ground} />
      <rect x="50" y="170" width="170" height="70" fill={P.wall} />
      <rect x="150" y="96" width="150" height="144" fill={P.wallAlt} />
      <rect x="40" y="160" width="190" height="12" fill={P.roof} />
      <rect x="140" y="86" width="170" height="12" fill={P.roof} />
      <rect x="220" y="170" width="140" height="70" fill={P.wall} />
      <rect x="210" y="160" width="160" height="12" fill={P.roof} />
      <rect x="66" y="184" width="84" height="56" fill={P.detail} />
      <rect x="106" y="184" width="4" height="56" fill={P.wall} />
      <rect x="168" y="116" width="116" height="44" fill={P.detail} />
      <rect x="224" y="116" width="4" height="44" fill={P.wallAlt} />
      <rect x="168" y="176" width="40" height="64" fill={P.ink} />
      <rect x="236" y="190" width="108" height="34" fill={P.detail} />
      <rect x="288" y="190" width="4" height="34" fill={P.wall} />
      <rect x="50" y="240" width="320" height="4" fill={P.ink} />
      <rect x="20" y="206" width="14" height="34" fill={P.accent} />
      <circle cx="27" cy="198" r="16" fill={P.accent} />
    </Ilustracao>
  );
}
