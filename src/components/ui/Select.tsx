"use client";

import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { useFieldControl } from "./Field";
import { Icon } from "./Icon";

export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectGroup = { label: string; options: SelectOption[] };

export type SelectProps = {
  options: (SelectOption | SelectGroup)[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  id?: string;
  size?: "md" | "lg";
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

function isGroup(item: SelectOption | SelectGroup): item is SelectGroup {
  return "options" in item;
}

function Item({ option }: { option: SelectOption }) {
  return (
    <SelectPrimitive.Item
      value={option.value}
      disabled={option.disabled}
      className={cn(
        "relative flex min-h-8 cursor-pointer items-center rounded-sm py-1 pr-3 pl-8 text-sm text-text select-none",
        "data-highlighted:bg-bg-subtle data-highlighted:outline-none",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
      )}
    >
      <span className="absolute left-2 inline-flex items-center">
        <SelectPrimitive.ItemIndicator>
          <Icon icon={Check} size={16} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

/** Seleção única (Radix Select) com grupos, itens desabilitados e estado de erro. */
export function Select({
  options,
  placeholder = "Selecione",
  size = "md",
  className,
  invalid,
  id,
  ...props
}: SelectProps) {
  const control = useFieldControl({
    id,
    invalid,
    "aria-describedby": props["aria-describedby"],
    "aria-invalid": props["aria-invalid"],
  });
  return (
    <SelectPrimitive.Root
      value={props.value}
      defaultValue={props.defaultValue}
      onValueChange={props.onValueChange}
      disabled={props.disabled}
      name={props.name}
    >
      <SelectPrimitive.Trigger
        id={control.id}
        aria-label={props["aria-label"]}
        aria-describedby={control["aria-describedby"]}
        aria-invalid={control["aria-invalid"]}
        className={cn(
          "group flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border bg-surface px-3 text-left text-text",
          size === "lg" ? "h-11 text-base" : "h-10 text-sm",
          "transition duration-(--dur-fast) ease-standard",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-text-muted",
          control.invalid ? "border-danger" : "border-border-strong hover:border-text-muted",
          className,
        )}
      >
        <span className="min-w-0 truncate">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon>
          <Icon
            icon={ChevronDown}
            size={16}
            className="text-text-muted transition-transform duration-(--dur-base) ease-standard group-data-[state=open]:rotate-180"
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-(--z-popover) max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-border bg-surface-raised p-1 shadow-2",
            "origin-(--radix-select-content-transform-origin) data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in",
          )}
        >
          <SelectPrimitive.Viewport>
            {options.map((item) =>
              isGroup(item) ? (
                <SelectPrimitive.Group key={item.label}>
                  <SelectPrimitive.Label className="px-2 py-1 text-xs font-medium text-text-muted">
                    {item.label}
                  </SelectPrimitive.Label>
                  {item.options.map((o) => (
                    <Item key={o.value} option={o} />
                  ))}
                </SelectPrimitive.Group>
              ) : (
                <Item key={item.value} option={item} />
              ),
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
