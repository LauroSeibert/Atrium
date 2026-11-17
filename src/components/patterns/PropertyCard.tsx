/**
 * PropertyCard (grade) e peças compartilhadas com PropertyRow (lista).
 * RF-20 (listagem em grade/lista), RF-28 (favorito), RF-25 (ações de status vêm prontas por prop).
 *
 * Só props: o composto emite intenção (`onAlternarFavorito`, `acao.onSelect`) e não decide
 * transições; cada ação chega com a `Permissao` já calculada pelo domínio (ESTADOS §2 regra 3).
 */
import Link from "next/link";
import { BedDouble, Car, Heart, Maximize2, MoreHorizontal, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Corretor } from "@/domain/corretor/schema";
import type { Permissao } from "@/domain/comum/tipos";
import type { Imovel } from "@/domain/imovel/schema";
import { cn } from "@/lib/cn";
import { formatArea, formatMoeda } from "@/lib/format";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu";
import { Icon } from "../ui/Icon";
import { Destaque } from "../ui/Typography";
import { Skeleton } from "../ui/Skeleton";
import { PropertyImage } from "./PropertyImage";
import { FINALIDADE_ROTULO, STATUS_IMOVEL_UI } from "./rotulos";

export type AcaoImovel = {
  id: string;
  rotulo: string;
  icone?: LucideIcon;
  /** Já calculada pelo domínio; negada = item desabilitado com o motivo visível. */
  permissao: Permissao;
  destrutiva?: boolean;
  onSelect: () => void;
};

export type PropertyItemProps = {
  imovel: Imovel;
  /** Corretor responsável (opcional). */
  corretor?: Pick<Corretor, "nome">;
  /** Destino do detalhe (`/imoveis/[id]`). */
  href: string;
  acoes?: AcaoImovel[];
  onAlternarFavorito?: (id: string) => void;
  className?: string;
};

/** Preço em destaque; locação mostra "/mês". */
export function PrecoImovel({
  imovel,
  tamanho = "2xl",
  className,
}: {
  imovel: Imovel;
  tamanho?: "2xl" | "3xl";
  className?: string;
}) {
  return (
    <p className={cn("text-text", className)}>
      <Destaque valor={formatMoeda(imovel.preco, { semCentavos: true })} size={tamanho} />
      {imovel.finalidade === "locacao" ? <span className="ml-1 text-sm text-text-muted">/mês</span> : null}
    </p>
  );
}

function Spec({ icone, valor, rotulo }: { icone: LucideIcon; valor: string; rotulo: string }) {
  return (
    <li className="flex items-center gap-1">
      <Icon icon={icone} size={16} className="text-text-muted" />
      <span className="tnum">{valor}</span>
      <span className="sr-only">{rotulo}</span>
    </li>
  );
}

/** Quartos, vagas e área com ícones; terreno mostra só a área. */
export function SpecsImovel({ imovel, className }: { imovel: Imovel; className?: string }) {
  const terreno = imovel.tipo === "terreno";
  return (
    <ul aria-label="Características" className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-sm", className)}>
      {terreno ? null : (
        <>
          <Spec icone={BedDouble} valor={String(imovel.quartos)} rotulo={imovel.quartos === 1 ? "quarto" : "quartos"} />
          <Spec icone={Car} valor={String(imovel.vagas)} rotulo={imovel.vagas === 1 ? "vaga" : "vagas"} />
        </>
      )}
      <Spec
        icone={Maximize2}
        valor={formatArea(terreno ? imovel.areaTotal : imovel.areaUtil)}
        rotulo={terreno ? "de área total" : "de área útil"}
      />
    </ul>
  );
}

/** Pílula de finalidade (Venda/Locação) sobre fundo claro; usada sobre o ladrilho. */
export function PilulaFinalidade({ imovel, className }: { imovel: Imovel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-surface px-2.5 py-1 text-2xs font-medium tracking-wide text-text uppercase",
        className,
      )}
    >
      {FINALIDADE_ROTULO[imovel.finalidade]}
    </span>
  );
}

/** Código (mono) e status em uma linha de apoio. */
export function CodigoStatusImovel({ imovel, className }: { imovel: Imovel; className?: string }) {
  return (
    <p className={cn("text-xs text-text-muted", className)}>
      <span className="num">{imovel.codigo}</span>
      <span aria-hidden="true"> · </span>
      <span>{STATUS_IMOVEL_UI[imovel.status].rotulo}</span>
    </p>
  );
}

/** Status (pílula), finalidade e código em uma linha. */
export function SelosImovel({ imovel }: { imovel: Imovel }) {
  const status = STATUS_IMOVEL_UI[imovel.status];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={status.tom} size="sm" dot>
        {status.rotulo}
      </Badge>
      <Badge size="sm">{FINALIDADE_ROTULO[imovel.finalidade]}</Badge>
      <span className="num text-xs text-text-muted">{imovel.codigo}</span>
    </div>
  );
}

export function LocalImovel({ imovel }: { imovel: Imovel }) {
  return (
    <p className="truncate text-sm text-text-muted">
      {imovel.endereco.bairro}, {imovel.endereco.cidade}
    </p>
  );
}

const alvo = "max-sm:h-11 max-sm:w-11";

export function BotaoFavorito({
  imovel,
  onAlternarFavorito,
  className,
}: {
  imovel: Imovel;
  onAlternarFavorito?: (id: string) => void;
  className?: string;
}) {
  return (
    <Button
      variant="secondary"
      icon={Heart}
      aria-label={`Favoritar imóvel ${imovel.codigo}`}
      aria-pressed={imovel.favorito}
      onClick={() => onAlternarFavorito?.(imovel.id)}
      className={cn(
        alvo,
        "relative z-10 rounded-full border-transparent bg-surface/90 transition-colors duration-(--dur-fast) ease-standard",
        imovel.favorito && "text-danger [&_svg]:fill-current",
        className,
      )}
    />
  );
}

export function MenuAcoesImovel({
  imovel,
  acoes,
  className,
}: {
  imovel: Imovel;
  acoes: AcaoImovel[];
  className?: string;
}) {
  if (acoes.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          icon={MoreHorizontal}
          aria-label={`Mais ações do imóvel ${imovel.codigo}`}
          className={cn(alvo, "relative z-10 rounded-full border-transparent bg-surface/90", className)}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {acoes.map((a) => (
          <DropdownMenuItem
            key={a.id}
            icon={a.icone}
            tone={a.destrutiva ? "destructive" : "default"}
            aria-disabled={!a.permissao.ok || undefined}
            onSelect={(e) => {
              if (!a.permissao.ok) return e.preventDefault(); // negado: continua aberto, com o motivo visível
              a.onSelect();
            }}
            className="h-auto min-h-9 py-1 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
          >
            <span className="flex flex-col">
              <span>{a.rotulo}</span>
              {a.permissao.ok ? null : <span className="max-w-56 text-xs text-text-muted">{a.permissao.motivo}</span>}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Título como link esticado: cobre o card inteiro sem aninhar botões dentro do <a>. */
export function TituloImovel({ imovel, href, className }: { imovel: Imovel; href: string; className?: string }) {
  return (
    <h3 className={cn("text-base font-medium text-text", className)}>
      <Link
        href={href}
        title={imovel.titulo}
        className="line-clamp-1 rounded-sm underline-offset-4 group-hover:underline after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {imovel.titulo}
      </Link>
    </h3>
  );
}

export function ResponsavelImovel({ corretor }: { corretor?: Pick<Corretor, "nome"> }): ReactNode {
  if (!corretor) return null;
  return (
    <p className="flex items-center gap-2 text-xs text-text-muted">
      <Avatar name={corretor.nome} size={24} />
      <span className="sr-only">Responsável: </span>
      <span className="truncate">{corretor.nome}</span>
    </p>
  );
}

/** Cartão de imóvel para a grade (RF-20, RF-28): o ladrilho é o objeto, sem caixa em volta. */
export function PropertyCard({ imovel, corretor, href, acoes = [], onAlternarFavorito, className }: PropertyItemProps) {
  return (
    <article
      aria-label={`${imovel.codigo}: ${imovel.titulo}`}
      className={cn("group relative flex h-full min-w-0 flex-col gap-4", className)}
    >
      <div className="relative overflow-hidden rounded-lg">
        <PropertyImage
          tipo={imovel.tipo}
          fachada={imovel.fachada}
          decorativa
          className="transition-transform duration-(--dur-slow) ease-standard group-hover:scale-102 motion-reduce:group-hover:scale-100"
        />
        <PilulaFinalidade imovel={imovel} className="absolute top-3 left-3" />
        <div className="absolute top-2 right-2 flex gap-1.5">
          <BotaoFavorito imovel={imovel} onAlternarFavorito={onAlternarFavorito} />
          <MenuAcoesImovel imovel={imovel} acoes={acoes} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <CodigoStatusImovel imovel={imovel} />
        <TituloImovel imovel={imovel} href={href} />
        <p className="truncate text-caption text-text-muted">{imovel.endereco.bairro}</p>
        <PrecoImovel imovel={imovel} className="mt-2" />
        <SpecsImovel imovel={imovel} className="mt-auto pt-2 text-xs text-text-2" />
        <ResponsavelImovel corretor={corretor} />
      </div>
    </article>
  );
}

/** Esqueleto com a forma final do PropertyCard. */
export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando imóvel" className={cn("flex flex-col gap-3", className)}>
      <Skeleton shape="rect" className="aspect-4/3 h-auto rounded-lg" />
      <div className="flex flex-col gap-2">
        <Skeleton className="w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="w-1/2" />
        <Skeleton className="h-7 w-2/3" />
      </div>
    </div>
  );
}
