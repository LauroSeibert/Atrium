"use client";
/**
 * Detalhe do lead (RF-33, RF-34, RF-37, RF-65, RF-70…72). Conteúdo reutilizado em página cheia (acesso direto)
 * e no drawer da rota interceptada (`modo`). O lead é a pessoa; etapa é de cada negociação, e as mudanças passam
 * pelo mesmo `useMoverNegociacao` do quadro.
 */
import { rotaDoImovel } from "@/components/layout/navegacao";
import { CalendarPlus, ChevronDown, Mail, Phone, Plus, SendHorizontal } from "lucide-react";
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
import { DialogoNegociacao, type ModoDialogoNegociacao } from "./DialogoNegociacao";
import { useMoverNegociacao } from "./useMoverLead";

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
  // Histórico do lead (orçamento) + o das negociações dele (etapa), numa lista só.
  const { estado: alteracoes, recarregar: recarregarAlteracoes } = useConsulta(
    useCallback(() => fakeApi.listAlteracoesDoLead(id), [id]),
  );
  const { estado: corretoresEstado } = useConsulta(useCallback(() => fakeApi.listCorretores(), []));
  const autores = useMemo(
    () =>
      Object.fromEntries(
        ("dados" in corretoresEstado ? (corretoresEstado.dados ?? []) : []).map((c) => [c.id, c.nome]),
      ),
    [corretoresEstado],
  );
  const { mover, vincular, dialogos } = useMoverNegociacao();
  const [visitaAberta, setVisitaAberta] = useState(false);
  const [dialogoNegociacao, setDialogoNegociacao] = useState<ModoDialogoNegociacao | null>(null);
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
      {({ lead, responsavel, imoveisVistos, visitas, negociacoes, podeAgendarVisita }) => {
        const i = lead.interesse;
        return (
          <div className="flex animate-fade-in flex-col gap-4">
            <DefinirTrilha rotulo={lead.nome} />
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-text-muted">
                {negociacoes.length} {negociacoes.length === 1 ? "negociação" : "negociações"}
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  leadingIcon={Plus}
                  onClick={() => setDialogoNegociacao({ modo: "nova", leadId: lead.id })}
                >
                  Nova negociação
                </Button>
                <Button
                  leadingIcon={CalendarPlus}
                  onClick={() => setVisitaAberta(true)}
                  disabled={!podeAgendarVisita.ok}
                  aria-describedby={podeAgendarVisita.ok ? undefined : `${lead.id}-sem-visita`}
                >
                  Agendar visita
                </Button>
              </div>
            </div>
            {podeAgendarVisita.ok ? null : (
              <p id={`${lead.id}-sem-visita`} className="text-sm text-text-muted">
                {podeAgendarVisita.motivo}
              </p>
            )}

            <SectionCard headingLevel={nivel} titulo="Negociações">
              <ul className="flex flex-col">
                {negociacoes.map((n) => {
                  const etapa = ETAPA_UI[n.etapa];
                  const rotulo = n.imovel ? `${n.imovel.codigo} · ${n.imovel.titulo}` : "Sem imóvel";
                  return (
                    <li
                      key={n.id}
                      className="flex flex-col gap-2 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="text-sm break-words text-text">
                          {n.imovel ? (
                            <Button asChild variant="link" className="text-left whitespace-normal">
                              <Link href={rotaDoImovel(n.imovel)}>{rotulo}</Link>
                            </Button>
                          ) : (
                            <span className="text-text-muted">Sem imóvel</span>
                          )}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
                          <Badge tone={etapa.tom}>{etapa.rotulo}</Badge>
                          <span className="tnum">{n.valor === null ? "Sem valor" : formatMoeda(n.valor)}</span>
                          {n.motivoPerda ? <span>Motivo da perda: {MOTIVO_PERDA_ROTULO[n.motivoPerda]}</span> : null}
                          {n.contrato ? <span>Contrato vinculado: {n.contrato.numero}</span> : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {n.podeDefinirImovel.ok ? (
                          <Button
                            variant="ghost"
                            onClick={() => setDialogoNegociacao({ modo: "definir", negociacaoId: n.id })}
                          >
                            Definir imóvel
                          </Button>
                        ) : null}
                        {n.podeVincular ? (
                          <Button
                            variant="ghost"
                            onClick={() =>
                              vincular({
                                id: n.id,
                                etapa: n.etapa,
                                rotulo: `${lead.nome} (${n.imovel ? n.imovel.codigo : "sem imóvel"})`,
                              })
                            }
                          >
                            Vincular contrato
                          </Button>
                        ) : null}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              trailingIcon={ChevronDown}
                              disabled={n.transicoes.length === 0}
                              aria-label={`Mover negociação ${rotulo} para…`}
                            >
                              Mover para…
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Mover para…</DropdownMenuLabel>
                            {n.transicoes.map((t) => (
                              <DropdownMenuItem
                                key={t.para}
                                onSelect={() =>
                                  mover(
                                    {
                                      id: n.id,
                                      etapa: n.etapa,
                                      rotulo: `${lead.nome} (${n.imovel ? n.imovel.codigo : "sem imóvel"})`,
                                    },
                                    t.para,
                                    undefined,
                                    t.exigeMotivo,
                                  )
                                }
                              >
                                {ETAPA_UI[t.para].rotulo}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>

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
            <DialogoNegociacao alvo={dialogoNegociacao} onFechar={() => setDialogoNegociacao(null)} />
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
