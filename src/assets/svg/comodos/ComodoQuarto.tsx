import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

type Props = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

/** Quarto com cama de casal, criado-mudo com abajur, janela e espelho redondo. */
export function ComodoQuarto({ titulo = "Ilustração de quarto com cama de casal", ...props }: Props) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <rect y="220" width="400" height="80" fill={P.ground} />

      {/* janela */}
      <rect x="24" y="40" width="56" height="92" fill={P.detail} stroke={P.roof} strokeWidth="3" />
      <line x1="24" y1="86" x2="80" y2="86" stroke={P.roof} strokeWidth="2" />
      <rect x="18" y="132" width="68" height="7" fill={P.roof} />

      {/* espelho */}
      <circle cx="200" cy="58" r="28" fill={P.roof} />
      <circle cx="200" cy="58" r="21" fill={P.detail} />

      {/* tapete */}
      <rect x="64" y="248" width="272" height="28" rx="4" fill={P.wallAlt} />

      {/* cama */}
      <rect x="92" y="98" width="216" height="100" rx="8" fill={P.roof} />
      <rect x="80" y="170" width="240" height="52" rx="6" fill={P.wall} />
      <rect x="80" y="190" width="240" height="30" rx="4" fill={P.wallAlt} />
      <rect x="112" y="150" width="76" height="28" rx="10" fill={P.detail} />
      <rect x="212" y="150" width="76" height="28" rx="10" fill={P.detail} />
      <rect x="84" y="222" width="10" height="10" fill={P.ink} />
      <rect x="306" y="222" width="10" height="10" fill={P.ink} />
      <rect x="264" y="198" width="36" height="14" rx="5" fill={P.accent} />

      {/* criado-mudo e abajur */}
      <rect x="332" y="170" width="50" height="52" rx="3" fill={P.wall} />
      <rect x="338" y="178" width="38" height="16" rx="2" fill={P.wallAlt} />
      <rect x="338" y="200" width="38" height="16" rx="2" fill={P.wallAlt} />
      <rect x="354" y="136" width="6" height="34" fill={P.ink} />
      <polygon points="340,138 374,138 366,112 348,112" fill={P.accent} />
    </Ilustracao>
  );
}
