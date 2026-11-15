"use client";

/**
 * Formulário de imóvel multi-seção (RF-27). As regras vêm de `dadosImovelSchema` (domínio); o componente
 * só apresenta os erros que o schema devolve, em pt-BR. Estado de envio chega por prop (união discriminada).
 */
import { useEffect, useId, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch, type Control, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import {
  dadosImovelSchema,
  FACHADAS,
  FINALIDADES,
  TIPOS_COMODO,
  TIPOS_IMOVEL,
  UFS,
  type DadosImovel,
  type Fachada,
  type TipoComodo,
} from "@/domain";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Skeleton } from "../ui/Skeleton";
import { Textarea } from "../ui/Textarea";
import { Text } from "../ui/Typography";
import { PropertyImage } from "./PropertyImage";
import {
  achatarErros,
  AlertaServidor,
  CampoChips,
  CampoMascara,
  CampoMoeda,
  CampoNumero,
  focarPrimeiro,
  FormSection,
  FormSectionIndex,
  idDoCampo,
  LARGURA_TOTAL,
  mensagemZodPtBr,
  ResumoErros,
  RodapeEnvio,
  FormSectionSkeleton,
  RodapeEnvioSkeleton,
  type EnvioFormulario,
} from "./FormSection";
import { COMODO_ROTULO, FINALIDADE_ROTULO, TIPO_IMOVEL_ROTULO } from "./rotulos";

export type CorretorOpcao = { id: string; nome: string };

export type PropertyFormProps = {
  valoresIniciais?: DadosImovel;
  corretores: CorretorOpcao[];
  onSalvar: (dados: DadosImovel) => void;
  envio: EnvioFormulario;
  onCancelar?: () => void;
};

const FACHADA_ROTULO: Record<Fachada, string> = {
  terrea: "Térrea",
  sobrado: "Sobrado",
  moderna: "Moderna",
  predio: "Prédio",
  cobertura: "Cobertura",
  campo: "Campo",
  comercial: "Comercial",
  terreno: "Terreno",
};

const SECOES = [
  { id: "basico", titulo: "Básico" },
  { id: "valores", titulo: "Valores" },
  { id: "caracteristicas", titulo: "Características" },
  { id: "endereco", titulo: "Endereço" },
  { id: "comodos", titulo: "Cômodos" },
  { id: "diferenciais", titulo: "Diferenciais" },
  { id: "corretor", titulo: "Corretor e fachada" },
];

const ROTULO_CAMPO: Record<string, string> = {
  titulo: "Título",
  descricao: "Descrição",
  tipo: "Tipo de imóvel",
  finalidade: "Finalidade",
  preco: "Preço",
  condominio: "Condomínio",
  iptu: "IPTU",
  areaUtil: "Área útil",
  areaTotal: "Área total",
  quartos: "Quartos",
  suites: "Suítes",
  banheiros: "Banheiros",
  vagas: "Vagas",
  "endereco.logradouro": "Logradouro",
  "endereco.numero": "Número",
  "endereco.bairro": "Bairro",
  "endereco.cidade": "Cidade",
  "endereco.uf": "UF",
  "endereco.cep": "CEP",
  comodos: "Cômodos",
  diferenciais: "Diferenciais",
  corretorId: "Corretor",
  fachada: "Fachada",
};

function rotuloDoCaminho(caminho: string): string {
  const m = /^comodos\.(\d+)\.(nome|area)$/.exec(caminho);
  if (m) return `${m[2] === "nome" ? "Nome" : "Área"} do cômodo ${Number(m[1]) + 1}`;
  return ROTULO_CAMPO[caminho] ?? caminho;
}

const VAZIO: Partial<DadosImovel> = {
  titulo: "",
  descricao: "",
  condominio: null,
  iptu: null,
  quartos: 0,
  suites: 0,
  banheiros: 0,
  vagas: 0,
  endereco: { logradouro: "", numero: "", bairro: "", cidade: "", uf: undefined, cep: "" } as never,
  comodos: [],
  diferenciais: [],
  fachada: null,
};

const mascaraCep = (d: string) => (d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d);

type CampoNumeroNome = "areaUtil" | "areaTotal" | "quartos" | "suites" | "banheiros" | "vagas";
type CampoMoedaNome = "preco" | "condominio" | "iptu";

export function PropertyForm({ valoresIniciais, corretores, onSalvar, envio, onCancelar }: PropertyFormProps) {
  const base = useId();
  const id = (caminho: string) => idDoCampo(base, caminho);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<DadosImovel>({
    resolver: zodResolver(dadosImovelSchema, { error: mensagemZodPtBr }),
    defaultValues: valoresIniciais ?? VAZIO,
    mode: "onTouched",
  });
  const [pedidoFoco, setPedidoFoco] = useState<{ n: number; ids: string[] }>({ n: 0, ids: [] });
  useEffect(() => {
    if (pedidoFoco.n > 0) focarPrimeiro(pedidoFoco.ids);
  }, [pedidoFoco]);

  const erros = achatarErros(errors);
  const resumo =
    submitCount > 0
      ? erros.map((e) => ({ id: id(e.caminho), rotulo: rotuloDoCaminho(e.caminho), mensagem: e.mensagem }))
      : [];
  const msg = (caminho: string) => erros.find((e) => e.caminho === caminho)?.mensagem;
  const salvando = envio.fase === "salvando";

  const numero = (nome: CampoNumeroNome, rotulo: string, opts: { suffix?: string; obrigatorio?: boolean } = {}) => (
    <Field label={rotulo} requirement={opts.obrigatorio ? "required" : undefined} id={id(nome)} error={msg(nome)}>
      <Controller
        control={control}
        name={nome}
        render={({ field }) => (
          <CampoNumero value={field.value} onChange={field.onChange} onBlur={field.onBlur} suffix={opts.suffix} />
        )}
      />
    </Field>
  );

  const moeda = (nome: CampoMoedaNome, rotulo: string, opts: { obrigatorio?: boolean; ajuda?: string } = {}) => (
    <Field
      label={rotulo}
      requirement={opts.obrigatorio ? "required" : "optional"}
      description={opts.ajuda}
      id={id(nome)}
      error={msg(nome)}
    >
      <Controller
        control={control}
        name={nome}
        render={({ field }) => <CampoMoeda value={field.value} onChange={field.onChange} onBlur={field.onBlur} />}
      />
    </Field>
  );

  return (
    <form
      noValidate
      aria-label="Formulário de imóvel"
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        if (salvando) {
          e.preventDefault();
          return;
        }
        void handleSubmit(onSalvar, (invalidos: FieldErrors<DadosImovel>) =>
          setPedidoFoco((p) => ({ n: p.n + 1, ids: achatarErros(invalidos).map((x) => id(x.caminho)) })),
        )(e);
      }}
    >
      <AlertaServidor envio={envio} />
      <ResumoErros erros={resumo} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <FormSectionIndex secoes={SECOES} className="lg:sticky lg:top-4 lg:w-56 lg:shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <FormSection id="basico" titulo="Básico" descricao="Como o imóvel aparece nos anúncios.">
            <Field
              label="Título"
              requirement="required"
              id={id("titulo")}
              error={msg("titulo")}
              className={LARGURA_TOTAL}
            >
              <Input autoComplete="off" {...register("titulo")} />
            </Field>
            <Field
              label="Descrição"
              requirement="optional"
              id={id("descricao")}
              error={msg("descricao")}
              className={LARGURA_TOTAL}
            >
              <Textarea rows={4} {...register("descricao")} />
            </Field>
            <Field label="Tipo de imóvel" requirement="required" id={id("tipo")} error={msg("tipo")}>
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder="Selecione o tipo"
                    options={TIPOS_IMOVEL.map((t) => ({ value: t, label: TIPO_IMOVEL_ROTULO[t] }))}
                  />
                )}
              />
            </Field>
            <Field label="Finalidade" requirement="required" id={id("finalidade")} error={msg("finalidade")}>
              <Controller
                control={control}
                name="finalidade"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder="Selecione a finalidade"
                    options={FINALIDADES.map((f) => ({ value: f, label: FINALIDADE_ROTULO[f] }))}
                  />
                )}
              />
            </Field>
          </FormSection>

          <FormSection id="valores" titulo="Valores" descricao="Informe em reais; o sistema guarda em centavos.">
            {moeda("preco", "Preço", { obrigatorio: true })}
            {moeda("condominio", "Condomínio (mensal)")}
            {moeda("iptu", "IPTU (mensal)")}
          </FormSection>

          <FormSection id="caracteristicas" titulo="Características">
            {numero("areaUtil", "Área útil", { suffix: "m²", obrigatorio: true })}
            {numero("areaTotal", "Área total", { suffix: "m²", obrigatorio: true })}
            {numero("quartos", "Quartos", { obrigatorio: true })}
            {numero("suites", "Suítes", { obrigatorio: true })}
            {numero("banheiros", "Banheiros", { obrigatorio: true })}
            {numero("vagas", "Vagas de garagem", { obrigatorio: true })}
          </FormSection>

          <FormSection id="endereco" titulo="Endereço">
            <Field
              label="Logradouro"
              requirement="required"
              id={id("endereco.logradouro")}
              error={msg("endereco.logradouro")}
              className={LARGURA_TOTAL}
            >
              <Input autoComplete="street-address" {...register("endereco.logradouro")} />
            </Field>
            <Field label="Número" requirement="required" id={id("endereco.numero")} error={msg("endereco.numero")}>
              <Input autoComplete="off" {...register("endereco.numero")} />
            </Field>
            <Field label="Bairro" requirement="required" id={id("endereco.bairro")} error={msg("endereco.bairro")}>
              <Input autoComplete="off" {...register("endereco.bairro")} />
            </Field>
            <Field label="Cidade" requirement="required" id={id("endereco.cidade")} error={msg("endereco.cidade")}>
              <Input autoComplete="address-level2" {...register("endereco.cidade")} />
            </Field>
            <Field label="UF" requirement="required" id={id("endereco.uf")} error={msg("endereco.uf")}>
              <Controller
                control={control}
                name="endereco.uf"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder="UF"
                    options={UFS.map((u) => ({ value: u, label: u }))}
                  />
                )}
              />
            </Field>
            <Field label="CEP" requirement="required" id={id("endereco.cep")} error={msg("endereco.cep")}>
              <Controller
                control={control}
                name="endereco.cep"
                render={({ field }) => (
                  <CampoMascara
                    digitos={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    mascarar={mascaraCep}
                    maxDigitos={8}
                    placeholder="00000-000"
                    autoComplete="postal-code"
                  />
                )}
              />
            </Field>
          </FormSection>

          <FormSection
            id="comodos"
            titulo="Cômodos"
            descricao="Escolha o tipo e ajuste o nome e a área. A ilustração vem do tipo."
          >
            <Comodos control={control} idCampo={id} erro={msg("comodos")} msg={msg} />
          </FormSection>

          <FormSection id="diferenciais" titulo="Diferenciais" descricao="Destaques que aparecem como etiquetas.">
            <Field
              label="Diferenciais"
              description="Digite e pressione Enter para adicionar."
              id={id("diferenciais")}
              error={msg("diferenciais")}
              className={LARGURA_TOTAL}
            >
              <Controller
                control={control}
                name="diferenciais"
                render={({ field }) => (
                  <CampoChips
                    value={field.value ?? []}
                    onChange={field.onChange}
                    rotuloAdicionar="Adicionar diferencial"
                    placeholder="Ex.: Piscina, Varanda gourmet"
                  />
                )}
              />
            </Field>
          </FormSection>

          <FormSection id="corretor" titulo="Corretor e fachada">
            <div className="flex flex-col gap-4">
              <Field
                label="Corretor responsável"
                requirement="required"
                id={id("corretorId")}
                error={msg("corretorId")}
              >
                <Controller
                  control={control}
                  name="corretorId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      placeholder="Selecione o corretor"
                      options={corretores.map((c) => ({ value: c.id, label: c.nome }))}
                    />
                  )}
                />
              </Field>
              <Field label="Fachada" requirement="optional" id={id("fachada")} error={msg("fachada")}>
                <Controller
                  control={control}
                  name="fachada"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "nenhuma"}
                      onValueChange={(v) => field.onChange(v === "nenhuma" ? null : v)}
                      options={[
                        { value: "nenhuma", label: "Sem ilustração" },
                        ...FACHADAS.map((f) => ({ value: f, label: FACHADA_ROTULO[f] })),
                      ]}
                    />
                  )}
                />
              </Field>
            </div>
            <PreviaFachada control={control} />
          </FormSection>
        </div>
      </div>

      <RodapeEnvio envio={envio} onCancelar={onCancelar} rotuloSalvar="Salvar imóvel" />
    </form>
  );
}

function PreviaFachada({ control }: { control: Control<DadosImovel> }) {
  const tipo = useWatch({ control, name: "tipo" });
  const fachada = useWatch({ control, name: "fachada" });
  return (
    <div className="flex flex-col gap-2">
      <Text tone="muted" size="sm">
        Prévia
      </Text>
      <PropertyImage
        tipo={tipo ?? "casa"}
        fachada={fachada ?? null}
        titulo="Prévia da ilustração da fachada"
        className="max-w-72"
      />
    </div>
  );
}

function Comodos({
  control,
  idCampo,
  erro,
  msg,
}: {
  control: Control<DadosImovel>;
  idCampo: (caminho: string) => string;
  erro?: string;
  msg: (caminho: string) => string | undefined;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "comodos" });
  return (
    <div className="flex flex-col gap-4 md:col-span-2">
      <Field label="Adicionar cômodo" id={idCampo("comodos")} error={erro} className="md:max-w-sm">
        <Select
          value=""
          placeholder="Escolha o tipo de cômodo"
          onValueChange={(tipo) =>
            append({ tipo: tipo as TipoComodo, nome: COMODO_ROTULO[tipo as TipoComodo], area: null })
          }
          options={TIPOS_COMODO.map((t) => ({ value: t, label: COMODO_ROTULO[t] }))}
        />
      </Field>
      {fields.length === 0 ? (
        <Text tone="muted" size="sm">
          Nenhum cômodo adicionado.
        </Text>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Cômodos do imóvel">
          {fields.map((f, i) => (
            <li key={f.id} className="flex items-start gap-3 rounded-md border border-border p-3">
              <PropertyImage tipo="casa" comodo={f.tipo} decorativa className="w-20 shrink-0 max-sm:hidden" />
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label={`Nome do cômodo ${i + 1}`}
                  description={COMODO_ROTULO[f.tipo]}
                  id={idCampo(`comodos.${i}.nome`)}
                  error={msg(`comodos.${i}.nome`)}
                >
                  <Controller
                    control={control}
                    name={`comodos.${i}.nome`}
                    render={({ field }) => (
                      <Input
                        autoComplete="off"
                        name={field.name}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </Field>
                <Field
                  label={`Área do cômodo ${i + 1}`}
                  requirement="optional"
                  id={idCampo(`comodos.${i}.area`)}
                  error={msg(`comodos.${i}.area`)}
                >
                  <Controller
                    control={control}
                    name={`comodos.${i}.area`}
                    render={({ field }) => (
                      <CampoNumero
                        value={field.value}
                        vazio={null}
                        suffix="m²"
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </Field>
              </div>
              <Button
                variant="ghost"
                icon={Trash2}
                aria-label={`Remover cômodo ${i + 1} (${COMODO_ROTULO[f.tipo]})`}
                onClick={() => remove(i)}
                className="max-md:size-11"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Esqueleto do formulário de imóvel, com a forma final (índice + seções + rodapé). */
export function PropertyFormSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Carregando formulário…</span>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-wrap gap-2 lg:w-56 lg:shrink-0 lg:flex-col lg:gap-1">
          {SECOES.map((s) => (
            <Skeleton key={s.id} shape="rect" className="h-10 w-24 lg:w-full" />
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <FormSectionSkeleton campos={6} />
          <FormSectionSkeleton campos={3} />
          <FormSectionSkeleton campos={6} />
          <FormSectionSkeleton campos={6} />
        </div>
      </div>
      <RodapeEnvioSkeleton />
    </div>
  );
}
