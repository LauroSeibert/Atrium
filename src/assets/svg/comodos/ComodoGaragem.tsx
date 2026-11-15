import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

type Props = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

/** Garagem com portão de enrolar aberto, carro de frente, estante com caixas e luminária. */
export function ComodoGaragem({ titulo = "Ilustração de garagem com carro", ...props }: Props) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <rect y="220" width="400" height="80" fill={P.ground} />

      {/* vão e portão enrolado */}
      <rect x="24" y="36" width="352" height="190" fill={P.sky} stroke={P.roof} strokeWidth="6" />
      <rect x="27" y="39" width="346" height="34" fill={P.wallAlt} />
      <line x1="27" y1="50" x2="373" y2="50" stroke={P.wall} strokeWidth="2" />
      <line x1="27" y1="61" x2="373" y2="61" stroke={P.wall} strokeWidth="2" />

      {/* luminária */}
      <line x1="200" y1="73" x2="200" y2="86" stroke={P.roof} strokeWidth="2" />
      <polygon points="186,86 214,86 208,96 192,96" fill={P.accent} />

      {/* estante */}
      <rect x="44" y="150" width="58" height="5" fill={P.roof} />
      <rect x="50" y="126" width="24" height="24" fill={P.wall} />
      <rect x="78" y="134" width="20" height="16" fill={P.wallAlt} />
      <rect x="48" y="155" width="4" height="30" fill={P.roof} />
      <rect x="94" y="155" width="4" height="30" fill={P.roof} />

      {/* balde */}
      <polygon points="324,196 352,196 348,222 328,222" fill={P.wallAlt} />
      <rect x="322" y="192" width="32" height="5" fill={P.wall} />

      {/* carro */}
      <polygon points="138,152 160,112 240,112 262,152" fill={P.wall} />
      <polygon points="150,148 166,121 234,121 250,148" fill={P.detail} />
      <rect x="108" y="148" width="184" height="58" rx="12" fill={P.wall} />
      <rect x="118" y="164" width="30" height="16" rx="4" fill={P.detail} />
      <rect x="252" y="164" width="30" height="16" rx="4" fill={P.detail} />
      <rect x="162" y="172" width="76" height="14" rx="3" fill={P.wallAlt} />
      <rect x="170" y="194" width="60" height="6" rx="2" fill={P.detail} />
      <rect x="118" y="200" width="28" height="22" rx="4" fill={P.ink} />
      <rect x="254" y="200" width="28" height="22" rx="4" fill={P.ink} />
    </Ilustracao>
  );
}
