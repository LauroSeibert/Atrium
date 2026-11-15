import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

type Props = Omit<IlustracaoProps, "viewBox" | "children" | "titulo"> & { titulo?: string };

/** Prancheta com documento em branco: nenhum contrato. */
export function VazioSemContratos({
  titulo = "Ilustração de prancheta com documento em branco: nenhum contrato",
  ...props
}: Props) {
  return (
    <Ilustracao viewBox={VIEWBOX.vazio} titulo={titulo} {...props}>
      <rect width="240" height="180" rx="12" fill={P.sky} />
      <path d="M0 140H240V168a12 12 0 0 1-12 12H12A12 12 0 0 1 0 168Z" fill={P.ground} />
      <circle cx="46" cy="38" r="9" fill={P.accent} />
      <ellipse cx="116" cy="150" rx="46" ry="5" fill={P.ink} fillOpacity={0.15} />
      <rect x="76" y="26" width="80" height="122" rx="6" fill={P.wall} stroke={P.ink} strokeWidth={3} />
      <rect x="84" y="42" width="64" height="98" rx="2" fill={P.detail} />
      <polygon points="130,42 148,42 148,60" fill={P.wallAlt} />
      <rect x="100" y="18" width="32" height="18" rx="4" fill={P.roof} stroke={P.ink} strokeWidth={3} />
      <circle cx="116" cy="27" r="3" fill={P.detail} />
      <polygon points="178,64 186,64 186,128 182,136 178,128" fill={P.accent} />
      <polygon points="178,64 186,64 186,72 178,72" fill={P.wallAlt} />
    </Ilustracao>
  );
}
