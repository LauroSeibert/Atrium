"use client";
/** Criar e editar imóvel (RF-27). O PropertyForm valida com o schema do domínio; aqui só se grava e navega. */
import { rotaDoImovel } from "@/components/layout/navegacao";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/patterns/ErrorState";
import type { EnvioFormulario } from "@/components/patterns/FormSection";
import { PropertyForm, PropertyFormSkeleton } from "@/components/patterns/PropertyForm";
import { Button } from "@/components/ui/Button";
import type { DadosImovel, Imovel } from "@/domain";
import { paraErroApi } from "@/mocks/services/erros";
import { fakeApi } from "@/mocks/services/fakeApi";
import { executarEscrita } from "@/features/dados/escrita";
import { useConsulta } from "@/features/dados/useConsulta";
import { DefinirTrilha } from "@/features/shell/trilha";

/** Só os campos que o formulário edita (o resto do imóvel é do domínio). */
function paraDados(i: Imovel): DadosImovel {
  return {
    titulo: i.titulo,
    descricao: i.descricao,
    tipo: i.tipo,
    finalidade: i.finalidade,
    preco: i.preco,
    condominio: i.condominio,
    iptu: i.iptu,
    areaUtil: i.areaUtil,
    areaTotal: i.areaTotal,
    quartos: i.quartos,
    suites: i.suites,
    banheiros: i.banheiros,
    vagas: i.vagas,
    endereco: i.endereco,
    comodos: i.comodos,
    diferenciais: i.diferenciais,
    corretorId: i.corretorId,
    fachada: i.fachada,
  };
}

/** `id` ausente = criar. */
export function TelaFormImovel({ id }: { id?: string }) {
  const router = useRouter();
  const editando = id !== undefined;
  const imovel = useConsulta(useCallback(() => (id ? fakeApi.getImovel(id) : Promise.resolve(null)), [id]));
  const corretores = useConsulta(useCallback(() => fakeApi.listCorretores(), []));
  const [envio, setEnvio] = useState<EnvioFormulario>({ fase: "idle" });

  const atual = "dados" in imovel.estado ? imovel.estado.dados?.imovel : undefined;
  const destinoCancelar = editando ? (atual ? rotaDoImovel(atual) : `/imoveis/${id}`) : "/imoveis";
  const voltar = (
    <Button asChild variant="secondary">
      <Link href="/imoveis">Voltar para imóveis</Link>
    </Button>
  );

  async function salvar(dados: DadosImovel) {
    setEnvio({ fase: "salvando" });
    const r = await executarEscrita(() => fakeApi.saveImovel(editando ? { ...dados, id: atual?.id ?? id } : dados), {
      sucesso: editando ? "Imóvel salvo" : "Imóvel criado",
      silenciarErro: true,
    });
    if (r.fase === "ok") {
      setEnvio({ fase: "salvo" });
      router.push(rotaDoImovel(r.resultado));
    } else {
      setEnvio({ fase: "erro", mensagem: r.erro.message });
    }
  }

  const titulo = editando ? "Editar imóvel" : "Novo imóvel";
  const temDados = "dados" in imovel.estado;
  const dadosImovel = "dados" in imovel.estado ? (imovel.estado.dados ?? undefined) : undefined;
  const listaCorretores = "dados" in corretores.estado ? corretores.estado.dados : undefined;

  let corpo;
  if (imovel.estado.fase === "error" && !dadosImovel) {
    const naoEncontrado = paraErroApi(imovel.estado.erro).tipo === "naoEncontrado";
    corpo = naoEncontrado ? (
      <ErrorState
        titulo="Imóvel não encontrado"
        descricao="O link pode estar errado ou o imóvel não existe mais."
        acao={voltar}
      />
    ) : (
      <ErrorState titulo="Não foi possível carregar o imóvel" onTentarNovamente={imovel.recarregar} acao={voltar} />
    );
  } else if (corretores.estado.fase === "error" && !listaCorretores) {
    corpo = <ErrorState titulo="Não foi possível carregar os corretores" onTentarNovamente={corretores.recarregar} />;
  } else if (!temDados || !listaCorretores) {
    corpo = <PropertyFormSkeleton />;
  }
  corpo ??= (
    <PropertyForm
      valoresIniciais={dadosImovel ? paraDados(dadosImovel.imovel) : undefined}
      corretores={(listaCorretores ?? []).map((c) => ({ id: c.id, nome: c.nome }))}
      onSalvar={(d) => void salvar(d)}
      envio={envio}
      onCancelar={() => router.push(destinoCancelar)}
    />
  );

  return (
    <>
      {dadosImovel ? <DefinirTrilha rotulo={dadosImovel.imovel.codigo} /> : null}
      <PageHeader titulo={titulo} />
      {corpo}
    </>
  );
}
