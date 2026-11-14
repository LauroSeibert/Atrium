"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import { Label } from "./Typography";

/** Props de acessibilidade que o Field entrega ao controle (também via render prop). */
export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

type FieldContextValue = FieldControlProps & { labelId: string; invalid: boolean };

const FieldContext = createContext<FieldContextValue | null>(null);

type ControlInput = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling";
  invalid?: boolean;
};

/**
 * Usado pelos controles (Input, Select…) para herdar id, `aria-describedby` e
 * `aria-invalid` do `Field` pai. Props explícitas têm precedência; fora de um
 * Field, o controle funciona sozinho.
 */
export function useFieldControl(props: ControlInput) {
  const ctx = useContext(FieldContext);
  const fallbackId = useId();
  const describedBy = [props["aria-describedby"], ctx?.["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  const invalid =
    Boolean(props.invalid) ||
    props["aria-invalid"] === true ||
    props["aria-invalid"] === "true" ||
    Boolean(ctx?.invalid);
  return {
    id: props.id ?? ctx?.id ?? fallbackId,
    labelId: ctx?.labelId,
    "aria-describedby": describedBy,
    "aria-invalid": invalid ? (true as const) : undefined,
    invalid,
  };
}

export type FieldProps = {
  label: ReactNode;
  requirement?: "required" | "optional";
  description?: ReactNode;
  /** Mensagem de erro (texto + ícone). Marca o controle como inválido. */
  error?: ReactNode;
  /** Id do controle; gerado automaticamente se omitido. */
  id?: string;
  className?: string;
  /** Controle(s), ou função que recebe as props de acessibilidade (render prop). */
  children: ReactNode | ((control: FieldControlProps) => ReactNode);
};

/** Rótulo + controle + ajuda + erro, com ids e `aria-*` ligados automaticamente. */
export function Field({ label, requirement, description, error, id, className, children }: FieldProps) {
  const generated = useId();
  const controlId = id ?? generated;
  const labelId = `${controlId}-label`;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const control: FieldControlProps = {
    id: controlId,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
  };

  return (
    <FieldContext.Provider value={{ ...control, labelId, invalid: Boolean(error) }}>
      <div className={cn("flex flex-col gap-2", className)}>
        <Label id={labelId} htmlFor={controlId} requirement={requirement}>
          {label}
        </Label>
        {typeof children === "function" ? children(control) : children}
        {description ? (
          <p id={descriptionId} className="text-xs text-text-muted">
            {description}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="flex items-start gap-1 text-sm text-danger">
            <Icon icon={CircleAlert} size={16} className="mt-0.5" />
            <span>{error}</span>
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}
