import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

type Props = Omit<IlustracaoProps, "viewBox" | "children" | "titulo"> & { titulo?: string };

/** Casa com sinal de alerta: algo deu errado. */
export function VazioErro({ titulo = "Ilustração de casa com sinal de alerta: algo deu errado", ...props }: Props) {
  return (
    <Ilustracao viewBox={VIEWBOX.vazio} titulo={titulo} {...props}>
      <rect width="240" height="180" rx="12" fill={P.sky} />
      <path d="M0 140H240V168a12 12 0 0 1-12 12H12A12 12 0 0 1 0 168Z" fill={P.ground} />
      <circle cx="198" cy="34" r="8" fill={P.accent} />
      <ellipse cx="104" cy="146" rx="56" ry="6" fill={P.ink} fillOpacity={0.15} />
      <polygon points="96,42 148,82 44,82" fill={P.roof} />
      <rect x="54" y="82" width="84" height="60" fill={P.wall} />
      <rect x="62" y="94" width="16" height="16" rx="2" fill={P.detail} />
      <rect x="86" y="108" width="20" height="34" rx="2" fill={P.wallAlt} />
      <rect x="114" y="94" width="16" height="16" rx="2" fill={P.detail} />
      <polygon points="162,62 194,122 130,122" fill={P.roof} stroke={P.ink} strokeWidth={3} strokeLinejoin="round" />
      <rect x="159" y="80" width="6" height="22" rx="3" fill={P.detail} />
      <circle cx="162" cy="111" r="3.5" fill={P.detail} />
    </Ilustracao>
  );
}
