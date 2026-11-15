"use client";

import { useCallback, useState } from "react";
import { Command } from "cmdk";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { useFieldControl } from "./Field";
import { Icon } from "./Icon";

export type ComboboxOption = { value: string; label: string; disabled?: boolean };

export type ComboboxProps = {
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  invalid?: boolean;
  size?: "md" | "lg";
  id?: string;
  name?: string;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Seleção única com busca (cmdk + Popover). Setas navegam, Enter escolhe, Esc fecha. */
export function Combobox({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Selecione",
  searchPlaceholder = "Buscar…",
  emptyText = "Nenhum resultado encontrado",
  size = "md",
  disabled,
  invalid,
  id,
  name,
  className,
  ...props
}: ComboboxProps) {
  const control = useFieldControl({
    id,
    invalid,
    "aria-describedby": props["aria-describedby"],
    "aria-invalid": props["aria-invalid"],
  });
  const [internal, setInternal] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  // O cmdk define o id real da lista; lemos do DOM para ligar `aria-controls` ao id correto.
  const [listId, setListId] = useState<string>();
  const listRef = useCallback((node: HTMLDivElement | null) => setListId(node?.id), []);
  const current = value ?? internal;
  const selected = options.find((o) => o.value === current);

  function choose(next: string) {
    setInternal(next);
    onValueChange?.(next);
    setOpen(false);
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          id={control.id}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-haspopup="listbox"
          aria-label={props["aria-label"]}
          aria-describedby={control["aria-describedby"]}
          aria-invalid={control["aria-invalid"]}
          disabled={disabled}
          className={cn(
            "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border bg-surface px-3 text-left",
            size === "lg" ? "h-11 text-base" : "h-10 text-sm",
            "transition duration-(--dur-fast) ease-standard",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            selected ? "text-text" : "text-text-muted",
            control.invalid ? "border-danger" : "border-border-strong hover:bg-bg-subtle",
            className,
          )}
        >
          <span className="min-w-0 truncate">{selected ? selected.label : placeholder}</span>
          <Icon icon={ChevronsUpDown} size={16} className="text-text-muted" />
        </button>
      </PopoverPrimitive.Trigger>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            "z-(--z-popover) w-(--radix-popover-trigger-width) rounded-md border border-border bg-surface-raised p-1 shadow-2",
            "origin-(--radix-popover-content-transform-origin) data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in",
          )}
        >
          <Command
            label="Opções"
            filter={(itemValue, search) => (normalize(itemValue).includes(normalize(search)) ? 1 : 0)}
          >
            <Command.Input
              placeholder={searchPlaceholder}
              aria-label="Buscar"
              className="h-10 w-full rounded-sm border-b border-border bg-transparent px-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            />
            <Command.List ref={listRef} className="max-h-60 overflow-y-auto py-1">
              <Command.Empty className="px-2 py-3 text-center text-sm text-text-muted">{emptyText}</Command.Empty>
              {options.map((o) => (
                <Command.Item
                  key={o.value}
                  value={o.label}
                  disabled={o.disabled}
                  onSelect={() => choose(o.value)}
                  className={cn(
                    "flex min-h-8 cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-sm text-text select-none",
                    "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[selected=true]:bg-bg-subtle",
                  )}
                >
                  <span className="inline-flex size-4 shrink-0">
                    {o.value === current ? <Icon icon={Check} size={16} /> : null}
                  </span>
                  <span className="min-w-0 truncate">{o.label}</span>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
