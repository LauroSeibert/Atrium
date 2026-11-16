"use client";
/**
 * Detalhe do imóvel (RF-24…26, RF-29, RF-65). Contêiner: dados do fakeApi; as trocas de status
 * oferecidas são exatamente as `transicoes` que o domínio devolveu em `getImovel`.
 */
import { rotaDoImovel } from "@/components/layout/navegacao";
import Link from "next/link";
import { ChevronDown, Pencil } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActivityFeed } from "@/components/patterns/ActivityFeed";
import { ChangeLog } from "@/components/patterns/ChangeLog";
import { ErrorState } from "@/components/patterns/ErrorState";
import { FeatureChips } from "@/components/patterns/FeatureChips";
import { BotaoFavorito, PrecoImovel, SelosImovel } from "@/components/patterns/PropertyCard";
import { PropertyGallery } from "@/components/patterns/PropertyGallery";
import { SectionCard } from "@/components/patterns/SectionCard";
import { SpecList } from "@/components/patterns/SpecList";
import { ETAPA_UI, STATUS_CONTRATO_UI, STATUS_IMOVEL_UI, TIPO_IMOVEL_ROTULO } from "@/components/patterns/rotulos";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Typography";
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

function CarregandoImovel() {
  return (
    <>
      <PageHeader titulo="Imóvel" />
      <div
        role="status"
        aria-busy="true"
        aria-label="Carregando imóvel"
        className="grid grid-cols-1 gap-6 xl:grid-cols-3"
      >
        <Skeleton shape="rect" className="aspect-4/3 h-auto rounded-lg xl:col-span-2" />
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}

export function TelaImovel({ id }: { id: string }) {
  const consulta = useConsulta(useCallback(() => fakeApi.getImovel(id), [id]));
  const { estado } = consulta;
  const dados = "dados" in estado ? estado.dados : undefined;

  // Link antigo pelo id interno (ex.: notificação): troca a URL pelo código visível, sem nova entrada no histórico.
  const router = useRouter();
  const codigo = dados?.imovel.codigo;
  useEffect(() => {
    if (codigo && id !== codigo) router.replace(rotaDoImovel({ codigo }), { scroll: false });
  }, [codigo, id, router]);

  if (dados) return <Detalhe id={dados.imovel.id} dados={dados} />;

  if (estado.fase === "error") {
    const naoEncontrado = paraErroApi(estado.erro).tipo === "naoEncontrado";
    return (
      <>
        <PageHeader titulo="Imóvel" />
        {naoEncontrado ? (
          <ErrorState titulo="Imóvel não encontrado" acao={VOLTAR} />
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
  return <CarregandoImovel />;
}

function Detalhe({ id, dados }: { id: string; dados: DadosImovel }) {
  const { imovel, corretor, transicoes, contratos, negociacoes } = dados;
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
          <AcaoLink href={`${rotaDoImovel(dados.imovel)}/editar`} icone={Pencil}>
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
          <SectionCard titulo="Sobre o imóvel">
            {imovel.descricao ? <Text className="break-words whitespace-pre-line">{imovel.descricao}</Text> : null}
            <FeatureChips diferenciais={imovel.diferenciais} />
          </SectionCard>
          <SectionCard titulo="Ficha técnica">
            <SpecList imovel={imovel} />
          </SectionCard>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard titulo="Resumo">
            <PrecoImovel imovel={imovel} />
            <SelosImovel imovel={imovel} />
            {imovel.motivoInativo ? (
              <Text tone="muted" size="sm">
                Motivo: {imovel.motivoInativo}
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
            ) : null}
          </SectionCard>

          <SectionCard titulo="Negociações e contratos">
            {/* RF-29, RF-72: negociações deste imóvel (lead, etapa, responsável). */}
            {negociacoes.length > 0 ? (
              <>
                <ul aria-label="Negociações do imóvel" className="flex flex-col gap-2">
                  {negociacoes.map((n) => (
                    <li key={n.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex min-w-0 flex-col">
                        {n.lead ? (
                          <Button asChild variant="link" className="w-fit text-left text-sm whitespace-normal">
                            <Link href={`/leads/${n.lead.id}`}>{n.lead.nome}</Link>
                          </Button>
                        ) : (
                          <Text tone="muted">Lead removido</Text>
                        )}
                        <span className="text-xs text-text-muted">{n.responsavel.nome ?? "Sem responsável"}</span>
                      </span>
                      <Badge tone={ETAPA_UI[n.etapa].tom} size="sm">
                        {ETAPA_UI[n.etapa].rotulo}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="link" className="w-fit">
                  <Link href={`/leads?imovel=${id}`}>Ver no quadro de leads</Link>
                </Button>
              </>
            ) : (
              <Text tone="muted">Nenhuma negociação</Text>
            )}
            {contratos.length > 0 ? (
              <ul aria-label="Contratos do imóvel" className="flex flex-col gap-2">
                {contratos.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <Button asChild variant="link" className="tnum text-sm">
                      <Link href={`/contratos/${c.id}`}>{c.numero}</Link>
                    </Button>
                    <Badge tone={STATUS_CONTRATO_UI[c.status].tom} size="sm">
                      {STATUS_CONTRATO_UI[c.status].rotulo}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </SectionCard>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard titulo="Histórico">
          <ActivityFeed
            estado={atividades.estado}
            autores={autores}
            aria-label="Histórico do imóvel"
            onTentarNovamente={atividades.recarregar}
          />
        </SectionCard>
        <SectionCard titulo="Histórico de alterações">
          <ChangeLog estado={alteracoes.estado} autores={autores} onTentarNovamente={alteracoes.recarregar} />
        </SectionCard>
      </div>

      <DialogoStatusImovel alvo={alvoStatus} onFechar={() => setAlvoStatus(null)} />
    </>
  );
}
