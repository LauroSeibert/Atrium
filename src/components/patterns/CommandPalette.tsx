"use client";

import { Command } from "cmdk";
import { Search } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Recurso } from "@/lib/recurso";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { Spinner } from "../ui/Spinner";

export type ItemPaleta = {
  id: string;
  rotulo: string;
  descricao?: string;
  icone?: LucideIcon;
  onSelect: () => void;
};

export type GrupoPaleta = { id: string; rotulo: string; itens: ItemPaleta[] };

export type CommandPaletteProps = {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  grupos: GrupoPaleta[];
  /** Resultados remotos: `loading` mostra "Buscando…"; `error` mostra a falha com "Tentar de novo". */
  estado?: Recurso<unknown>;
  onTentarNovamente?: () => void;
  /** Avisa a digitação, para quem chama buscar resultados remotos. */
  onBuscaChange?: (busca: string) => void;
  placeholder?: string;
};

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/** Busca sem acento e sem diferenciar maiúsculas, só em rótulo, descrição e keywords (nunca no id). */
function filtrar(_valor: string, busca: string, palavras?: string[]): number {
  const alvo = normalizar((palavras ?? []).join(" "));
  return alvo.includes(normalizar(busca)) ? 1 : 0;
}

/** Escuta ⌘K / Ctrl+K e chama `onAbrir` (comportamento de UI, não regra de negócio). */
export function useAtalhoPaleta(onAbrir: () => void) {
  const ref = useRef(onAbrir);
  useEffect(() => {
    ref.current = onAbrir;
  });
  useEffect(() => {
    const ouvir = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", ouvir);
    return () => window.removeEventListener("keydown", ouvir);
  }, []);
}

function Linha({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2 px-3 py-3 text-sm text-text-muted">{children}</div>;
}

/**
 * Paleta de comandos ⌘K: busca global e ações (RF-02, RF-35). Setas navegam, Enter executa, Esc fecha.
 * Os itens e a ação de cada um chegam por props; ao escolher, a paleta fecha.
 */
export function CommandPalette({
  aberto,
  onAbertoChange,
  grupos,
  estado,
  onTentarNovamente,
  onBuscaChange,
  placeholder = "Buscar imóveis, leads, contratos e ações…",
}: CommandPaletteProps) {
  const [busca, setBusca] = useState("");
  const carregando = estado?.fase === "loading";
  return (
    <Dialog
      open={aberto}
      onOpenChange={(a) => {
        if (!a) setBusca("");
        onAbertoChange(a);
      }}
    >
      <DialogContent showClose={false} size="md" className="top-1/4 translate-y-0 gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Paleta de comandos</DialogTitle>
        <DialogDescription className="sr-only">
          Digite para buscar. Use as setas para navegar, Enter para escolher e Esc para fechar.
        </DialogDescription>
        <Command label="Buscar" filter={filtrar} shouldFilter={!onBuscaChange} loop>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Icon icon={Search} size={16} className="shrink-0 text-text-muted" />
            <Command.Input
              value={busca}
              onValueChange={(v) => {
                setBusca(v);
                onBuscaChange?.(v);
              }}
              placeholder={placeholder}
              className="h-12 w-full bg-transparent text-base text-text outline-none placeholder:text-text-muted"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            {carregando ? null : (
              <Command.Empty className="px-3 py-6 text-center text-sm text-text-muted">
                Nenhum resultado para “{busca}”
              </Command.Empty>
            )}
            {grupos.map((g) => (
              <Command.Group
                key={g.id}
                heading={g.rotulo}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-muted"
              >
                {g.itens.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${g.id}:${item.id}`}
                    keywords={[item.rotulo, ...(item.descricao ? [item.descricao] : [])]}
                    onSelect={() => {
                      item.onSelect();
                      setBusca("");
                      onAbertoChange(false);
                    }}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-2 py-1 text-sm text-text select-none",
                      "data-[disabled=true]:opacity-50 data-[selected=true]:bg-bg-subtle",
                    )}
                  >
                    {item.icone ? <Icon icon={item.icone} size={20} className="shrink-0 text-text-muted" /> : null}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{item.rotulo}</span>
                      {item.descricao ? (
                        <span className="truncate text-xs text-text-muted">{item.descricao}</span>
                      ) : null}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
          <div role="status" className={carregando ? undefined : "sr-only"}>
            {carregando ? (
              <Linha>
                <Spinner size={16} />
                Buscando resultados…
              </Linha>
            ) : null}
          </div>
          <div role="alert" className={estado?.fase === "error" ? undefined : "sr-only"}>
            {estado?.fase === "error" ? (
              <Linha>
                <span className="flex-1 text-danger">Não foi possível buscar agora.</span>
                {onTentarNovamente ? (
                  <Button size="sm" variant="secondary" onClick={onTentarNovamente}>
                    Tentar de novo
                  </Button>
                ) : null}
              </Linha>
            ) : null}
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
