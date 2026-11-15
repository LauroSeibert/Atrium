import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

type Props = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

/** Banheiro com box de vidro e chuveiro, vaso sanitário, pia com espelho e toalha. */
export function ComodoBanheiro({ titulo = "Ilustração de banheiro com box", ...props }: Props) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <rect y="220" width="400" height="80" fill={P.ground} />

      {/* box */}
      <rect x="30" y="36" width="120" height="180" fill={P.detail} fillOpacity="0.45" stroke={P.roof} strokeWidth="5" />
      <rect x="30" y="214" width="120" height="10" fill={P.roof} />
      <rect x="126" y="112" width="4" height="30" rx="2" fill={P.roof} />
      <rect x="56" y="36" width="5" height="34" fill={P.roof} />
      <polygon points="42,76 76,76 70,66 48,66" fill={P.roof} />
      <circle cx="50" cy="92" r="3" fill={P.wallAlt} />
      <circle cx="59" cy="104" r="3" fill={P.wallAlt} />
      <circle cx="68" cy="90" r="3" fill={P.wallAlt} />
      <circle cx="56" cy="120" r="3" fill={P.wallAlt} />
      <circle cx="68" cy="116" r="3" fill={P.wallAlt} />

      {/* vaso sanitário */}
      <rect x="196" y="120" width="50" height="46" rx="5" fill={P.wall} />
      <rect x="196" y="120" width="50" height="7" rx="3" fill={P.wallAlt} />
      <circle cx="221" cy="140" r="4" fill={P.detail} />
      <rect x="186" y="164" width="76" height="26" rx="12" fill={P.wall} />
      <polygon points="204,188 246,188 242,222 208,222" fill={P.wall} />

      {/* toalheiro */}
      <rect x="272" y="90" width="26" height="4" rx="2" fill={P.ink} />
      <rect x="276" y="94" width="18" height="44" rx="2" fill={P.accent} />

      {/* espelho */}
      <rect x="306" y="36" width="70" height="80" rx="6" fill={P.roof} />
      <rect x="312" y="42" width="58" height="68" rx="3" fill={P.detail} />

      {/* pia */}
      <rect x="338" y="132" width="6" height="14" fill={P.roof} />
      <rect x="304" y="146" width="74" height="20" rx="8" fill={P.wall} />
      <rect x="331" y="166" width="20" height="56" fill={P.wall} />

      {/* tapete */}
      <rect x="170" y="244" width="120" height="16" rx="8" fill={P.wallAlt} />
    </Ilustracao>
  );
}
