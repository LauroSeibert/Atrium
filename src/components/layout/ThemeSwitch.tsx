"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/Button";

export type Tema = "light" | "dark" | "system";

export type ThemeSwitchProps = {
  /** Tema efetivo na tela; `undefined` antes da hidratação (o tema só é conhecido no cliente). */
  temaResolvido?: "light" | "dark";
  /** Um clique alterna claro ↔ escuro. Quem chama decide o que gravar (ver `proximoTema`). */
  onAlternar: () => void;
};

/**
 * Alternância de tema da topbar (RF-03): um clique, sem menu. O padrão é seguir o sistema;
 * o botão mostra o tema para onde vai (lua no claro, sol no escuro).
 */
export function ThemeSwitch({ temaResolvido, onAlternar }: ThemeSwitchProps) {
  const escuro = temaResolvido === "dark";
  return (
    <Button
      variant="ghost"
      role="switch"
      aria-checked={temaResolvido === undefined ? undefined : escuro}
      aria-label="Tema escuro"
      icon={escuro ? Sun : Moon}
      onClick={onAlternar}
      className="max-lg:size-11"
    />
  );
}

/**
 * O que gravar ao alternar: se o tema novo for o mesmo do sistema, volta a seguir o sistema
 * (`"system"`), assim a preferência do sistema sempre vem primeiro.
 */
export function proximoTema(resolvido: "light" | "dark" | undefined, sistema: "light" | "dark"): Tema {
  const novo = resolvido === "dark" ? "light" : "dark";
  return novo === sistema ? "system" : novo;
}

/** Tema do sistema operacional no momento. */
export function temaDoSistema(): "light" | "dark" {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
