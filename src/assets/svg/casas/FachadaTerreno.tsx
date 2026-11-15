import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

export type FachadaTerrenoProps = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

const ESTACAS = [20, 60, 100, 140, 180, 220, 260] as const;

export function FachadaTerreno({ titulo = "Ilustração de terreno vazio com placa", ...props }: FachadaTerrenoProps) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <circle cx="330" cy="60" r="26" fill={P.accent} />
      <polygon points="0,190 70,160 150,190 240,150 320,184 400,170 400,300 0,300" fill={P.wallAlt} />
      <rect y="206" width="400" height="94" fill={P.ground} />
      <rect x="0" y="206" width="400" height="4" fill={P.ink} />
      <rect x="248" y="118" width="8" height="106" fill={P.ink} />
      <rect x="318" y="118" width="8" height="106" fill={P.ink} />
      <rect x="228" y="76" width="118" height="70" rx="4" fill={P.wall} />
      <rect x="240" y="88" width="94" height="46" rx="2" fill={P.detail} />
      <rect x="250" y="98" width="50" height="6" fill={P.ink} />
      <rect x="250" y="112" width="74" height="6" fill={P.wallAlt} />
      <rect x="250" y="122" width="40" height="6" fill={P.wallAlt} />
      <rect x="10" y="248" width="280" height="5" fill={P.ink} />
      <rect x="10" y="264" width="280" height="5" fill={P.ink} />
      {ESTACAS.map((x) => (
        <rect key={x} x={x} y="236" width="8" height="46" fill={P.wall} />
      ))}
      <rect x="300" y="236" width="8" height="46" fill={P.wall} />
      <rect x="10" y="236" width="8" height="46" fill={P.wall} />
      <circle cx="50" cy="196" r="24" fill={P.accent} />
      <rect x="47" y="212" width="6" height="26" fill={P.ink} />
      <circle cx="120" cy="224" r="12" fill={P.wallAlt} />
      <circle cx="142" cy="226" r="9" fill={P.wallAlt} />
      <circle cx="360" cy="236" r="12" fill={P.wallAlt} />
      <circle cx="380" cy="240" r="9" fill={P.wallAlt} />
    </Ilustracao>
  );
}
