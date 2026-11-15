import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

export type FachadaTerreaProps = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

export function FachadaTerrea({ titulo = "Ilustração de casa térrea", ...props }: FachadaTerreaProps) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <circle cx="334" cy="62" r="24" fill={P.accent} />
      <rect y="236" width="400" height="64" fill={P.ground} />
      <rect x="150" y="252" width="100" height="48" fill={P.wallAlt} />
      <rect x="296" y="76" width="24" height="56" fill={P.wallAlt} />
      <rect x="70" y="150" width="260" height="90" fill={P.wall} />
      <polygon points="52,152 200,84 348,152" fill={P.roof} />
      <rect x="176" y="172" width="48" height="68" rx="3" fill={P.detail} />
      <circle cx="214" cy="208" r="3" fill={P.ink} />
      <rect x="94" y="176" width="52" height="40" rx="2" fill={P.detail} />
      <rect x="253" y="176" width="52" height="40" rx="2" fill={P.detail} />
      <rect x="118" y="176" width="4" height="40" fill={P.wall} />
      <rect x="277" y="176" width="4" height="40" fill={P.wall} />
      <rect x="90" y="216" width="60" height="6" fill={P.wallAlt} />
      <rect x="249" y="216" width="60" height="6" fill={P.wallAlt} />
      <rect x="168" y="240" width="64" height="6" fill={P.ink} />
      <circle cx="40" cy="200" r="22" fill={P.accent} />
      <rect x="37" y="216" width="6" height="24" fill={P.ink} />
      <rect x="352" y="222" width="30" height="18" rx="3" fill={P.wallAlt} />
    </Ilustracao>
  );
}
