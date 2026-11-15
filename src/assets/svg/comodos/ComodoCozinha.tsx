import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

type Props = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

/** Cozinha com armário aéreo, bancada com pia e fogão, geladeira e janela. */
export function ComodoCozinha({ titulo = "Ilustração de cozinha com bancada", ...props }: Props) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <rect y="220" width="400" height="80" fill={P.ground} />

      {/* luminária pendente */}
      <line x1="200" y1="0" x2="200" y2="20" stroke={P.roof} strokeWidth="2" />
      <polygon points="184,20 216,20 208,32 192,32" fill={P.accent} />

      {/* janela */}
      <rect x="150" y="40" width="100" height="72" fill={P.detail} stroke={P.roof} strokeWidth="3" />
      <line x1="200" y1="40" x2="200" y2="112" stroke={P.roof} strokeWidth="2" />

      {/* armário aéreo */}
      <rect x="20" y="24" width="112" height="72" rx="3" fill={P.wall} />
      <rect x="26" y="30" width="50" height="60" rx="2" fill={P.wallAlt} />
      <rect x="82" y="30" width="44" height="60" rx="2" fill={P.wallAlt} />
      <rect x="68" y="62" width="4" height="14" fill={P.detail} />
      <rect x="86" y="62" width="4" height="14" fill={P.detail} />

      {/* bancada */}
      <rect x="20" y="150" width="272" height="10" rx="2" fill={P.roof} />
      <rect x="24" y="160" width="264" height="62" fill={P.wall} />
      <rect x="30" y="168" width="60" height="46" rx="2" fill={P.wallAlt} />
      <rect x="98" y="168" width="82" height="46" rx="2" fill={P.wallAlt} />
      <rect x="82" y="186" width="4" height="12" fill={P.detail} />
      <rect x="104" y="186" width="4" height="12" fill={P.detail} />

      {/* pia */}
      <rect x="108" y="146" width="56" height="5" fill={P.roof} />
      <rect x="150" y="126" width="5" height="20" fill={P.roof} />
      <rect x="138" y="126" width="17" height="5" fill={P.roof} />

      {/* fogão */}
      <rect x="192" y="144" width="80" height="6" rx="2" fill={P.ink} />
      <rect x="202" y="124" width="28" height="20" rx="3" fill={P.roof} />
      <rect x="196" y="130" width="6" height="4" fill={P.roof} />
      <rect x="236" y="132" width="24" height="12" rx="3" fill={P.wallAlt} />
      <rect x="190" y="160" width="84" height="54" rx="3" fill={P.wallAlt} />
      <rect x="198" y="166" width="68" height="5" fill={P.detail} />
      <rect x="200" y="178" width="64" height="28" rx="2" fill={P.detail} />
      <rect x="208" y="186" width="48" height="12" rx="2" fill={P.ink} />

      {/* fruteira */}
      <polygon points="38,148 76,148 70,138 44,138" fill={P.roof} />
      <circle cx="50" cy="134" r="6" fill={P.accent} />
      <circle cx="62" cy="134" r="6" fill={P.accent} />

      {/* geladeira */}
      <rect x="304" y="50" width="70" height="172" rx="5" fill={P.wall} />
      <rect x="304" y="112" width="70" height="3" fill={P.sky} />
      <rect x="312" y="84" width="5" height="20" rx="2" fill={P.detail} />
      <rect x="312" y="124" width="5" height="36" rx="2" fill={P.detail} />
    </Ilustracao>
  );
}
