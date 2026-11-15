import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

export type FachadaSobradoProps = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

export function FachadaSobrado({ titulo = "Ilustração de sobrado de dois andares", ...props }: FachadaSobradoProps) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <circle cx="58" cy="52" r="22" fill={P.accent} />
      <rect y="244" width="400" height="56" fill={P.ground} />
      <rect x="110" y="140" width="190" height="104" fill={P.wall} />
      <rect x="60" y="176" width="70" height="68" fill={P.wallAlt} />
      <rect x="110" y="136" width="190" height="8" fill={P.ink} />
      <polygon points="96,140 205,70 314,140" fill={P.roof} />
      <polygon points="50,178 95,148 140,178" fill={P.roof} />
      <rect x="260" y="82" width="22" height="42" fill={P.wallAlt} />
      <rect x="132" y="160" width="40" height="36" rx="2" fill={P.detail} />
      <rect x="238" y="160" width="40" height="36" rx="2" fill={P.detail} />
      <rect x="185" y="156" width="40" height="40" rx="2" fill={P.detail} />
      <rect x="203" y="156" width="4" height="40" fill={P.wall} />
      <rect x="180" y="204" width="50" height="6" fill={P.ink} />
      <rect x="196" y="210" width="38" height="34" rx="2" fill={P.detail} />
      <circle cx="226" cy="228" r="2.5" fill={P.ink} />
      <rect x="72" y="198" width="46" height="34" rx="2" fill={P.detail} />
      <rect x="90" y="198" width="4" height="34" fill={P.wallAlt} />
      <rect x="132" y="210" width="40" height="34" fill={P.wallAlt} />
      <rect x="246" y="204" width="44" height="40" fill={P.wallAlt} />
      <circle cx="350" cy="200" r="26" fill={P.accent} />
      <rect x="347" y="220" width="6" height="24" fill={P.ink} />
      <rect x="0" y="244" width="400" height="4" fill={P.ink} fillOpacity="0.2" />
    </Ilustracao>
  );
}
