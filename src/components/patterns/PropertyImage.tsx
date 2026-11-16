import { ImageOff } from "lucide-react";
import { SvgComodo } from "@/assets/svg/comodos/SvgComodo";
import { SvgFachada } from "@/assets/svg/casas/SvgFachada";
import type { Fachada, TipoComodo, TipoImovel } from "@/domain/imovel/schema";
import { cn } from "@/lib/cn";
import { Icon } from "../ui/Icon";

const FACHADA_POR_TIPO: Record<TipoImovel, Fachada> = {
  casa: "terrea",
  apartamento: "predio",
  cobertura: "cobertura",
  terreno: "terreno",
  comercial: "comercial",
};

/** Fachada ilustrada usada quando o imóvel não define uma (`fachada === undefined`). */
export function fachadaPadrao(tipo: TipoImovel): Fachada {
  return FACHADA_POR_TIPO[tipo];
}

export type PropertyImageProps = {
  tipo: TipoImovel;
  /** `undefined` deriva do tipo; `null` = imóvel sem ilustração (mostra o fallback). */
  fachada?: Fachada | null;
  /** Quando informado, tem prioridade e mostra a ilustração do cômodo. */
  comodo?: TipoComodo;
  /** Descrição acessível; sem ela vale o título padrão da ilustração. */
  titulo?: string;
  /** Quando o texto ao lado já descreve o imóvel. */
  decorativa?: boolean;
  className?: string;
};

const MOLDURA = "aspect-4/3 overflow-hidden rounded-lg bg-surface-sunken";

/** Ilustração do imóvel: cômodo, fachada escolhida, fachada derivada do tipo ou fallback. */
export function PropertyImage({ tipo, fachada, comodo, titulo, decorativa, className }: PropertyImageProps) {
  if (comodo) {
    return (
      <div className={cn(MOLDURA, className)}>
        <SvgComodo variant={comodo} titulo={titulo} decorativa={decorativa} />
      </div>
    );
  }

  if (fachada === null) {
    const rotulo = titulo ?? "Imóvel sem ilustração";
    return (
      <div
        role={decorativa ? undefined : "img"}
        aria-label={decorativa ? undefined : rotulo}
        aria-hidden={decorativa ? true : undefined}
        className={cn(MOLDURA, "flex flex-col items-center justify-center gap-2", className)}
      >
        <Icon icon={ImageOff} size={24} className="text-text-2" />
        <span className="text-sm text-text-2">Sem ilustração</span>
      </div>
    );
  }

  return (
    <div className={cn(MOLDURA, className)}>
      <SvgFachada variant={fachada ?? fachadaPadrao(tipo)} titulo={titulo} decorativa={decorativa} />
    </div>
  );
}
