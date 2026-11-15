import { useId, type ReactNode } from "react";
import { Ilustracao, P, VIEWBOX, type IlustracaoProps } from "../Ilustracao";

export type AvatarVariante = 1 | 2 | 3 | 4 | 5 | 6;

export type AvatarIlustradoProps = Omit<IlustracaoProps, "viewBox" | "children" | "titulo"> & {
  variante: AvatarVariante;
  /** Descrição acessível; na prática, o nome da pessoa. */
  titulo?: string;
};

const FUNDO: Record<AvatarVariante, string> = {
  1: P.sky,
  2: P.ground,
  3: P.sky,
  4: P.ground,
  5: P.sky,
  6: P.ground,
};

const OMBROS = "M8 64C8 49 19 42 32 42S56 49 56 64Z";

/** Olhos e sorriso comuns a todas as variantes. */
const Rosto = (
  <>
    <circle cx="28" cy="26" r="1.4" fill={P.ink} />
    <circle cx="36" cy="26" r="1.4" fill={P.ink} />
    <path d="M29 31Q32 33.5 35 31" fill="none" stroke={P.ink} strokeWidth={1.2} strokeLinecap="round" />
  </>
);

const Oculos = (
  <>
    <circle cx="28" cy="26" r="4" fill="none" stroke={P.ink} strokeWidth={1.4} />
    <circle cx="36" cy="26" r="4" fill="none" stroke={P.ink} strokeWidth={1.4} />
  </>
);

function Corpo({ tras, frente }: { tras?: ReactNode; frente: ReactNode }) {
  return (
    <>
      {tras}
      <path d={OMBROS} fill={P.wall} />
      <rect x="28" y="33" width="8" height="10" fill={P.wallAlt} />
      <circle cx="32" cy="25" r="10.5" fill={P.wallAlt} />
      {frente}
    </>
  );
}

function Pessoa({ variante }: { variante: AvatarVariante }) {
  switch (variante) {
    case 1: // cabelo curto
      return (
        <Corpo
          frente={
            <>
              <path d="M21.5 25C21 14 27 11 32 11S43 14 42.5 25C40 20 36 18.5 32 18.5S24 20 21.5 25Z" fill={P.ink} />
              {Rosto}
            </>
          }
        />
      );
    case 2: // cabelo longo
      return (
        <Corpo
          tras={<rect x="19" y="13" width="26" height="34" rx="12" fill={P.ink} />}
          frente={
            <>
              <path d="M21.5 25C22 15 27 13 32 13S42 15 42.5 25C38 22 34 18 32 16C30 19 26 22 21.5 25Z" fill={P.ink} />
              {Rosto}
            </>
          }
        />
      );
    case 3: // coque
      return (
        <Corpo
          tras={<circle cx="32" cy="10.5" r="5.5" fill={P.ink} />}
          frente={
            <>
              <path
                d="M21.5 25C21 15 26 12.5 32 12.5S43 15 42.5 25C39 21 36 18.5 32 18.5S25 21 21.5 25Z"
                fill={P.ink}
              />
              {Rosto}
            </>
          }
        />
      );
    case 4: // barba e óculos
      return (
        <Corpo
          frente={
            <>
              <path d="M21.5 25C21 14 27 11 32 11S43 14 42.5 25C40 20 36 18 32 18S24 20 21.5 25Z" fill={P.ink} />
              <path d="M21.5 27C21.5 38 26 37 32 37S42.5 38 42.5 27C41 32 37 31 32 31S23 32 21.5 27Z" fill={P.ink} />
              {Oculos}
              <circle cx="28" cy="26" r="1.2" fill={P.ink} />
              <circle cx="36" cy="26" r="1.2" fill={P.ink} />
            </>
          }
        />
      );
    case 5: // chanel e óculos
      return (
        <Corpo
          tras={<rect x="19" y="14" width="26" height="22" rx="9" fill={P.ink} />}
          frente={
            <>
              <path
                d="M21.5 24C21.5 15 26 13.5 32 13.5S42.5 15 42.5 24C38 22 35 19 33 17C30 20 26 22 21.5 24Z"
                fill={P.ink}
              />
              {Oculos}
              <circle cx="28" cy="26" r="1.2" fill={P.ink} />
              <circle cx="36" cy="26" r="1.2" fill={P.ink} />
              <path d="M29 31.5Q32 34 35 31.5" fill="none" stroke={P.ink} strokeWidth={1.2} strokeLinecap="round" />
            </>
          }
        />
      );
    case 6: // cabelo cacheado
      return (
        <Corpo
          tras={
            <>
              <circle cx="22.5" cy="19" r="5.5" fill={P.ink} />
              <circle cx="41.5" cy="19" r="5.5" fill={P.ink} />
            </>
          }
          frente={
            <>
              <circle cx="26" cy="13.5" r="5.5" fill={P.ink} />
              <circle cx="32" cy="12" r="5.5" fill={P.ink} />
              <circle cx="38" cy="13.5" r="5.5" fill={P.ink} />
              <path d="M22 22C26 19 38 19 42 22C42 18 38 17 32 17S22 18 22 22Z" fill={P.ink} />
              {Rosto}
              <polygon points="26,43 32,50 38,43 40,46 32,54 24,46" fill={P.detail} />
            </>
          }
        />
      );
  }
}

/** Busto geométrico de pessoa (6 variantes: cabelo, óculos, barba, coque…). */
export function AvatarIlustrado({ variante, titulo = "Avatar ilustrado", ...props }: AvatarIlustradoProps) {
  const clipId = useId();
  return (
    <Ilustracao viewBox={VIEWBOX.avatar} titulo={titulo} {...props}>
      <clipPath id={clipId}>
        <circle cx="32" cy="32" r="32" fill={P.sky} />
      </clipPath>
      <circle cx="32" cy="32" r="32" fill={FUNDO[variante]} />
      <g clipPath={`url(#${clipId})`} fill={P.wall}>
        <Pessoa variante={variante} />
      </g>
    </Ilustracao>
  );
}
