"use client";

import Link from "next/link";
import { Settings, UserRound } from "lucide-react";
import type { Corretor, Papel } from "@/domain";
import { cn } from "@/lib/cn";
import type { Recurso } from "@/lib/recurso";
import { Avatar } from "../ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { Icon } from "../ui/Icon";
import { Skeleton } from "../ui/Skeleton";

export const PAPEL_ROTULO: Record<Papel, string> = { gestor: "Gestor", corretor: "Corretor", financeiro: "Financeiro" };

type Pessoa = Pick<Corretor, "id" | "nome" | "papel">;

export type UserMenuProps = {
  usuario: Recurso<Pessoa>;
  /** Personas de demonstração (RF-08). Vazio esconde o seletor. */
  personas?: readonly Pessoa[];
  onTrocarPersona?: (id: string) => void;
  /** `false` nas histórias do catálogo com o menu aberto (o modal esconde o resto da página). */
  modal?: boolean;
};

/** Menu do usuário (RF-08, RF-50): quem está usando, troca de persona de demonstração e Configurações. */
export function UserMenu({ usuario, personas = [], onTrocarPersona, modal }: UserMenuProps) {
  const eu = "dados" in usuario ? usuario.dados : undefined;
  if (!eu) {
    return usuario.fase !== "error" ? (
      <div role="status" aria-busy="true" aria-label="Carregando usuário" className="flex items-center gap-2 px-1">
        <Skeleton shape="circle" className="size-8" />
        <Skeleton className="hidden w-24 md:block" />
      </div>
    ) : (
      <Link
        href="/configuracoes"
        aria-label="Usuário indisponível. Abrir configurações"
        className="inline-flex size-10 items-center justify-center rounded-full text-text-muted hover:bg-bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Icon icon={UserRound} size={20} />
      </Link>
    );
  }
  return (
    <DropdownMenu modal={modal}>
      <DropdownMenuTrigger
        className={cn(
          "relative inline-flex size-11 cursor-pointer items-center justify-center rounded-full outline-none lg:size-10",
          "transition-colors duration-(--dur-fast) ease-standard hover:bg-bg-subtle",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
      >
        {/* Só o avatar (menos é mais): nome e papel aparecem dentro do menu e no texto para leitor de tela. */}
        <span className="sr-only">
          Menu do usuário: {eu.nome}, {PAPEL_ROTULO[eu.papel]}
        </span>
        <Avatar name={eu.nome} size={32} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="text-sm font-semibold text-text">{eu.nome}</span>
          <span>{PAPEL_ROTULO[eu.papel]}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {personas.length > 1 && onTrocarPersona ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger icon={UserRound}>Trocar persona</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-80 w-64 overflow-y-auto">
              <DropdownMenuLabel>Usar o painel como (demonstração)</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={eu.id} onValueChange={onTrocarPersona}>
                {personas.map((p) => (
                  <DropdownMenuRadioItem key={p.id} value={p.id}>
                    <span className="min-w-0 flex-1 truncate">{p.nome}</span>
                    <span className="text-xs text-text-muted">{PAPEL_ROTULO[p.papel]}</span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href="/configuracoes">
            <Icon icon={Settings} size={16} />
            Configurações
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
