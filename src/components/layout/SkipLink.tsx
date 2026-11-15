/** "Ir para o conteúdo" (RNF-03, WCAG 2.4.1): primeiro elemento focável; aparece só com foco. */
export function SkipLink({ alvo = "conteudo" }: { alvo?: string }) {
  return (
    <a
      href={`#${alvo}`}
      className={[
        "sr-only rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-2",
        "focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-(--z-toast)",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      ].join(" ")}
    >
      Ir para o conteúdo
    </a>
  );
}
