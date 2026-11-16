"use client";
/**
 * Detalhe do lead (RF-33, RF-34, RF-37, RF-65). Conteúdo reutilizado em página cheia (acesso direto) e no
 * drawer da rota interceptada (`modo`). Mudanças de etapa passam pelo mesmo `useMoverLead` do quadro.
 */
import { rotaDoImovel } from "@/components/layout/navegacao";
import { CalendarPlus, ChevronDown, Mail, Phone, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActivityFeed } from "@/components/patterns/ActivityFeed";
import { ChangeLog } from "@/components/patterns/ChangeLog";
import { EstadoRecurso } from "@/components/patterns/EstadoRecurso";
import { SectionCard } from "@/components/patterns/SectionCard";
import {
  ETAPA_UI,
  FINALIDADE_ROTULO,
  MOTIVO_PERDA_ROTULO,
  ORIGEM_ROTULO,
  TIPO_IMOVEL_ROTULO,
} from "@/components/patterns/rotulos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DrawerBody, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/Drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { Field } from "@/components/ui/Field";
import { formatMoeda, formatTelefone } from "@/lib/format";
import { ErroApi } from "@/mocks/services/erros";
import { fakeApi } from "@/mocks/services/fakeApi";
import { useEscrita } from "@/features/dados/escrita";
import { useConsulta } from "@/features/dados/useConsulta";
import { DefinirTrilha } from "@/features/shell/trilha";
import { AgendarVisita } from "./AgendarVisita";
import { useMoverLead } from "./useMoverLead";

export type TelaLeadProps = { id: string; modo: "pagina" | "drawer" };

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-2 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-sm text-text-muted">{rotulo}</dt>
      <dd className="min-w-0 text-sm break-words text-text sm:text-right">{children}</dd>
    </div>
  );
}

function CarregandoLead() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando lead" className="flex flex-col gap-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton shape="rect" className="h-48 rounded-lg" />
      <Skeleton shape="rect" className="h-48 rounded-lg" />
    </div>
  );
}

function FormNota({ leadId }: { leadId: string }) {
  const [texto, setTexto] = useState("");
  const { estado, executar } = useEscrita();
  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || estado.fase === "enviando") return;
    const r = await executar(() => fakeApi.addNota(leadId, texto), { sucesso: "Nota adicionada", silenciarErro: true });
    if (r.fase === "ok") setTexto("");
  }
  return (
    <form onSubmit={(e) => void enviar(e)} className="flex flex-col gap-2" aria-label="Adicionar nota">
      <Field label="Nova nota" requirement="optional" error={estado.fase === "erro" ? estado.mensagem : undefined}>
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={500} rows={3} />
      </Field>
      <Button
        type="submit"
        variant="secondary"
        leadingIcon={SendHorizontal}
        loading={estado.fase === "enviando"}
        disabled={!texto.trim()}
        className="self-end"
      >
        Adicionar nota
      </Button>
    </form>
  );
}

export function TelaLead({ id, modo }: TelaLeadProps) {
  const { estado, recarregar } = useConsulta(useCallback(() => fakeApi.getLead(id), [id]));
  const { estado: atividades, recarregar: recarregarAtividades } = useConsulta(
    useCallback(() => fakeApi.listAtividades({ alvo: { tipo: "lead", id }, limite: 100 }), [id]),
  );
  const { estado: alteracoes, recarregar: recarregarAlteracoes } = useConsulta(
    useCallback(() => fakeApi.listAlteracoes({ tipo: "lead", id }), [id]),
  );
  const { estado: corretoresEstado } = useConsulta(useCallback(() => fakeApi.listCorretores(), []));
  const autores = useMemo(
    () =>
      Object.fromEntries(
        ("dados" in corretoresEstado ? (corretoresEstado.dados ?? []) : []).map((c) => [c.id, c.nome]),
      ),
    [corretoresEstado],
  );
  const { mover, dialogos } = useMoverLead();
  const [visitaAberta, setVisitaAberta] = useState(false);
  const nome = "dados" in estado && estado.dados ? estado.dados.lead.nome : undefined;
  const nivel = modo === "drawer" ? 3 : 2;
  const naoEncontrado =
    estado.fase === "error" && estado.erro instanceof ErroApi && estado.erro.tipo === "naoEncontrado";

  const voltar = (
    <Button asChild variant="secondary">
      <Link href="/leads">Voltar para leads</Link>
    </Button>
  );

  const cabecalho =
    modo === "drawer" ? (
      <DrawerHeader>
        <DrawerTitle className="break-words">{nome ?? "Lead"}</DrawerTitle>
        <DrawerDescription className="sr-only">Detalhes do lead</DrawerDescription>
      </DrawerHeader>
    ) : (
      <PageHeader titulo={nome ?? "Lead"} />
    );

  const corpo = (
    <EstadoRecurso
      estado={estado}
      carregando={<CarregandoLead />}
      erro={naoEncontrado ? { titulo: "Lead não encontrado" } : { titulo: "Não foi possível carregar o lead" }}
      onTentarNovamente={naoEncontrado ? undefined : recarregar}
    >
      {({ lead, responsavel, imoveisVistos, visitas, contrato, transicoes }) => {
        const etapa = ETAPA_UI[lead.etapa];
        const i = lead.interesse;
        return (
          <div className="flex animate-fade-in flex-col gap-4">
            <DefinirTrilha rotulo={lead.nome} />
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={etapa.tom}>{etapa.rotulo}</Badge>
              {lead.motivoPerda ? (
                <span className="text-sm text-text-muted">
                  Motivo da perda: {MOTIVO_PERDA_ROTULO[lead.motivoPerda]}
                </span>
              ) : null}
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" trailingIcon={ChevronDown} disabled={transicoes.length === 0}>
                      Mover para…
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Mover para…</DropdownMenuLabel>
                    {transicoes.map((t) => (
                      <DropdownMenuItem key={t.para} onSelect={() => mover(lead, t.para, undefined, t.exigeMotivo)}>
                        {ETAPA_UI[t.para].rotulo}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button leadingIcon={CalendarPlus} onClick={() => setVisitaAberta(true)}>
                  Agendar visita
                </Button>
              </div>
            </div>
            {contrato ? <p className="text-sm text-text-muted">Contrato vinculado: {contrato.numero}</p> : null}

            <SectionCard headingLevel={nivel} titulo="Contato e interesse">
              <dl className="flex flex-col">
                <Linha rotulo="Telefone">
                  {lead.contato.telefone ? (
                    <Button asChild variant="link">
                      <a href={`tel:${lead.contato.telefone}`}>
                        <Phone size={16} aria-hidden="true" />
                        {formatTelefone(lead.contato.telefone)}
                      </a>
                    </Button>
                  ) : (
                    "—"
                  )}
                </Linha>
                <Linha rotulo="E-mail">
                  {lead.contato.email ? (
                    <Button asChild variant="link">
                      <a href={`mailto:${lead.contato.email}`}>
                        <Mail size={16} aria-hidden="true" />
                        {lead.contato.email}
                      </a>
                    </Button>
                  ) : (
                    "—"
                  )}
                </Linha>
                <Linha rotulo="Origem">{ORIGEM_ROTULO[lead.origem]}</Linha>
                <Linha rotulo="Orçamento">{lead.orcamento === null ? "—" : formatMoeda(lead.orcamento)}</Linha>
                <Linha rotulo="Finalidade">{FINALIDADE_ROTULO[i.finalidade]}</Linha>
                <Linha rotulo="Tipos">
                  {i.tipos.length ? i.tipos.map((t) => TIPO_IMOVEL_ROTULO[t]).join(", ") : "—"}
                </Linha>
                <Linha rotulo="Bairros">{i.bairros.length ? i.bairros.join(", ") : "—"}</Linha>
                <Linha rotulo="Quartos (mínimo)">{i.quartosMin ?? "—"}</Linha>
                <Linha rotulo="Responsável">{responsavel?.nome ?? "—"}</Linha>
              </dl>
            </SectionCard>

            {imoveisVistos.length > 0 ? (
              <SectionCard headingLevel={nivel} titulo="Imóveis vistos">
                <ul className="flex flex-col gap-2">
                  {imoveisVistos.map((im) => (
                    <li key={im.id} className="text-sm break-words">
                      <Button asChild variant="link" className="text-left whitespace-normal">
                        <Link href={rotaDoImovel(im)}>
                          {im.codigo} · {im.titulo}
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
                {visitas.length > 0 ? (
                  <p className="text-sm text-text-muted">
                    {visitas.length} {visitas.length === 1 ? "visita registrada" : "visitas registradas"}
                  </p>
                ) : null}
              </SectionCard>
            ) : null}

            <SectionCard headingLevel={nivel} titulo="Linha do tempo">
              <FormNota leadId={lead.id} />
              <ActivityFeed
                estado={atividades}
                autores={autores}
                agruparPorDia
                aria-label="Linha do tempo do lead"
                onTentarNovamente={recarregarAtividades}
              />
            </SectionCard>

            <SectionCard headingLevel={nivel} titulo="Histórico de alterações">
              <ChangeLog estado={alteracoes} autores={autores} onTentarNovamente={recarregarAlteracoes} />
            </SectionCard>

            <AgendarVisita leadId={lead.id} aberto={visitaAberta} onAbertoChange={setVisitaAberta} />
          </div>
        );
      }}
    </EstadoRecurso>
  );

  return (
    <>
      {nome === undefined ? <DefinirTrilha rotulo={undefined} /> : null}
      {cabecalho}
      {modo === "drawer" ? <DrawerBody>{corpo}</DrawerBody> : corpo}
      {estado.fase === "error" && modo === "pagina" && naoEncontrado ? (
        <div className="flex justify-center">{voltar}</div>
      ) : null}
      {dialogos}
    </>
  );
}
