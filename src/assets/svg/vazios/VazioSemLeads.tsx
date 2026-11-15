import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

type Props = Omit<IlustracaoProps, "viewBox" | "children" | "titulo"> & { titulo?: string };

/** Caixa de entrada vazia: nenhum lead. */
export function VazioSemLeads({ titulo = "Ilustração de caixa de entrada vazia: nenhum lead", ...props }: Props) {
  return (
    <Ilustracao viewBox={VIEWBOX.vazio} titulo={titulo} {...props}>
      <rect width="240" height="180" rx="12" fill={P.sky} />
      <path d="M0 140H240V168a12 12 0 0 1-12 12H12A12 12 0 0 1 0 168Z" fill={P.ground} />
      <circle cx="190" cy="36" r="9" fill={P.accent} />
      <ellipse cx="120" cy="148" rx="62" ry="6" fill={P.ink} fillOpacity={0.15} />
      <polygon points="84,50 156,50 186,92 54,92" fill={P.wallAlt} />
      <polygon points="96,58 144,58 160,80 80,80" fill={P.roof} />
      <polygon
        points="54,92 94,92 100,112 140,112 146,92 186,92 186,146 54,146"
        fill={P.wall}
        stroke={P.ink}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <rect x="70" y="124" width="36" height="6" rx="3" fill={P.detail} />
      <rect x="190" y="118" width="20" height="24" rx="3" fill={P.wallAlt} />
      <path d="M200 118c-6-10 0-18 0-18s6 8 0 18Z" fill={P.accent} />
    </Ilustracao>
  );
}
