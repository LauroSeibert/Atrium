"use client";

import Link from "next/link";
import { AlarmClock, Bell, CalendarClock, CheckCheck } from "lucide-react";
import { useState } from "react";
import { naoLidas, type Notificacao } from "@/domain";
import { cn } from "@/lib/cn";
import { formatData, formatMoeda } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { Instante, nomeDoAutor, type Autores } from "../patterns/ActivityFeed";
import { EmptyState } from "../patterns/EmptyState";
import { EstadoRecurso } from "../patterns/EstadoRecurso";
import { ICONE_ATIVIDADE, textoAtividade } from "../patterns/textoHistorico";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import { Skeleton } from "../ui/Skeleton";

export type NotificationCenterProps = {
  estado: Recurso<Notificacao[]>;
  onTentarNovamente?: () => void;
  onMarcarLida: (id: string) => void;
  onMarcarTodas: () => void;
  /** Destino de cada notificação (ex.: `rotaDaEntidade`). */
  hrefDe: (n: Notificacao) => string;
  autores?: Autores;
  agora?: Date;
  /** Controlado (histórias e testes); sem ele, o popover controla a si mesmo. */
  aberto?: boolean;
  onAbertoChange?: (aberto: boolean) => void;
};

/** Uma linha que diz o que houve + uma linha curta de contexto (menos é mais). O autor fica só para leitor de tela. */
type Texto = {
  titulo: string;
  detalhe?: string;
  autor?: string;
  quando: boolean;
  icone: typeof Bell;
  tom: "padrao" | "atraso";
};

function textoDe(n: Notificacao, autores: Autores): Texto {
  if (n.tipo === "atividade") {
    const t = textoAtividade(n.atividade);
    return {
      titulo: t.titulo,
      detalhe: n.alvoNome,
      autor: nomeDoAutor(autores, n.atividade.autorId),
      quando: true,
      icone: ICONE_ATIVIDADE[n.atividade.tipo],
      tom: "padrao",
    };
  }
  const detalhe = `${n.numero} · ${formatMoeda(n.valor)}`;
  return n.tipo === "atraso"
    ? { titulo: `Parcela ${n.parcela} atrasada`, detalhe, quando: false, icone: AlarmClock, tom: "atraso" }
    : {
        titulo: `Parcela ${n.parcela} vence em ${formatData(n.em)}`,
        detalhe,
        quando: false,
        icone: CalendarClock,
        tom: "padrao",
      };
}

function ListaSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando notificações" className="flex flex-col gap-4 p-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton shape="circle" className="size-8" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="w-4/5" />
            <Skeleton className="w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Central de notificações (RF-64): sino com contagem de não lidas, popover com a lista,
 * "Marcar todas como lidas" e os 5 estados do `Recurso`. Abrir uma notificação a marca como lida.
 */
export function NotificationCenter({
  estado,
  onTentarNovamente,
  onMarcarLida,
  onMarcarTodas,
  hrefDe,
  autores = {},
  agora,
  aberto,
  onAbertoChange,
}: NotificationCenterProps) {
  const [abertoInterno, setAbertoInterno] = useState(false);
  const abertoAtual = aberto ?? abertoInterno;
  const mudar = (v: boolean) => {
    setAbertoInterno(v);
    onAbertoChange?.(v);
  };
  const dados = "dados" in estado ? estado.dados : undefined;
  const pendentes = dados ? naoLidas(dados) : 0;
  const rotulo =
    pendentes > 0 ? `Notificações, ${pendentes} não ${pendentes === 1 ? "lida" : "lidas"}` : "Notificações";

  return (
    <Popover open={abertoAtual} onOpenChange={mudar}>
      <span className="relative inline-flex">
        <PopoverTrigger asChild>
          <Button variant="ghost" icon={Bell} aria-label={rotulo} className="max-lg:size-11" />
        </PopoverTrigger>
        {pendentes > 0 ? (
          // Ponto discreto em vez de número: não cobre o sino; a contagem está no rótulo acessível.
          <span
            aria-hidden="true"
            data-testid="notificacoes-ponto"
            className="pointer-events-none absolute top-2 right-2 size-2 rounded-full bg-accent ring-2 ring-bg max-lg:top-2.5 max-lg:right-2.5"
          />
        ) : null}
      </span>
      <PopoverContent
        align="end"
        className="flex max-h-(--radix-popover-content-available-height) w-80 flex-col p-0 sm:w-96"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold">Notificações</h2>
          <Button variant="ghost" size="sm" leadingIcon={CheckCheck} disabled={pendentes === 0} onClick={onMarcarTodas}>
            Marcar todas como lidas
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EstadoRecurso
            estado={estado}
            carregando={<ListaSkeleton />}
            estaVazio={(ns) => ns.length === 0}
            vazio={<EmptyState tamanho="compacto" ilustracao="semResultados" titulo="Nada novo por aqui" />}
            erro={{ titulo: "Não foi possível carregar as notificações" }}
            onTentarNovamente={onTentarNovamente}
          >
            {(ns) => (
              <ul className="flex flex-col py-1">
                {ns.map((n) => {
                  const t = textoDe(n, autores);
                  return (
                    <li key={n.id}>
                      <Link
                        href={hrefDe(n)}
                        onClick={() => {
                          if (!n.lida) onMarcarLida(n.id);
                          mudar(false);
                        }}
                        className={cn(
                          "flex gap-3 px-4 py-3 transition-colors duration-(--dur-fast) ease-standard outline-none",
                          "hover:bg-bg-subtle focus-visible:bg-bg-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                            t.tom === "atraso" ? "bg-danger-bg text-danger" : "bg-surface-muted text-text",
                          )}
                        >
                          <Icon icon={t.icone} size={16} />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className={cn("text-sm text-text", !n.lida && "font-semibold")}>
                            {n.lida ? null : <span className="sr-only">Não lida: </span>}
                            {t.titulo}
                          </span>
                          <span className="truncate text-xs text-text-muted">
                            {t.detalhe}
                            {t.detalhe && t.quando ? " · " : null}
                            {t.quando ? <Instante iso={n.em} agora={agora} /> : null}
                            {t.autor ? <span className="sr-only">, por {t.autor}</span> : null}
                          </span>
                        </span>
                        {n.lida ? null : (
                          <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-accent" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </EstadoRecurso>
        </div>
      </PopoverContent>
    </Popover>
  );
}
