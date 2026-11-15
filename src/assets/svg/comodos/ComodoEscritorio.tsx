import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

type Props = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

/** Escritório com estante de livros, mesa com monitor e abajur, cadeira giratória e relógio. */
export function ComodoEscritorio({ titulo = "Ilustração de escritório com mesa e estante", ...props }: Props) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <rect y="220" width="400" height="80" fill={P.ground} />

      {/* estante */}
      <rect x="24" y="30" width="110" height="192" fill={P.wall} />
      <rect x="30" y="36" width="98" height="180" fill={P.sky} />
      <rect x="30" y="94" width="98" height="5" fill={P.wall} />
      <rect x="30" y="152" width="98" height="5" fill={P.wall} />
      <rect x="36" y="58" width="10" height="36" fill={P.wallAlt} />
      <rect x="48" y="66" width="8" height="28" fill={P.roof} />
      <rect x="58" y="54" width="12" height="40" fill={P.wall} />
      <rect x="72" y="62" width="9" height="32" fill={P.accent} />
      <rect x="83" y="56" width="10" height="38" fill={P.wallAlt} />
      <rect x="95" y="64" width="9" height="30" fill={P.roof} />
      <rect x="106" y="58" width="14" height="36" fill={P.wall} />
      <rect x="38" y="116" width="32" height="36" fill={P.wallAlt} />
      <polygon points="100,152 116,152 114,136 102,136" fill={P.roof} />
      <polygon points="108,136 98,118 108,112" fill={P.accent} />
      <polygon points="108,136 120,116 108,110" fill={P.accent} />
      <rect x="36" y="172" width="12" height="40" fill={P.roof} />
      <rect x="50" y="178" width="10" height="34" fill={P.wallAlt} />
      <rect x="62" y="170" width="12" height="42" fill={P.wall} />
      <rect x="76" y="176" width="26" height="36" fill={P.wallAlt} />
      <rect x="104" y="172" width="12" height="40" fill={P.roof} />

      {/* relógio */}
      <circle cx="350" cy="60" r="22" fill={P.roof} />
      <circle cx="350" cy="60" r="16" fill={P.detail} />
      <line x1="350" y1="60" x2="350" y2="48" stroke={P.roof} strokeWidth="2" />
      <line x1="350" y1="60" x2="359" y2="64" stroke={P.roof} strokeWidth="2" />

      {/* mesa */}
      <rect x="180" y="150" width="200" height="10" rx="2" fill={P.roof} />
      <rect x="186" y="160" width="8" height="62" fill={P.wall} />
      <rect x="318" y="160" width="56" height="62" fill={P.wall} />
      <rect x="324" y="168" width="44" height="20" rx="2" fill={P.wallAlt} />
      <rect x="324" y="194" width="44" height="20" rx="2" fill={P.wallAlt} />

      {/* monitor */}
      <rect x="248" y="92" width="86" height="46" rx="4" fill={P.wall} />
      <rect x="254" y="98" width="74" height="34" fill={P.detail} />
      <rect x="260" y="106" width="40" height="4" fill={P.wallAlt} />
      <rect x="260" y="116" width="28" height="4" fill={P.wallAlt} />
      <rect x="284" y="138" width="14" height="12" fill={P.wall} />
      <rect x="268" y="146" width="46" height="5" rx="2" fill={P.wall} />

      {/* abajur */}
      <rect x="194" y="142" width="22" height="8" rx="2" fill={P.ink} />
      <polyline points="205,142 212,114 228,102" fill="none" stroke={P.roof} strokeWidth="3" />
      <polygon points="218,98 246,98 238,114 224,114" fill={P.accent} />

      {/* cadeira */}
      <rect x="236" y="196" width="56" height="36" rx="10" fill={P.roof} />
      <rect x="230" y="230" width="68" height="10" rx="4" fill={P.wall} />
      <rect x="260" y="240" width="8" height="22" fill={P.ink} />
      <rect x="240" y="262" width="48" height="6" rx="3" fill={P.ink} />
      <circle cx="244" cy="274" r="4" fill={P.ink} />
      <circle cx="284" cy="274" r="4" fill={P.ink} />
    </Ilustracao>
  );
}
