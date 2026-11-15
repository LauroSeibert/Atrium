import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

type Props = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

/** Sala de estar com sofá, janela, quadro, luminária e planta. */
export function ComodoSala({ titulo = "Ilustração de sala de estar com sofá", ...props }: Props) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <rect y="220" width="400" height="80" fill={P.ground} />

      {/* janela */}
      <rect x="40" y="30" width="100" height="90" fill={P.detail} stroke={P.roof} strokeWidth="3" />
      <line x1="90" y1="30" x2="90" y2="120" stroke={P.roof} strokeWidth="2" />
      <line x1="40" y1="75" x2="140" y2="75" stroke={P.roof} strokeWidth="2" />
      <rect x="34" y="120" width="112" height="8" fill={P.roof} />

      {/* quadro */}
      <rect x="200" y="44" width="90" height="62" rx="2" fill={P.roof} />
      <rect x="208" y="52" width="74" height="46" fill={P.detail} />
      <polygon points="208,98 232,72 250,88 262,78 282,98" fill={P.wallAlt} />
      <circle cx="268" cy="64" r="6" fill={P.accent} />

      {/* tapete */}
      <rect x="104" y="246" width="240" height="30" rx="4" fill={P.wallAlt} />

      {/* sofá */}
      <rect x="140" y="148" width="190" height="62" rx="8" fill={P.wall} />
      <rect x="136" y="196" width="198" height="30" rx="6" fill={P.wall} />
      <rect x="124" y="164" width="30" height="64" rx="10" fill={P.wall} />
      <rect x="316" y="164" width="30" height="64" rx="10" fill={P.wall} />
      <rect x="160" y="168" width="78" height="30" rx="6" fill={P.wallAlt} />
      <rect x="242" y="168" width="78" height="30" rx="6" fill={P.wallAlt} />
      <rect x="266" y="160" width="28" height="28" rx="5" fill={P.accent} />
      <rect x="140" y="226" width="8" height="8" fill={P.ink} />
      <rect x="322" y="226" width="8" height="8" fill={P.ink} />

      {/* luminária */}
      <ellipse cx="372" cy="221" rx="13" ry="3" fill={P.ink} />
      <rect x="370" y="130" width="4" height="90" fill={P.ink} />
      <polygon points="356,130 388,130 380,100 364,100" fill={P.accent} />

      {/* planta */}
      <polygon points="76,190 56,156 76,148" fill={P.accent} />
      <polygon points="76,190 98,154 76,144" fill={P.accent} />
      <polygon points="76,190 68,138 84,138" fill={P.accent} />
      <polygon points="54,190 98,190 90,226 62,226" fill={P.roof} />
    </Ilustracao>
  );
}
