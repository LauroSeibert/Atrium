"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const OPTIONS = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
] as const;

const subscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Evita divergência de hidratação: o tema só é conhecido no cliente.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <div
      role="group"
      aria-label="Tema"
      className="inline-flex rounded-full border border-border-strong bg-surface p-1 shadow-1"
    >
      {OPTIONS.map((opt) => {
        const active = mounted && theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(opt.value)}
            className={[
              "rounded-full px-3 py-1 text-sm font-medium transition-colors duration-(--dur-fast) ease-standard",
              active ? "bg-primary text-on-primary" : "text-text-muted hover:text-text",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
