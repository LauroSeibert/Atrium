import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

type Props = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

/** Área gourmet com churrasqueira de alvenaria, bancada, banquetas e pendentes. */
export function ComodoAreaGourmet({ titulo = "Ilustração de área gourmet com churrasqueira", ...props }: Props) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <rect y="220" width="400" height="80" fill={P.ground} />

      {/* pendentes */}
      <line x1="70" y1="0" x2="70" y2="40" stroke={P.roof} strokeWidth="2" />
      <polygon points="54,40 86,40 78,54 62,54" fill={P.accent} />
      <line x1="140" y1="0" x2="140" y2="40" stroke={P.roof} strokeWidth="2" />
      <polygon points="124,40 156,40 148,54 132,54" fill={P.accent} />

      {/* prateleira */}
      <rect x="40" y="94" width="130" height="5" fill={P.roof} />
      <rect x="52" y="76" width="16" height="18" fill={P.wall} />
      <rect x="100" y="80" width="20" height="14" fill={P.wallAlt} />
      <rect x="136" y="72" width="16" height="22" fill={P.wall} />

      {/* churrasqueira */}
      <rect x="276" y="14" width="38" height="52" fill={P.wall} />
      <polygon points="236,104 354,104 320,62 270,62" fill={P.wall} />
      <rect x="226" y="100" width="138" height="122" fill={P.wall} />
      <rect x="226" y="96" width="138" height="8" fill={P.roof} />
      <rect x="246" y="136" width="98" height="56" rx="2" fill={P.ink} />
      <line x1="246" y1="150" x2="344" y2="150" stroke={P.detail} strokeWidth="2" />
      <line x1="246" y1="162" x2="344" y2="162" stroke={P.detail} strokeWidth="2" />
      <polygon points="274,192 284,166 292,180 302,160 312,192" fill={P.accent} />

      {/* bancada */}
      <rect x="26" y="152" width="170" height="10" rx="2" fill={P.roof} />
      <rect x="32" y="162" width="158" height="58" fill={P.wall} />
      <rect x="40" y="170" width="70" height="42" rx="2" fill={P.wallAlt} />
      <rect x="116" y="170" width="68" height="42" rx="2" fill={P.wallAlt} />
      <rect x="52" y="130" width="14" height="22" rx="3" fill={P.wall} />
      <polygon points="120,152 150,152 146,138 124,138" fill={P.wall} />

      {/* banquetas */}
      <rect x="54" y="238" width="38" height="8" rx="3" fill={P.wall} />
      <rect x="60" y="246" width="4" height="34" fill={P.wall} />
      <rect x="82" y="246" width="4" height="34" fill={P.wall} />
      <rect x="128" y="238" width="38" height="8" rx="3" fill={P.wall} />
      <rect x="134" y="246" width="4" height="34" fill={P.wall} />
      <rect x="156" y="246" width="4" height="34" fill={P.wall} />
    </Ilustracao>
  );
}
