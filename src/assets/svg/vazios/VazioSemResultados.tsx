import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

type Props = Omit<IlustracaoProps, "viewBox" | "children" | "titulo"> & { titulo?: string };

/** Lupa sobre uma casa: busca sem resultados. */
export function VazioSemResultados({
  titulo = "Ilustração de lupa sobre uma casa: nenhum resultado",
  ...props
}: Props) {
  return (
    <Ilustracao viewBox={VIEWBOX.vazio} titulo={titulo} {...props}>
      <rect width="240" height="180" rx="12" fill={P.sky} />
      <path d="M0 140H240V168a12 12 0 0 1-12 12H12A12 12 0 0 1 0 168Z" fill={P.ground} />
      <circle cx="40" cy="38" r="9" fill={P.accent} />
      <ellipse cx="94" cy="146" rx="52" ry="6" fill={P.ink} fillOpacity={0.15} />
      <polygon points="94,52 142,88 46,88" fill={P.roof} />
      <rect x="54" y="88" width="80" height="54" fill={P.wall} />
      <rect x="62" y="98" width="16" height="16" rx="2" fill={P.detail} />
      <rect x="110" y="98" width="16" height="16" rx="2" fill={P.detail} />
      <rect x="84" y="108" width="20" height="34" rx="2" fill={P.wallAlt} />
      <line x1="170" y1="108" x2="196" y2="134" stroke={P.ink} strokeWidth={8} strokeLinecap="round" />
      <circle cx="154" cy="92" r="28" fill={P.detail} stroke={P.ink} strokeWidth={4} />
      <path d="M140 84a16 16 0 0 1 12-8" fill="none" stroke={P.wallAlt} strokeWidth={3} strokeLinecap="round" />
    </Ilustracao>
  );
}
