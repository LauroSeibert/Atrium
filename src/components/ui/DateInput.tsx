"use client";

import { useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Icon } from "./Icon";
import { Input, type InputProps } from "./Input";

/**
 * Campos de data e hora sempre no formato brasileiro (dd/mm/aaaa, 24 h), qualquer que seja o idioma
 * do navegador. O `<input type="date">` nativo segue o idioma do navegador (em inglês vira mm/dd/yyyy),
 * por isso o campo é texto com máscara; o calendário nativo continua disponível no botão.
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
  const nativo = useRef<HTMLInputElement>(null);

  // Valor mudou por fora (URL, calendário, limpar filtros): reflete no texto, durante a renderização.
  if (value !== valorAnterior) {
    setValorAnterior(value);
    if (dataBrParaIso(texto) !== value) setTexto(isoParaDataBr(value));
  }

  const abrirCalendario = () => {
    const el = nativo.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };

  return (
    <>
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
          <button
            type="button"
            onClick={abrirCalendario}
            disabled={props.disabled}
            aria-label="Abrir calendário"
            className="-mr-1 grid size-8 place-items-center rounded-sm text-text-muted hover:bg-surface-muted hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Icon icon={CalendarDays} size={16} />
          </button>
        }
      />
      <input
        ref={nativo}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="sr-only"
      />
    </>
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
