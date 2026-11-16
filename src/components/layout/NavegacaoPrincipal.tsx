"use client";

import Link from "next/link";
import { LayoutGroup, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { useId, useState } from "react";
import type { ContadoresNavegacao } from "@/domain";
import { cn } from "@/lib/cn";
import { useTransicaoToken } from "@/lib/motion";
import { Icon } from "../ui/Icon";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import { Tooltip } from "../ui/Tooltip";
import {
  ehGrupo,
  ehSubmenu,
  grupoAtivo,
  itemAtivo,
  submenuAtivo,
  type EntradaNavegacao,
  type GrupoNavegacao,
  type ItemComSubmenu,
  type ItemNavegacao,
} from "./navegacao";

// Contadores em mono sobre trilho de tinta; cor de estado só quando pede atenção (atraso/risco).
const TOM_CONTADOR = {
  primary: "text-text",
  info: "text-text",
  danger: "text-danger",
  warning: "text-warning",
  neutral: "text-text",
} as const;

const formatarContador = (n: number) => (n > 99 ? "99+" : String(n));

export type NavegacaoPrincipalProps = {
  itens: readonly EntradaNavegacao[];
  pathname: string;
  /** Só ícones (com tooltip). O nome acessível do link continua completo. Submenus viram painel flutuante. */
  recolhida?: boolean;
  /** Números dos badges (RF-62). Ausente (carregando/erro) = sem badge, sem quebrar a navegação. */
  contadores?: ContadoresNavegacao;
  /** Chamado ao escolher um item (ex.: fechar o drawer no mobile). */
  onNavegar?: () => void;
  /** Alvos de 44 px no mobile (RNF-04). */
  tamanho?: "padrao" | "toque";
  /** Grupos viram seções recolhíveis (drawer mobile): só o da rota atual começa aberto. */
  gruposRecolhiveis?: boolean;
};

type Contexto = Required<Pick<NavegacaoPrincipalProps, "pathname" | "recolhida" | "tamanho">> &
  Pick<NavegacaoPrincipalProps, "contadores" | "onNavegar" | "gruposRecolhiveis"> & {
    /** Dentro do painel flutuante: o destaque do ativo é estático (sem `layoutId` duplicado com o do ícone). */
    flutuante?: boolean;
    transicao: ReturnType<typeof useTransicaoToken>;
  };

const alvo = (t: Contexto["tamanho"]) => (t === "toque" ? "h-11 text-base" : "h-10 text-sm");
const FOCO = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const LINHA =
  "group relative flex w-full items-center gap-3 rounded-lg px-3 font-regular transition-colors duration-(--dur-fast) ease-standard";

function Indicador({ transicao }: { transicao: Contexto["transicao"] }) {
  return (
    <motion.span
      layoutId="indicador-ativo"
      transition={transicao}
      aria-hidden="true"
      className="absolute inset-0 rounded-lg bg-primary-subtle"
    />
  );
}

/** Link folha. `filho`: dentro de um submenu aberto (recuado, sem ícone). */
function LinkItem({ item, ctx, filho = false }: { item: ItemNavegacao; ctx: Contexto; filho?: boolean }) {
  const { pathname, recolhida, contadores, onNavegar, tamanho, transicao } = ctx;
  const ativo = itemAtivo(pathname, item);
  const n = item.contador && contadores ? contadores[item.contador.chave] : 0;
  const descricao = item.contador && n > 0 ? item.contador.descrever(n) : undefined;
  const compacto = recolhida && !filho;
  const link = (
    <Link
      href={item.href}
      aria-current={ativo ? "page" : undefined}
      aria-label={
        compacto
          ? // inclui o texto visível do badge ("99+") no nome (WCAG 2.5.3)
            [item.rotulo, descricao && (n > 99 ? `${formatarContador(n)}: ${descricao}` : descricao)]
              .filter(Boolean)
              .join(", ")
          : undefined
      }
      onClick={onNavegar}
      className={cn(
        LINHA,
        FOCO,
        alvo(tamanho),
        filho && "pl-10.5 text-caption",
        compacto && "w-11 justify-center px-0",
        ativo ? "text-text" : "text-text-muted hover:bg-surface-muted hover:text-text",
      )}
    >
      {ativo ? (
        ctx.flutuante ? (
          <span aria-hidden="true" className="absolute inset-0 rounded-lg bg-primary-subtle" />
        ) : (
          <Indicador transicao={transicao} />
        )
      ) : null}
      {filho ? null : <Icon icon={item.icone} size={18} className="relative shrink-0" />}
      {/* rótulo entra com fade ao expandir a sidebar (some na hora ao recolher: saída mais rápida) */}
      {compacto ? null : <span className="relative min-w-0 flex-1 animate-fade-in truncate">{item.rotulo}</span>}
      {n > 0 && item.contador ? (
        <span
          aria-hidden="true"
          className={cn(
            "num relative inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-sunken px-2 text-2xs",
            TOM_CONTADOR[item.contador.tom],
            compacto && "absolute -top-1 -right-1 ring-2 ring-bg",
          )}
        >
          {formatarContador(n)}
        </span>
      ) : null}
      {descricao && !compacto ? <span className="sr-only">, {descricao}</span> : null}
    </Link>
  );
  return compacto ? (
    <Tooltip content={descricao ? `${item.rotulo} · ${descricao}` : item.rotulo} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

/** Estado de abertura: o que a pessoa escolheu vence; sem escolha, abre quando a rota atual está dentro. */
function useAbertura(padrao: boolean) {
  const [manual, setManual] = useState<boolean>();
  const aberto = manual ?? padrao;
  return { aberto, alternar: () => setManual(!aberto) };
}

function Submenu({ item, ctx }: { item: ItemComSubmenu; ctx: Contexto }) {
  const { pathname, recolhida, tamanho, transicao, onNavegar } = ctx;
  const id = useId();
  const ativo = submenuAtivo(pathname, item);
  const { aberto, alternar } = useAbertura(ativo);
  const [flutuanteAberto, setFlutuanteAberto] = useState(false);
  // Pai ativo mostra o indicador só quando os filhos não estão à vista.
  const indicadorNoPai = ativo && (recolhida || !aberto);
  const aparencia = ativo ? "text-text" : "text-text-muted hover:bg-surface-muted hover:text-text";
  const conteudo = (
    <>
      {indicadorNoPai ? <Indicador transicao={transicao} /> : null}
      <Icon icon={item.icone} size={18} className="relative shrink-0" />
      {recolhida ? null : (
        <>
          <span className="relative min-w-0 flex-1 animate-fade-in truncate text-left">{item.rotulo}</span>
          <Icon
            icon={ChevronRight}
            size={16}
            className={cn(
              "relative transition-transform duration-(--dur-fast) ease-standard motion-reduce:transition-none",
              aberto && "rotate-90",
            )}
          />
        </>
      )}
    </>
  );

  if (recolhida) {
    return (
      <Popover open={flutuanteAberto} onOpenChange={setFlutuanteAberto}>
        <Tooltip content={item.rotulo} side="right">
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={item.rotulo}
              aria-haspopup="dialog"
              aria-current={indicadorNoPai ? "true" : undefined}
              className={cn(LINHA, FOCO, alvo(tamanho), "w-11 justify-center px-0", aparencia)}
            >
              {conteudo}
            </button>
          </PopoverTrigger>
        </Tooltip>
        <PopoverContent side="right" align="start" sideOffset={12} aria-label={item.rotulo} className="w-52 p-1">
          <ul className="flex flex-col gap-0.5">
            {item.filhos.map((filho) => (
              <li key={filho.href}>
                <LinkItem
                  item={filho}
                  filho
                  ctx={{
                    ...ctx,
                    recolhida: false,
                    flutuante: true,
                    onNavegar: () => {
                      setFlutuanteAberto(false);
                      onNavegar?.();
                    },
                  }}
                />
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={id}
        aria-current={indicadorNoPai ? "true" : undefined}
        onClick={alternar}
        className={cn(LINHA, FOCO, alvo(tamanho), aparencia)}
      >
        {conteudo}
      </button>
      <ul id={id} hidden={!aberto} className="mt-0.5 flex animate-fade-in flex-col gap-0.5">
        {item.filhos.map((filho) => (
          <li key={filho.href}>
            <LinkItem item={filho} filho ctx={ctx} />
          </li>
        ))}
      </ul>
    </>
  );
}

function Grupo({ grupo, ctx }: { grupo: GrupoNavegacao; ctx: Contexto }) {
  const rotuloId = useId();
  const listaId = useId();
  const recolhivel = ctx.gruposRecolhiveis && !ctx.recolhida;
  const { aberto, alternar } = useAbertura(grupoAtivo(ctx.pathname, grupo));

  if (ctx.recolhida) {
    // Sem rótulo: um separador discreto entre grupos.
    return (
      <li>
        <div aria-hidden="true" className="mx-3 my-3 border-t border-border" />
        <ul className="flex flex-col items-center gap-0.5">
          {grupo.itens.map((item) => (
            <li key={item.href}>
              <LinkItem item={item} ctx={ctx} />
            </li>
          ))}
        </ul>
      </li>
    );
  }

  const classeRotulo = cn(
    "eyebrow flex w-full items-center gap-1 rounded-md px-3 text-text-muted",
    ctx.tamanho === "toque" ? "h-11" : "mt-5 mb-1 h-6",
  );
  return (
    <li className={cn(recolhivel && "mt-1")}>
      {recolhivel ? (
        <button
          type="button"
          id={rotuloId}
          aria-expanded={aberto}
          aria-controls={listaId}
          onClick={alternar}
          className={cn(classeRotulo, FOCO, "hover:text-text")}
        >
          <span className="flex-1 text-left">{grupo.rotulo}</span>
          <Icon
            icon={ChevronRight}
            size={16}
            className={cn(
              "transition-transform duration-(--dur-fast) ease-standard motion-reduce:transition-none",
              aberto && "rotate-90",
            )}
          />
        </button>
      ) : (
        <div id={rotuloId} className={classeRotulo}>
          {grupo.rotulo}
        </div>
      )}
      <ul id={listaId} aria-labelledby={rotuloId} hidden={recolhivel && !aberto} className="flex flex-col gap-0.5">
        {grupo.itens.map((item) => (
          <li key={item.href}>
            <LinkItem item={item} ctx={ctx} />
          </li>
        ))}
      </ul>
    </li>
  );
}

/**
 * Menu do shell (RF-01): itens, grupos com rótulo e submenu. Item ativo com `aria-current="page"` e
 * indicador que desliza entre os itens (motion `layoutId`, duração dos tokens; some com `prefers-reduced-motion`).
 * Submenu: expande no lugar (`aria-expanded`) ou, recolhido, abre painel flutuante.
 */
export function NavegacaoPrincipal({
  itens,
  pathname,
  recolhida = false,
  contadores,
  onNavegar,
  tamanho = "padrao",
  gruposRecolhiveis = false,
}: NavegacaoPrincipalProps) {
  const grupoLayout = useId();
  const transicao = useTransicaoToken("--dur-slow", "--easing-standard");
  const ctx: Contexto = { pathname, recolhida, contadores, onNavegar, tamanho, gruposRecolhiveis, transicao };

  return (
    <LayoutGroup id={grupoLayout}>
      <ul className="flex flex-col gap-0.5">
        {itens.map((entrada) => {
          if (ehGrupo(entrada)) return <Grupo key={entrada.rotulo} grupo={entrada} ctx={ctx} />;
          if (ehSubmenu(entrada)) {
            return (
              <li key={entrada.rotulo} className={cn(recolhida && "flex justify-center")}>
                <Submenu item={entrada} ctx={ctx} />
              </li>
            );
          }
          return (
            <li key={entrada.href} className={cn(recolhida && "flex justify-center")}>
              <LinkItem item={entrada} ctx={ctx} />
            </li>
          );
        })}
      </ul>
    </LayoutGroup>
  );
}
