"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "../ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { Icon } from "../ui/Icon";

export type Tema = "light" | "dark" | "system";

const OPCOES = [
  { valor: "light", rotulo: "Claro", icone: Sun },
  { valor: "dark", rotulo: "Escuro", icone: Moon },
  { valor: "system", rotulo: "Sistema", icone: Monitor },
] as const;

export type ThemeMenuProps = {
  /** `undefined` antes da hidratação (o tema só é conhecido no cliente). */
  tema?: Tema;
  /** Tema efetivo quando `tema="system"`, para o ícone do botão. */
  temaResolvido?: "light" | "dark";
  onTemaChange: (tema: Tema) => void;
  /** `false` nas histórias do catálogo com o menu aberto. */
  modal?: boolean;
};

/** Alternador de tema da topbar (RF-03): Claro, Escuro ou Sistema. Quem chama persiste (next-themes). */
export function ThemeMenu({ tema, temaResolvido, onTemaChange, modal }: ThemeMenuProps) {
  const atual = OPCOES.find((o) => o.valor === tema);
  const IconeBotao = (tema === "system" ? (temaResolvido === "dark" ? Moon : Sun) : atual?.icone) ?? Sun;
  return (
    <DropdownMenu modal={modal}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          icon={IconeBotao}
          aria-label={atual ? `Tema: ${atual.rotulo}` : "Tema"}
          className="max-lg:size-11"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Tema</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={tema} onValueChange={(v) => onTemaChange(v as Tema)}>
          {OPCOES.map((o) => (
            <DropdownMenuRadioItem key={o.valor} value={o.valor}>
              <Icon icon={o.icone} size={16} />
              {o.rotulo}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
