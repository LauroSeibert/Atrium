import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

type Props = Omit<IlustracaoProps, "viewBox" | "titulo" | "children"> & { titulo?: string };

const BALAUSTRES = Array.from({ length: 17 }, (_, i) => 18 + i * 22);

/** Varanda com guarda-corpo, vista para prédios e árvores, mesa com duas cadeiras e vaso. */
export function ComodoVaranda({ titulo = "Ilustração de varanda com guarda-corpo", ...props }: Props) {
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />

      {/* sol */}
      <circle cx="336" cy="48" r="22" fill={P.accent} />

      {/* vista */}
      <rect x="20" y="70" width="46" height="62" fill={P.wallAlt} />
      <rect x="28" y="82" width="8" height="8" fill={P.detail} />
      <rect x="46" y="82" width="8" height="8" fill={P.detail} />
      <rect x="28" y="100" width="8" height="8" fill={P.detail} />
      <rect x="46" y="100" width="8" height="8" fill={P.detail} />
      <rect x="72" y="98" width="38" height="34" fill={P.wall} />
      <circle cx="160" cy="104" r="22" fill={P.wall} />
      <rect x="157" y="120" width="6" height="12" fill={P.ink} />
      <rect x="230" y="62" width="52" height="70" fill={P.wallAlt} />
      <rect x="240" y="74" width="8" height="8" fill={P.detail} />
      <rect x="262" y="74" width="8" height="8" fill={P.detail} />
      <rect x="240" y="94" width="8" height="8" fill={P.detail} />
      <rect x="262" y="94" width="8" height="8" fill={P.detail} />
      <rect x="288" y="92" width="38" height="40" fill={P.wall} />
      <circle cx="366" cy="106" r="20" fill={P.wall} />
      <rect x="363" y="120" width="6" height="12" fill={P.ink} />

      {/* piso */}
      <rect y="200" width="400" height="100" fill={P.ground} />

      {/* guarda-corpo */}
      <rect y="128" width="400" height="8" fill={P.roof} />
      {BALAUSTRES.map((x) => (
        <rect key={x} x={x} y="136" width="4" height="60" fill={P.roof} />
      ))}
      <rect y="192" width="400" height="8" fill={P.roof} />
      <rect x="0" y="120" width="12" height="80" fill={P.roof} />
      <rect x="388" y="120" width="12" height="80" fill={P.roof} />

      {/* mesa */}
      <ellipse cx="200" cy="248" rx="36" ry="8" fill={P.wall} />
      <rect x="197" y="250" width="6" height="30" fill={P.wall} />
      <rect x="184" y="280" width="32" height="5" rx="2" fill={P.wall} />
      <rect x="192" y="236" width="8" height="10" rx="2" fill={P.accent} />

      {/* cadeiras */}
      <rect x="82" y="222" width="8" height="34" rx="2" fill={P.wall} />
      <rect x="82" y="248" width="46" height="8" rx="3" fill={P.wall} />
      <rect x="86" y="256" width="5" height="26" fill={P.wall} />
      <rect x="120" y="256" width="5" height="26" fill={P.wall} />
      <rect x="310" y="222" width="8" height="34" rx="2" fill={P.wall} />
      <rect x="272" y="248" width="46" height="8" rx="3" fill={P.wall} />
      <rect x="275" y="256" width="5" height="26" fill={P.wall} />
      <rect x="309" y="256" width="5" height="26" fill={P.wall} />

      {/* vaso */}
      <polygon points="348,262 330,226 348,216" fill={P.accent} />
      <polygon points="348,262 368,224 348,212" fill={P.accent} />
      <polygon points="348,262 340,206 356,206" fill={P.accent} />
      <polygon points="330,262 366,262 362,292 334,292" fill={P.roof} />
    </Ilustracao>
  );
}
