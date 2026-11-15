"use client";
/**
 * Detalhe do imóvel (RF-24…26, RF-29, RF-65). Contêiner: dados do fakeApi; as trocas de status
 * oferecidas são exatamente as `transicoes` que o domínio devolveu em `getImovel`.
 */
import Link from "next/link";
import { ChevronDown, Pencil } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ActivityFeed } from "@/components/patterns/ActivityFeed";
import { ChangeLog } from "@/components/patterns/ChangeLog";
import { ErrorState } from "@/components/patterns/ErrorState";
import { FeatureChips } from "@/components/patterns/FeatureChips";
import { BotaoFavorito, PrecoImovel, SelosImovel } from "@/components/patterns/PropertyCard";
import { PropertyGallery } from "@/components/patterns/PropertyGallery";
import { SpecList } from "@/components/patterns/SpecList";
import { STATUS_CONTRATO_UI, STATUS_IMOVEL_UI, TIPO_IMOVEL_ROTULO } from "@/components/patterns/rotulos";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Heading, Text } from "@/components/ui/Typography";
import { paraErroApi } from "@/mocks/services/erros";
import { fakeApi } from "@/mocks/services/fakeApi";
import { executarEscrita } from "@/features/dados/escrita";
import { useConsulta } from "@/features/dados/useConsulta";
import { AcaoLink } from "@/features/shell/AcaoLink";
import { DefinirTrilha } from "@/features/shell/trilha";
import { DialogoStatusImovel, type AlvoStatus } from "./DialogoStatusImovel";

type DadosImovel = Awaited<ReturnType<typeof fakeApi.getImovel>>;

const VOLTAR = (
  <Button asChild variant="secondary">
    <Link href="/imoveis">Voltar para imóveis</Link>
  </Button>
);

function Secao({ titulo, children, className }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <Card asChild className={className}>
      <section aria-label={titulo} className="flex min-w-0 flex-col gap-4 p-4 md:p-6">
        <Heading level={2} size="lg">
          {titulo}
        </Heading>
        {children}
      </section>
    </Card>
  );
}

export function TelaImovel({ id }: { id: string }) {
  const consulta = useConsulta(useCallback(() => fakeApi.getImovel(id), [id]));
  const { estado } = consulta;
  const dados = "dados" in estado ? estado.dados : undefined;

  if (dados) return <Detalhe id={id} dados={dados} />;

  if (estado.fase === "error") {
    const naoEncontrado = paraErroApi(estado.erro).tipo === "naoEncontrado";
    return (
      <>
        <PageHeader titulo="Imóvel" />
        {naoEncontrado ? (
          <ErrorState
            titulo="Imóvel não encontrado"
            descricao="O link pode estar errado ou o imóvel não existe mais."
            acao={VOLTAR}
          />
        ) : (
          <ErrorState
            titulo="Não foi possível carregar o imóvel"
            onTentarNovamente={consulta.recarregar}
            acao={VOLTAR}
          />
        )}
      </>
    );
  }
  return <PageSkeleton variante="detalhe" />;
}

function Detalhe({ id, dados }: { id: string; dados: DadosImovel }) {
  const { imovel, corretor, transicoes, contratos, leadsInteressados } = dados;
  const alvo = useMemo(() => ({ tipo: "imovel" as const, id }), [id]);
  const atividades = useConsulta(useCallback(() => fakeApi.listAtividades({ alvo }), [alvo]));
  const alteracoes = useConsulta(useCallback(() => fakeApi.listAlteracoes(alvo), [alvo]));
  const corretores = useConsulta(useCallback(() => fakeApi.listCorretores(), []));
  const autores = useMemo(
    () =>
      Object.fromEntries(
        ("dados" in corretores.estado ? (corretores.estado.dados ?? []) : []).map((c) => [c.id, c.nome]),
      ),
    [corretores.estado],
  );
  const [alvoStatus, setAlvoStatus] = useState<AlvoStatus | null>(null);
  const e = imovel.endereco;

  return (
    <>
      <DefinirTrilha rotulo={imovel.codigo} />
      <PageHeader
        titulo={imovel.titulo}
        acoes={
          <>
            <BotaoFavorito
              imovel={imovel}
              onAlternarFavorito={(i) =>
                void executarEscrita(() => fakeApi.toggleFavorito(i), {
                  sucesso: (r) => (r.favorito ? `${r.codigo} nos favoritos` : `${r.codigo} fora dos favoritos`),
                })
              }
            />
            {transicoes.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" trailingIcon={ChevronDown} className="max-md:h-11">
                    Alterar status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {transicoes.map((t) => (
                    <DropdownMenuItem
                      key={t.para}
                      tone={t.exigeMotivo ? "destructive" : "default"}
                      onSelect={() =>
                        setAlvoStatus({ imoveis: [imovel], para: t.para, exigeMotivo: t.exigeMotivo, aplicaveis: 1 })
                      }
                    >
                      Marcar como {STATUS_IMOVEL_UI[t.para].rotulo.toLowerCase()}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </>
        }
        acaoPrimaria={
          <AcaoLink href={`/imoveis/${id}/editar`} icone={Pencil}>
            Editar
          </AcaoLink>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
          <PropertyGallery
            comodos={imovel.comodos}
            tipo={imovel.tipo}
            fachada={imovel.fachada}
            titulo={imovel.titulo}
          />
          <Secao titulo="Sobre o imóvel">
            {imovel.descricao ? (
              <Text className="break-words whitespace-pre-line">{imovel.descricao}</Text>
            ) : (
              <Text tone="muted">Sem descrição.</Text>
            )}
            <FeatureChips diferenciais={imovel.diferenciais} />
          </Secao>
          <Secao titulo="Ficha técnica">
            <SpecList imovel={imovel} />
          </Secao>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Secao titulo="Resumo">
            <PrecoImovel imovel={imovel} />
            <SelosImovel imovel={imovel} />
            {imovel.motivoInativo ? (
              <Text tone="muted" size="sm">
                Motivo: {imovel.motivoInativo}
              </Text>
            ) : null}
            {transicoes.length === 0 ? (
              <Text tone="muted" size="sm">
                O status segue o contrato.
              </Text>
            ) : null}
            <Text size="sm" className="break-words">
              {TIPO_IMOVEL_ROTULO[imovel.tipo]} · {e.logradouro}, {e.numero}
              <br />
              {e.bairro}, {e.cidade}/{e.uf}
            </Text>
            {corretor ? (
              <p className="flex items-center gap-2 text-sm">
                <Avatar name={corretor.nome} size={32} />
                <span className="min-w-0 break-words">{corretor.nome}</span>
              </p>
            ) : (
              <Text tone="muted" size="sm">
                Sem corretor responsável.
              </Text>
            )}
          </Secao>

          <Secao titulo="Leads e contratos">
            {leadsInteressados > 0 ? (
              <Link
                href={`/leads?imovel=${id}`}
                className="w-fit rounded-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {leadsInteressados === 1 ? "1 lead interessado" : `${leadsInteressados} leads interessados`}
              </Link>
            ) : (
              <Text tone="muted">Nenhum lead interessado ainda.</Text>
            )}
            {contratos.length > 0 ? (
              <ul aria-label="Contratos do imóvel" className="flex flex-col gap-2">
                {contratos.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/contratos/${c.id}`}
                      className="tnum rounded-sm text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {c.numero}
                    </Link>
                    <Badge tone={STATUS_CONTRATO_UI[c.status].tom} size="sm">
                      {STATUS_CONTRATO_UI[c.status].rotulo}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </Secao>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Secao titulo="Histórico">
          <ActivityFeed
            estado={atividades.estado}
            autores={autores}
            aria-label="Histórico do imóvel"
            onTentarNovamente={atividades.recarregar}
          />
        </Secao>
        <Secao titulo="Histórico de alterações">
          <ChangeLog estado={alteracoes.estado} autores={autores} onTentarNovamente={alteracoes.recarregar} />
        </Secao>
      </div>

      <DialogoStatusImovel alvo={alvoStatus} onFechar={() => setAlvoStatus(null)} />
    </>
  );
}
