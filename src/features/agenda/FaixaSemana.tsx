import { cn } from "@/lib/cn";

/** Um dia da faixa: `data` = `AAAA-MM-DD`; `quantidade` = compromissos carregados nesse dia. */
export type DiaFaixa = { data: string; quantidade: number };

const diaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const diaLongo = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const noonUtc = (data: string) => new Date(`${data}T12:00:00Z`);

/**
 * Faixa dos próximos sete dias (RF-73): fio de tinta em cima, dia em serifa e um ponto quando há
 * compromissos. Hoje fica sobre papel. Só apresentação: quem chama diz quantos itens cada dia tem.
 */
export function FaixaSemana({
  dias,
  hoje,
  className,
}: {
  dias: readonly DiaFaixa[];
  hoje: string;
  className?: string;
}) {
  return (
    // Rola na horizontal no celular: região focável para quem usa teclado (WCAG 2.1.1).
    <div
      role="region"
      aria-label="Semana"
      tabIndex={0}
      className={cn(
        "overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <ol
        aria-label="Próximos sete dias"
        className="grid min-w-140 grid-cols-7 border-t border-b border-t-text border-b-border"
      >
        {dias.map((d, i) => {
          const ehHoje = d.data === hoje;
          const texto = `${diaLongo.format(noonUtc(d.data))}: ${
            d.quantidade === 0
              ? "sem compromissos"
              : `${d.quantidade} ${d.quantidade === 1 ? "compromisso" : "compromissos"}`
          }`;
          return (
            <li
              key={d.data}
              aria-label={texto}
              aria-current={ehHoje ? "date" : undefined}
              className={cn(
                "flex flex-col gap-2 px-3 pt-4 pb-4",
                i > 0 && "border-l border-border",
                ehHoje && "bg-surface",
              )}
            >
              <span aria-hidden="true" className={cn("eyebrow", ehHoje && "text-text")}>
                {ehHoje ? "Hoje" : diaSemana.format(noonUtc(d.data)).replace(".", "")}
              </span>
              <span aria-hidden="true" className="display text-3xl leading-display text-text">
                {Number(d.data.slice(8, 10))}
              </span>
              <span
                aria-hidden="true"
                className={cn("mt-1 size-1.5 rounded-full", d.quantidade > 0 ? "bg-text" : "bg-stone")}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
