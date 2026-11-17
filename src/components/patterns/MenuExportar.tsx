"use client";

import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "../ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu";

export type FormatoExportacao = "csv" | "pdf";

export type MenuExportarProps = {
  /** Linhas selecionadas na tabela; com mais de zero o botão passa a exportar só elas. */
  selecionados?: number;
  onExportar: (formato: FormatoExportacao) => void;
  disabled?: boolean;
};

/**
 * Exportar da listagem (RF-47, RF-49): um botão só no cabeçalho, com CSV e PDF no menu. Com linhas
 * selecionadas vira "Exportar N selecionados" (substitui a barra de ações em lote). Só exibe.
 */
export function MenuExportar({ selecionados = 0, onExportar, disabled }: MenuExportarProps) {
  const rotulo =
    selecionados === 0
      ? "Exportar"
      : selecionados === 1
        ? "Exportar 1 selecionado"
        : `Exportar ${selecionados.toLocaleString("pt-BR")} selecionados`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" leadingIcon={Download} trailingIcon={ChevronDown} disabled={disabled}>
          {rotulo}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem icon={FileSpreadsheet} onSelect={() => onExportar("csv")}>
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem icon={FileText} onSelect={() => onExportar("pdf")}>
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
