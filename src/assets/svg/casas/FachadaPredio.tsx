import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

export type FachadaPredioProps = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

const COLUNAS = [112, 160, 208, 256] as const;
const ANDARES = [72, 108, 144, 180] as const;

export function FachadaPredio({ titulo = "Ilustração de prédio de apartamentos", ...props }: FachadaPredioProps) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <circle cx="340" cy="48" r="18" fill={P.accent} />
      <rect y="248" width="400" height="52" fill={P.ground} />
      <rect x="40" y="150" width="50" height="98" fill={P.wallAlt} />
      <rect x="310" y="130" width="50" height="118" fill={P.wallAlt} />
      <rect x="100" y="50" width="200" height="198" fill={P.wall} />
      <rect x="92" y="42" width="216" height="10" fill={P.roof} />
      <rect x="186" y="26" width="28" height="16" fill={P.wallAlt} />
      {ANDARES.map((y) =>
        COLUNAS.map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="28" height="26" rx="2" fill={P.detail} />),
      )}
      <rect x="184" y="216" width="32" height="32" rx="2" fill={P.detail} />
      <rect x="170" y="208" width="60" height="6" fill={P.ink} />
      <rect x="48" y="166" width="12" height="14" fill={P.detail} />
      <rect x="70" y="166" width="12" height="14" fill={P.detail} />
      <rect x="318" y="146" width="12" height="14" fill={P.detail} />
      <rect x="340" y="146" width="12" height="14" fill={P.detail} />
      <circle cx="120" cy="238" r="9" fill={P.accent} />
      <circle cx="280" cy="238" r="9" fill={P.accent} />
    </Ilustracao>
  );
}
