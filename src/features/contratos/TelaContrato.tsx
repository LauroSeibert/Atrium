"use client";
/**
 * Contrato — detalhe e cronograma (RF-42, RF-43, RF-46, RF-48, RF-65).
 * O que é permitido (registrar pagamento, assinar, encerrar, cancelar) vem do domínio:
 * `podeRegistrarPagamento` e `transicoes` do `fakeApi.getContrato`. A tela só pergunta e emite a intenção.
 */
import { rotaDoImovel } from "@/components/layout/navegacao";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChangeLog } from "@/components/patterns/ChangeLog";
import { ConfirmDestructive, type FaseConfirmacao } from "@/components/patterns/ConfirmDestructive";
import { ErrorState } from "@/components/patterns/ErrorState";
import {
  PaymentSchedule,
  PaymentScheduleSkeleton,
  type AcaoParcela,
  type ItemParcela,
} from "@/components/patterns/PaymentSchedule";
import { STATUS_CONTRATO_UI, TIPO_CONTRATO_ROTULO } from "@/components/patterns/rotulos";
import { SectionCard } from "@/components/patterns/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Destaque } from "@/components/ui/Typography";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { podeRegistrarPagamento, type TipoContrato } from "@/domain";
import { useConsulta } from "@/features/dados/useConsulta";
import { executarEscrita, useEscrita } from "@/features/dados/escrita";
import { DefinirTrilha } from "@/features/shell/trilha";
import { formatData, formatDocumentoMascarado, formatMoeda, formatPercentual } from "@/lib/format";
import { ErroApi } from "@/mocks/services/erros";
import { fakeApi } from "@/mocks/services/fakeApi";
import { SecaoDespesas } from "./SecaoDespesas";
import { SecaoDocumentos } from "./SecaoDocumentos";
import type { DetalheContrato } from "./tipos";

const PAPEL: Record<string, string> = {
  comprador: "Comprador",
  vendedor: "Vendedor",
  locatario: "Locatário",
  locador: "Locador",
  fiador: "Fiador",
};

const moeda = (c: number) => formatMoeda(c);

/** Título do cronograma por tipo (apresentação). */
const TITULO_CRONOGRAMA: Record<TipoContrato, string> = {
  locacao: "Cronograma de aluguéis",
  venda: "Cronograma de parcelas",
};

function Medida({ rotulo, valor, alerta = false }: { rotulo: string; valor: number; alerta?: boolean }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id}>
      <p id={id} className="eyebrow">
        {rotulo}
      </p>
      <p className={cn("mt-2 num text-xl", alerta && "text-danger")}>{moeda(valor)}</p>
    </div>
  );
}

function Corpo({ d, corretores }: { d: DetalheContrato; corretores: Record<string, string> }) {
  const { contrato } = d;
  const [acaoParcela, setAcaoParcela] = useState<AcaoParcela>({ fase: "idle" });
  const [cancelando, setCancelando] = useState(false);
  const cancelamento = useEscrita();

  const itens: ItemParcela[] = d.parcelas.map((p) => ({
    parcela: { numero: p.numero, vencimento: p.vencimento, valor: p.valor, pagoEm: p.pagoEm },
    status: p.status,
    diasAtraso: p.diasAtraso,
    podeRegistrar: podeRegistrarPagamento(contrato, p.numero),
  }));
  const { resumo, repasses } = d;
  const status = STATUS_CONTRATO_UI[d.statusExibicao];

  const registrar = async (numero: number) => {
    setAcaoParcela({ fase: "enviando", numero });
    const r = await executarEscrita(() => fakeApi.registrarPagamento(contrato.id, numero), {
      sucesso: `Pagamento da parcela ${numero} registrado`,
      silenciarErro: true,
    });
    setAcaoParcela(r.fase === "ok" ? { fase: "idle" } : { fase: "erro", numero, mensagem: r.erro.message });
  };

  const transicao = (para: "ativo" | "encerrado" | "cancelado") => d.transicoes.find((t) => t.para === para);
  const podeAssinar = transicao("ativo");
  const podeEncerrar = transicao("encerrado");
  const podeCancelar = transicao("cancelado");

  const fase: FaseConfirmacao =
    cancelamento.estado.fase === "enviando"
      ? { fase: "confirmando" }
      : cancelamento.estado.fase === "erro"
        ? { fase: "erro", mensagem: cancelamento.estado.mensagem }
        : { fase: "idle" };

  const cancelar = async (motivo?: string) => {
    const r = await cancelamento.executar(() => fakeApi.cancelarContrato(contrato.id, motivo ?? ""), {
      sucesso: `Contrato ${contrato.numero} cancelado`,
      silenciarErro: true,
    });
    if (r.fase === "ok") setCancelando(false);
  };

  const imovel = d.imovel;

  return (
    <>
      <DefinirTrilha rotulo={contrato.numero} />
      <PageHeader
        eyebrow="Operação · contrato"
        titulo={
          <span className="flex flex-wrap items-center gap-3">
            Contrato <span className="num text-2xl text-text-2">{contrato.numero}</span>
            <Badge tone={status.tom} dot>
              {status.rotulo}
            </Badge>
          </span>
        }
        acoes={
          <>
            {podeEncerrar ? (
              <Button
                variant="secondary"
                onClick={() =>
                  void executarEscrita(() => fakeApi.encerrarContrato(contrato.id), {
                    sucesso: `Contrato ${contrato.numero} encerrado`,
                  })
                }
              >
                Encerrar contrato
              </Button>
            ) : null}
            {podeCancelar ? (
              <Button variant="secondary" onClick={() => setCancelando(true)}>
                Cancelar contrato
              </Button>
            ) : null}
          </>
        }
        acaoPrimaria={
          podeAssinar ? (
            <Button
              onClick={() =>
                void executarEscrita(() => fakeApi.assinarContrato(contrato.id), {
                  sucesso: `Contrato ${contrato.numero} assinado`,
                })
              }
            >
              Assinar contrato
            </Button>
          ) : undefined
        }
      />

      <div className="flex min-w-0 flex-col gap-8">
        <section aria-label="Resumo de valor" className="tinta rounded-lg bg-ink-panel p-7 text-text sm:p-8">
          <p className="eyebrow">Valor do contrato</p>
          <p className="mt-4 mb-6">
            <Destaque valor={moeda(contrato.valor)} size="5xl" />
          </p>
          {resumo.total > 0 ? (
            <>
              <div
                role="progressbar"
                aria-label="Parcelas pagas"
                aria-valuemin={0}
                aria-valuemax={resumo.total}
                aria-valuenow={resumo.pagas}
                aria-valuetext={`${resumo.pagas} de ${resumo.total} parcelas pagas`}
                className="h-1 rounded-full bg-ink-track"
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${resumo.total > 0 ? (resumo.pagas / resumo.total) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-2 num text-xs text-text-muted">
                {resumo.pagas} de {resumo.total} parcelas pagas
              </p>
            </>
          ) : null}
          <div className="mt-7 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-border pt-6 sm:grid-cols-3">
            <Medida rotulo="Pago" valor={resumo.recebido} />
            <Medida rotulo="A receber" valor={resumo.aReceber} />
            <Medida rotulo="Atrasado" valor={resumo.emAtraso} alerta={resumo.atrasadas > 0} />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard titulo="Dados do contrato">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-caption text-text-muted">Tipo</dt>
                <dd className="font-medium">{TIPO_CONTRATO_ROTULO[contrato.tipo]}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-muted">Valor</dt>
                <dd className="num font-medium">{moeda(contrato.valor)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-caption text-text-muted">Vigência</dt>
                <dd className="tnum font-medium">
                  {formatData(contrato.inicio)} a {formatData(contrato.fim)}
                </dd>
              </div>
              {contrato.taxaAdministracao !== null ? (
                <div>
                  <dt className="text-caption text-text-muted">Taxa de administração</dt>
                  <dd className="tnum font-medium">{formatPercentual(contrato.taxaAdministracao / 100)}</dd>
                </div>
              ) : null}
              {contrato.motivoCancelamento ? (
                <div className="col-span-2">
                  <dt className="text-caption text-text-muted">Motivo do cancelamento</dt>
                  <dd className="font-medium break-words">{contrato.motivoCancelamento}</dd>
                </div>
              ) : null}
            </dl>
            <div className="flex flex-col gap-1 border-t border-border-soft pt-3 text-sm">
              <span className="text-text-muted">Imóvel</span>
              {imovel ? (
                <Button asChild variant="link" className="justify-start text-left whitespace-normal">
                  <Link href={rotaDoImovel(imovel)}>
                    {imovel.titulo} ({imovel.codigo})
                  </Link>
                </Button>
              ) : (
                <span className="text-text-muted">Imóvel removido</span>
              )}
            </div>
            {/* RF-39: lead de origem, pela negociação vinculada. */}
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-text-muted">Lead</span>
              {d.lead ? (
                <Button asChild variant="link" className="justify-start text-left whitespace-normal">
                  <Link href={`/leads/${d.lead.id}`}>{d.lead.nome}</Link>
                </Button>
              ) : (
                <span className="text-text-muted">Sem negociação vinculada</span>
              )}
            </div>
          </SectionCard>

          <SectionCard titulo="Partes">
            <ul className="flex flex-col divide-y divide-border-soft">
              {contrato.partes.map((p) => (
                <li
                  key={`${p.papel}-${p.documento}`}
                  className="flex flex-col gap-0.5 py-2 text-sm first:pt-0 last:pb-0"
                >
                  <span className="text-text-muted">{PAPEL[p.papel]}</span>
                  <span className="font-medium break-words">{p.nome}</span>
                  <span className="num text-caption text-text-muted">{formatDocumentoMascarado(p.documento)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        {contrato.comissoes.length > 0 ? (
          <SectionCard titulo="Comissão">
            <Table aria-label="Comissões do contrato" density="compact">
              <TableHeader>
                <TableRow>
                  <TableHead>Corretor</TableHead>
                  <TableHead align="right">Percentual</TableHead>
                  <TableHead align="right">Valor</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contrato.comissoes.map((c) => (
                  <TableRow key={`${c.corretorId}-${c.competencia}`}>
                    <TableCell>{corretores[c.corretorId] ?? "Corretor removido"}</TableCell>
                    <TableCell align="right">{formatPercentual(c.percentual / 100)}</TableCell>
                    <TableCell align="right">{moeda(c.valor)}</TableCell>
                    <TableCell className="tnum">{formatData(`${c.competencia}-01`, "mesAno")}</TableCell>
                    <TableCell className="tnum">{c.pagaEm ? `Paga em ${formatData(c.pagaEm)}` : "A pagar"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        ) : null}

        <SectionCard titulo={TITULO_CRONOGRAMA[contrato.tipo]}>
          <PaymentSchedule
            estado={{ fase: "success", dados: itens }}
            resumo={resumo}
            onRegistrarPagamento={registrar}
            acao={acaoParcela}
          />
        </SectionCard>

        {repasses !== null && repasses.length > 0 ? (
          <SectionCard titulo="Repasses ao proprietário">
            <Table aria-label="Repasses ao proprietário" density="compact">
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead align="right">Aluguel</TableHead>
                  <TableHead align="right">Taxa de administração</TableHead>
                  <TableHead align="right">Repasse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repasses.map((r) => (
                  <TableRow key={r.numero}>
                    <TableCell className="tnum">{formatData(r.vencimento, "mesAno")}</TableCell>
                    <TableCell align="right">{moeda(r.aluguel)}</TableCell>
                    <TableCell align="right">{moeda(r.aluguel - r.repasse)}</TableCell>
                    <TableCell align="right" className="font-medium">
                      {moeda(r.repasse)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        ) : null}

        <SecaoDocumentos contratoId={contrato.id} />

        <SecaoDespesas contratoId={contrato.id} />

        <Historico contratoId={contrato.id} corretores={corretores} />
      </div>

      <ConfirmDestructive
        aberto={cancelando}
        onAbertoChange={(a) => {
          setCancelando(a);
          if (!a) cancelamento.limpar();
        }}
        titulo={`Cancelar o contrato ${contrato.numero}?`}
        impactos={[
          "O contrato passa para cancelado e as parcelas em aberto deixam de valer.",
          "O imóvel volta a ficar disponível, se o contrato estava ativo.",
          "Dá para desfazer logo depois pelo aviso.",
        ]}
        motivo={{ tipo: "texto", rotulo: "Motivo do cancelamento", obrigatorio: true, maxLength: 200 }}
        rotuloConfirmar="Cancelar contrato"
        rotuloVoltar="Manter contrato"
        fase={fase}
        onConfirmar={cancelar}
      />
    </>
  );
}

function Historico({ contratoId, corretores }: { contratoId: string; corretores: Record<string, string> }) {
  const carregar = useCallback(() => fakeApi.listAlteracoes({ tipo: "contrato", id: contratoId }), [contratoId]);
  const { estado, recarregar } = useConsulta(carregar);
  return (
    <SectionCard titulo="Histórico de alterações">
      <ChangeLog estado={estado} autores={corretores} onTentarNovamente={recarregar} />
    </SectionCard>
  );
}

function Carregando() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">Carregando contrato…</span>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} shape="rect" className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton shape="rect" className="h-48 rounded-lg" />
      <PaymentScheduleSkeleton />
    </div>
  );
}

export function TelaContrato({ id }: { id: string }) {
  const carregar = useCallback(async () => {
    const [detalhe, corretores] = await Promise.all([fakeApi.getContrato(id), fakeApi.listCorretores()]);
    return { detalhe, corretores: Object.fromEntries(corretores.map((c) => [c.id, c.nome])) };
  }, [id]);
  const { estado, recarregar } = useConsulta(carregar);
  const dados = useMemo(() => ("dados" in estado ? estado.dados : undefined), [estado]);

  if (dados) return <Corpo d={dados.detalhe} corretores={dados.corretores} />;

  if (estado.fase === "error") {
    const naoEncontrado = estado.erro instanceof ErroApi && estado.erro.tipo === "naoEncontrado";
    return (
      <>
        <PageHeader titulo="Contrato" />
        <ErrorState
          titulo={naoEncontrado ? "Contrato não encontrado" : "Não foi possível carregar o contrato"}
          descricao={naoEncontrado ? "O link pode estar errado ou o contrato foi removido." : undefined}
          onTentarNovamente={naoEncontrado ? undefined : recarregar}
          acao={
            <Button asChild variant="secondary" leadingIcon={ArrowLeft}>
              <Link href="/contratos">Voltar para contratos</Link>
            </Button>
          }
        />
      </>
    );
  }
  return (
    <>
      <PageHeader titulo="Contrato" />
      <Carregando />
    </>
  );
}
