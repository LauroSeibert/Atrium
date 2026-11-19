import type { ReactNode } from "react";
import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";
import type { FachadaVariante } from "./SvgFachada";

/**
 * Fachadas em traço (DESIGN.md §5 "Property tiles"): linha de 1,3 no tom da parede, centrada a ~58% da
 * largura, sobre o fundo do ladrilho. Desenho em 160×110, escalado para a cena 4:3 (400×300).
 */
const TRACOS: Record<FachadaVariante, ReactNode> = {
  terrea: (
    <>
      <path d="M14 96h132" />
      <path d="M38 96V58L80 28l42 30v38" />
      <path d="M30 64 80 22l50 42" />
      <path d="M71 96V74h18v22" />
      <rect x="48" y="66" width="14" height="12" />
      <rect x="98" y="66" width="14" height="12" />
      <path d="M104 40V28h8v18" />
    </>
  ),
  sobrado: (
    <>
      <path d="M14 96h132" />
      <path d="M42 96V46h76v50" />
      <path d="M34 52 80 18l46 34" />
      <path d="M42 71h76" />
      <rect x="52" y="53" width="14" height="11" />
      <rect x="94" y="53" width="14" height="11" />
      <rect x="52" y="78" width="14" height="11" />
      <path d="M86 96V78h14v18" />
    </>
  ),
  moderna: (
    <>
      <path d="M14 96h132" />
      <path d="M30 96V58h62v38" />
      <path d="M66 58V36h68v28H92" />
      <path d="M76 46h48" />
      <rect x="40" y="68" width="30" height="16" />
      <path d="M78 96V70h10v26" />
      <path d="M108 96V64" />
    </>
  ),
  predio: (
    <>
      <path d="M12 98h136" />
      <rect x="52" y="14" width="56" height="84" />
      <rect x="62" y="26" width="10" height="8" />
      <rect x="88" y="26" width="10" height="8" />
      <rect x="62" y="44" width="10" height="8" />
      <rect x="88" y="44" width="10" height="8" />
      <rect x="62" y="62" width="10" height="8" />
      <rect x="88" y="62" width="10" height="8" />
      <path d="M74 98V82h12v16" />
      <path d="M24 98V60h20v38M116 98V68h18v30" />
    </>
  ),
  cobertura: (
    <>
      <path d="M12 98h136" />
      <rect x="54" y="30" width="52" height="68" />
      <path d="M62 30V16h30v14" />
      <path d="M54 30h52M98 30v-6h8" />
      <rect x="66" y="20" width="12" height="7" />
      <rect x="62" y="40" width="10" height="8" />
      <rect x="88" y="40" width="10" height="8" />
      <rect x="62" y="58" width="10" height="8" />
      <rect x="88" y="58" width="10" height="8" />
      <path d="M74 98V80h12v18" />
      <path d="M26 98V66h18v32M116 98V72h18v26" />
    </>
  ),
  campo: (
    <>
      <path d="M10 96h140" />
      <path d="M50 96V64l26-22 26 22v32" />
      <path d="M44 68 76 40l32 28" />
      <path d="M70 96V78h12v18" />
      <rect x="88" y="72" width="10" height="9" />
      <circle cx="124" cy="58" r="13" />
      <path d="M124 71v25" />
      <path d="M14 86h28M18 82v14M28 82v14M38 82v14" />
    </>
  ),
  comercial: (
    <>
      <path d="M12 98h136" />
      <path d="M30 24h100" />
      <rect x="38" y="24" width="84" height="74" />
      <rect x="48" y="34" width="12" height="9" />
      <rect x="68" y="34" width="12" height="9" />
      <rect x="88" y="34" width="12" height="9" />
      <rect x="48" y="50" width="12" height="9" />
      <rect x="68" y="50" width="12" height="9" />
      <rect x="88" y="50" width="12" height="9" />
      <path d="M32 68h96" />
      <rect x="46" y="76" width="34" height="22" />
      <rect x="88" y="76" width="14" height="22" />
    </>
  ),
  terreno: (
    <>
      <path d="M14 96h132" />
      <path d="M14 96c18-12 36-16 56-8 18 7 30 2 44-4 12-5 22-3 32 4" />
      <path d="M106 96V58" />
      <rect x="88" y="38" width="38" height="20" />
      <path d="M94 45h20M94 51h26" />
      <path d="M36 96V84M58 96V84M36 88h22" />
    </>
  ),
};

const TITULOS: Record<FachadaVariante, string> = {
  terrea: "Ilustração de casa térrea",
  sobrado: "Ilustração de sobrado de dois andares",
  moderna: "Ilustração de casa moderna com volumes retos",
  predio: "Ilustração de prédio de apartamentos",
  cobertura: "Ilustração de cobertura no topo de um prédio",
  campo: "Ilustração de casa de campo",
  comercial: "Ilustração de sala comercial",
  terreno: "Ilustração de terreno vazio com placa",
};

export type FachadaLinhaProps = Omit<IlustracaoProps, "viewBox" | "children" | "titulo"> & {
  variante: FachadaVariante;
  titulo?: string;
};

export function FachadaLinha({ variante, titulo = TITULOS[variante], ...props }: FachadaLinhaProps) {
  // 160×110 → 58% de 400 = 232 de largura (escala 1,45), centrado na cena.
  return (
    <Ilustracao viewBox={VIEWBOX.cena} titulo={titulo} {...props}>
      <rect width="400" height="300" fill={P.sky} />
      <g
        transform="translate(84 70) scale(1.45)"
        fill="none"
        stroke={P.wall}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {TRACOS[variante]}
      </g>
    </Ilustracao>
  );
}
