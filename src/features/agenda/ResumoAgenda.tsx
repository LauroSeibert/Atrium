import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { formatMoeda, formatNumero } from "@/lib/format";

export type ResumoDados = {
  /** "Resumo da semana", "Resumo de hoje"… */
  titulo: string;
  visitas: number;
  vencimentos: number;
  /** Soma dos vencimentos do período, em centavos. */
  aReceber: number;
  porCorretor: readonly { nome: string; visitas: number }[];
};

/**
 * Trilho lateral da Agenda: resumo em tinta (único painel em tinta da tela) e visitas por corretor.
 * Só apresentação dos totais que a tela já calculou.
 */
export function ResumoAgenda({ resumo, className }: { resumo: ResumoDados; className?: string }) {
  return (
    <aside aria-label={resumo.titulo} className={cn("flex min-w-0 flex-col gap-6", className)}>
      <section className="tinta rounded-lg bg-ink-panel p-7 text-text">
        <h2 className="eyebrow">{resumo.titulo}</h2>
        <dl className="mt-5 grid grid-cols-2 gap-5">
          <div className="flex flex-col-reverse">
            <dt className="mt-1.5 text-caption text-text-muted">{resumo.visitas === 1 ? "visita" : "visitas"}</dt>
            <dd className="display text-5xl leading-display">{formatNumero(resumo.visitas)}</dd>
          </div>
          <div className="flex flex-col-reverse">
            <dt className="mt-1.5 text-caption text-text-muted">
              {resumo.vencimentos === 1 ? "vencimento" : "vencimentos"}
            </dt>
            <dd className="display text-5xl leading-display">{formatNumero(resumo.vencimentos)}</dd>
          </div>
        </dl>
        {resumo.vencimentos > 0 ? (
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-caption text-text-muted">A receber no período</p>
            <p className="mt-1.5 num text-xl text-text">{formatMoeda(resumo.aReceber)}</p>
            <div aria-hidden="true" className="mt-3.5 h-0.5 w-12 rounded-full bg-accent" />
          </div>
        ) : null}
      </section>
      {resumo.porCorretor.length > 0 ? (
        <section className="rounded-lg border border-border bg-surface px-6 pt-6 pb-2">
          <h2 className="eyebrow">Visitas por corretor</h2>
          <ul className="mt-3">
            {resumo.porCorretor.map((c) => (
              <li key={c.nome} className="flex items-center gap-3 border-t border-border-soft py-3.5 first:border-t-0">
                <Avatar name={c.nome} size={32} aria-hidden className="border border-border" />
                <span className="min-w-0 flex-1 truncate text-sm text-text">{c.nome}</span>
                <span className="num text-caption text-text">{formatNumero(c.visitas)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}
