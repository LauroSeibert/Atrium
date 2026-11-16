"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import { Input, type InputProps } from "./Input";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

/**
 * Campos de data e hora sempre no formato brasileiro (dd/mm/aaaa, 24 h), qualquer que seja o idioma
 * do navegador. O `<input type="date">` nativo segue o idioma do navegador (em inglês vira mm/dd/yyyy),
 * por isso o campo é texto com máscara, e o botão abre um calendário próprio (pt-BR, semana começa no domingo).
 * O valor trocado com quem chama é ISO (`AAAA-MM-DD` / `HH:MM`), igual ao input nativo.
 */

type BaseProps = Omit<InputProps, "value" | "onChange" | "type" | "defaultValue">;

export type DateInputProps = BaseProps & {
  /** `AAAA-MM-DD` ou vazio. */
  value: string;
  /** Chamado com `AAAA-MM-DD` quando a data fica completa e válida, ou `""` quando o campo é esvaziado. */
  onValueChange: (iso: string) => void;
};

const soDigitos = (s: string) => s.replace(/\D/g, "");

function mascararData(texto: string): string {
  const d = soDigitos(texto).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** `dd/mm/aaaa` → `AAAA-MM-DD`, ou `null` se incompleta ou inexistente (ex.: 31/02). */
export function dataBrParaIso(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return null;
  const [, dd, mm, aaaa] = m;
  const data = new Date(Date.UTC(Number(aaaa), Number(mm) - 1, Number(dd)));
  const valida =
    data.getUTCFullYear() === Number(aaaa) && data.getUTCMonth() === Number(mm) - 1 && data.getUTCDate() === Number(dd);
  return valida ? `${aaaa}-${mm}-${dd}` : null;
}

export function isoParaDataBr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

export function DateInput({ value, onValueChange, onBlur, ...props }: DateInputProps) {
  const [texto, setTexto] = useState(() => isoParaDataBr(value));
  const [valorAnterior, setValorAnterior] = useState(value);

  // Valor mudou por fora (URL, calendário, limpar filtros): reflete no texto, durante a renderização.
  if (value !== valorAnterior) {
    setValorAnterior(value);
    if (dataBrParaIso(texto) !== value) setTexto(isoParaDataBr(value));
  }

  const [aberto, setAberto] = useState(false);

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={props.placeholder ?? "dd/mm/aaaa"}
      maxLength={10}
      value={texto}
      onChange={(e) => {
        const novo = mascararData(e.target.value);
        setTexto(novo);
        if (novo === "") onValueChange("");
        else {
          const iso = dataBrParaIso(novo);
          if (iso && iso !== value) onValueChange(iso);
        }
      }}
      onBlur={(e) => {
        // Data incompleta ou inválida ao sair: volta para o último valor válido.
        if (texto !== "" && !dataBrParaIso(texto)) setTexto(isoParaDataBr(value));
        onBlur?.(e);
      }}
      suffix={
        <Popover open={aberto} onOpenChange={setAberto}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={props.disabled}
              aria-label="Abrir calendário"
              className="-mr-1 grid size-8 cursor-pointer place-items-center rounded-sm text-text-muted hover:bg-surface-muted hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed"
            >
              <Icon icon={CalendarDays} size={16} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-auto p-3"
            onOpenAutoFocus={(e) => {
              // Abre com o foco no dia selecionado (ou hoje), não no botão de mês.
              e.preventDefault();
              (e.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>('[data-dia][tabindex="0"]')?.focus();
            }}
          >
            <Calendario
              valor={value}
              onEscolher={(iso) => {
                onValueChange(iso);
                setTexto(isoParaDataBr(iso));
                setAberto(false);
              }}
            />
          </PopoverContent>
        </Popover>
      }
    />
  );
}

export type TimeInputProps = BaseProps & {
  /** `HH:MM` (24 h) ou vazio. */
  value: string;
  onValueChange: (hhmm: string) => void;
};

function mascararHora(texto: string): string {
  const d = soDigitos(texto).slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

const horaValida = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

/** Hora em 24 h (HH:MM), independente do idioma do navegador. */
export function TimeInput({ value, onValueChange, onBlur, ...props }: TimeInputProps) {
  const [texto, setTexto] = useState(value);
  const [valorAnterior, setValorAnterior] = useState(value);
  if (value !== valorAnterior) {
    setValorAnterior(value);
    if (texto !== value) setTexto(value);
  }
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={props.placeholder ?? "hh:mm"}
      maxLength={5}
      value={texto}
      onChange={(e) => {
        const novo = mascararHora(e.target.value);
        setTexto(novo);
        if (novo === "") onValueChange("");
        else if (horaValida(novo) && novo !== value) onValueChange(novo);
      }}
      onBlur={(e) => {
        if (texto !== "" && !horaValida(texto)) setTexto(value);
        onBlur?.(e);
      }}
    />
  );
}

/* ---------- Calendário ---------- */

const DIAS_SEMANA = [
  ["D", "domingo"],
  ["S", "segunda-feira"],
  ["T", "terça-feira"],
  ["Q", "quarta-feira"],
  ["Q", "quinta-feira"],
  ["S", "sexta-feira"],
  ["S", "sábado"],
] as const;

const isoDe = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
const dataDe = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a!, m! - 1, d!));
};
const somarDias = (iso: string, n: number) => {
  const d = dataDe(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return isoDe(d);
};
const somarMeses = (iso: string, n: number) => {
  const d = dataDe(iso);
  const dia = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dia, ultimo));
  return isoDe(d);
};
const hojeIso = () => {
  const h = new Date();
  return isoDe(new Date(Date.UTC(h.getFullYear(), h.getMonth(), h.getDate())));
};
const fmtMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const fmtDia = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export type CalendarioProps = {
  /** Data selecionada (`AAAA-MM-DD`) ou vazio. */
  valor: string;
  onEscolher: (iso: string) => void;
};

/** Calendário de um mês, com setas do teclado (dia/semana), PageUp/PageDown (mês) e Home/End (semana). */
export function Calendario({ valor, onEscolher }: CalendarioProps) {
  const hoje = hojeIso();
  const [foco, setFoco] = useState(() => (dataBrParaIso(isoParaDataBr(valor)) ? valor : hoje));
  const grade = useRef<HTMLDivElement>(null);
  const moverFoco = useRef(false);

  useEffect(() => {
    if (!moverFoco.current) return;
    moverFoco.current = false;
    grade.current?.querySelector<HTMLButtonElement>(`[data-dia="${foco}"]`)?.focus();
  }, [foco]);

  const primeiroDoMes = `${foco.slice(0, 8)}01`;
  const inicio = somarDias(primeiroDoMes, -dataDe(primeiroDoMes).getUTCDay());
  const dias = Array.from({ length: 42 }, (_, i) => somarDias(inicio, i));
  const semanas = Array.from({ length: 6 }, (_, i) => dias.slice(i * 7, i * 7 + 7));
  const titulo = fmtMes.format(dataDe(primeiroDoMes));

  const irPara = (iso: string, focar = true) => {
    moverFoco.current = focar;
    setFoco(iso);
  };

  const teclas = (e: KeyboardEvent<HTMLButtonElement>) => {
    const dia = dataDe(foco).getUTCDay();
    const mapa: Record<string, string> = {
      ArrowLeft: somarDias(foco, -1),
      ArrowRight: somarDias(foco, 1),
      ArrowUp: somarDias(foco, -7),
      ArrowDown: somarDias(foco, 7),
      PageUp: somarMeses(foco, e.shiftKey ? -12 : -1),
      PageDown: somarMeses(foco, e.shiftKey ? 12 : 1),
      Home: somarDias(foco, -dia),
      End: somarDias(foco, 6 - dia),
    };
    const destino = mapa[e.key];
    if (!destino) return;
    e.preventDefault();
    irPara(destino);
  };

  return (
    <div className="flex w-64 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p aria-live="polite" className="pl-1 text-sm font-semibold text-text first-letter:uppercase">
          {titulo}
        </p>
        <div className="flex items-center">
          <BotaoMes rotulo="Mês anterior" icone={ChevronLeft} onClick={() => irPara(somarMeses(foco, -1), false)} />
          <BotaoMes rotulo="Próximo mês" icone={ChevronRight} onClick={() => irPara(somarMeses(foco, 1), false)} />
        </div>
      </div>
      <div ref={grade} role="grid" aria-label={titulo} className="flex flex-col gap-0.5">
        <div role="row" className="grid grid-cols-7">
          {DIAS_SEMANA.map(([curto, longo]) => (
            <span
              key={longo}
              role="columnheader"
              aria-label={longo}
              className="grid h-8 place-items-center text-xs font-medium text-text-muted"
            >
              {curto}
            </span>
          ))}
        </div>
        {semanas.map((semana) => (
          <div key={semana[0]} role="row" className="grid grid-cols-7">
            {semana.map((iso) => {
              const foraDoMes = iso.slice(0, 7) !== foco.slice(0, 7);
              const selecionado = iso === valor;
              const ehHoje = iso === hoje;
              return (
                <span key={iso} role="gridcell" aria-selected={selecionado}>
                  <button
                    type="button"
                    data-dia={iso}
                    tabIndex={iso === foco ? 0 : -1}
                    aria-label={fmtDia.format(dataDe(iso))}
                    aria-current={ehHoje ? "date" : undefined}
                    onClick={() => onEscolher(iso)}
                    onKeyDown={teclas}
                    className={cn(
                      "tnum relative grid size-9 cursor-pointer place-items-center rounded-md text-sm",
                      "transition-colors duration-(--dur-fast) ease-standard",
                      "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                      selecionado
                        ? "bg-primary font-semibold text-on-primary"
                        : cn("hover:bg-surface-muted", foraDoMes ? "text-text-muted" : "text-text"),
                      ehHoje && !selecionado && "font-semibold text-primary",
                    )}
                  >
                    {Number(iso.slice(8))}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2">
        <button
          type="button"
          onClick={() => onEscolher(hoje)}
          className="cursor-pointer rounded-sm px-1 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Hoje
        </button>
        {valor ? (
          <button
            type="button"
            onClick={() => onEscolher("")}
            className="cursor-pointer rounded-sm px-1 text-sm text-text-muted hover:text-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Limpar
          </button>
        ) : null}
      </div>
    </div>
  );
}

function BotaoMes({ rotulo, icone, onClick }: { rotulo: string; icone: typeof ChevronLeft; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      onClick={onClick}
      className="grid size-8 cursor-pointer place-items-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Icon icon={icone} size={16} />
    </button>
  );
}
