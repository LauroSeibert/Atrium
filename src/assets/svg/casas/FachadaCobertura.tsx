import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

export type FachadaCoberturaProps = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

const COLUNAS = [100, 150, 200, 250] as const;
const ANDARES = [150, 186] as const;

export function FachadaCobertura({
  titulo = "Ilustração de cobertura no topo de um prédio",
  ...props
}: FachadaCoberturaProps) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <circle cx="342" cy="40" r="18" fill={P.accent} />
      <rect y="250" width="400" height="50" fill={P.ground} />
      <rect x="84" y="140" width="232" height="110" fill={P.wall} />
      {ANDARES.map((y) =>
        COLUNAS.map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="30" height="26" rx="2" fill={P.detail} />),
      )}
      <rect x="184" y="218" width="32" height="32" rx="2" fill={P.detail} />
      <rect x="70" y="128" width="260" height="14" fill={P.roof} />
      <rect x="104" y="64" width="192" height="64" fill={P.wallAlt} />
      <rect x="104" y="52" width="192" height="12" fill={P.roof} />
      <rect x="124" y="78" width="70" height="38" rx="2" fill={P.detail} />
      <rect x="156" y="78" width="4" height="38" fill={P.wallAlt} />
      <rect x="208" y="78" width="70" height="38" rx="2" fill={P.detail} />
      <rect x="240" y="78" width="4" height="38" fill={P.wallAlt} />
      <rect x="70" y="106" width="34" height="22" fill={P.wallAlt} />
      <rect x="296" y="106" width="34" height="22" fill={P.wallAlt} />
      <rect x="70" y="102" width="260" height="4" fill={P.ink} />
      <rect x="296" y="102" width="34" height="4" fill={P.ink} />
      <circle cx="84" cy="94" r="10" fill={P.accent} />
      <circle cx="316" cy="94" r="10" fill={P.accent} />
      <rect x="82" y="104" width="4" height="2" fill={P.ink} />
      <rect x="314" y="104" width="4" height="2" fill={P.ink} />
      <rect x="338" y="196" width="28" height="54" fill={P.wallAlt} />
      <rect x="40" y="200" width="30" height="50" fill={P.wallAlt} />
    </Ilustracao>
  );
}
