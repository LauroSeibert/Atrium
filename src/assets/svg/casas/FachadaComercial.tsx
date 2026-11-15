import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

export type FachadaComercialProps = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

const PAVIMENTOS = [64, 104] as const;
const JANELAS = [88, 136, 184, 232, 280] as const;

export function FachadaComercial({ titulo = "Ilustração de sala comercial", ...props }: FachadaComercialProps) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <circle cx="34" cy="50" r="16" fill={P.accent} />
      <rect y="252" width="400" height="48" fill={P.ground} />
      <rect x="60" y="46" width="280" height="206" fill={P.wall} />
      <rect x="52" y="38" width="296" height="10" fill={P.roof} />
      {PAVIMENTOS.map((y) =>
        JANELAS.map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="30" height="26" rx="2" fill={P.detail} />),
      )}
      <rect x="52" y="146" width="296" height="12" fill={P.roof} />
      <rect x="72" y="166" width="150" height="86" rx="2" fill={P.detail} />
      <rect x="144" y="166" width="4" height="86" fill={P.wall} />
      <rect x="72" y="222" width="150" height="4" fill={P.wall} />
      <rect x="244" y="166" width="48" height="86" rx="2" fill={P.detail} />
      <rect x="264" y="166" width="4" height="86" fill={P.wall} />
      <rect x="304" y="166" width="28" height="30" rx="2" fill={P.detail} />
      <rect x="304" y="204" width="28" height="14" rx="2" fill={P.accent} />
      <rect x="60" y="252" width="280" height="6" fill={P.ink} />
      <rect x="360" y="206" width="6" height="46" fill={P.ink} />
      <circle cx="363" cy="196" r="14" fill={P.accent} />
    </Ilustracao>
  );
}
