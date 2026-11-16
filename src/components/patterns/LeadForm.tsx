"use client";

/**
 * Formulário de lead (RF-35 criação rápida + edição). Valida com `novoLeadSchema` (domínio);
 * telefone com máscara guarda só dígitos; interesse e orçamento ficam em "Mais detalhes".
 * Com `imoveis`, oferece o imóvel (opcional) da 1ª negociação (RF-70, RF-72).
 */
import { useEffect, useId, useState } from "react";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FINALIDADES, novoLeadSchema, ORIGENS, TIPOS_IMOVEL, type NovoLead } from "@/domain";
import { formatTelefone } from "@/lib/format";
import { Checkbox } from "../ui/Checkbox";
import { Combobox, type ComboboxOption } from "../ui/Combobox";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import {
  achatarErros,
  AlertaServidor,
  CampoChips,
  CampoMascara,
  CampoMoeda,
  CampoNumero,
  focarPrimeiro,
  FormSection,
  idDoCampo,
  LARGURA_TOTAL,
  mensagemZodPtBr,
  Recolhivel,
  ResumoErros,
  RodapeEnvio,
  FormSectionSkeleton,
  RodapeEnvioSkeleton,
  type EnvioFormulario,
} from "./FormSection";
import { FINALIDADE_ROTULO, ORIGEM_ROTULO, TIPO_IMOVEL_ROTULO } from "./rotulos";

export type ResponsavelOpcao = { id: string; nome: string };

export type LeadFormProps = {
  valoresIniciais?: NovoLead;
  corretores: ResponsavelOpcao[];
  /** Opções do campo "Imóvel de interesse" (criação). Ausente = campo não aparece. */
  imoveis?: ComboboxOption[];
  onSalvar: (dados: NovoLead) => void;
  envio: EnvioFormulario;
  onCancelar?: () => void;
};

const ROTULO_CAMPO: Record<string, string> = {
  nome: "Nome",
  "contato.telefone": "Telefone",
  "contato.email": "E-mail",
  origem: "Origem",
  responsavelId: "Responsável",
  imovelId: "Imóvel de interesse",
  orcamento: "Orçamento",
  "interesse.finalidade": "Finalidade do interesse",
  "interesse.tipos": "Tipos de imóvel",
  "interesse.bairros": "Bairros",
  "interesse.quartosMin": "Quartos (mínimo)",
};

/** Máscara progressiva; com 10+ dígitos usa `formatTelefone`. */
function mascararTelefone(d: string): string {
  if (d.length >= 10) return formatTelefone(d);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length > 6 ? 6 : undefined)}${d.length > 6 ? `-${d.slice(6)}` : ""}`;
}

type Interesse = NonNullable<NovoLead["interesse"]>;

/** Valor da opção "sem imóvel" no Combobox (vira `imovelId` ausente). */
const SEM_IMOVEL = "__sem_imovel";

export function LeadForm({ valoresIniciais, corretores, imoveis, onSalvar, envio, onCancelar }: LeadFormProps) {
  const base = useId();
  const id = (caminho: string) => idDoCampo(base, caminho);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<NovoLead>({
    resolver: zodResolver(novoLeadSchema, { error: mensagemZodPtBr }),
    defaultValues: valoresIniciais ?? { nome: "", contato: {}, orcamento: null },
    mode: "onTouched",
  });
  const [detalhesAbertos, setDetalhesAbertos] = useState(
    Boolean(valoresIniciais?.interesse) || Boolean(valoresIniciais?.orcamento),
  );
  const [pedidoFoco, setPedidoFoco] = useState<{ n: number; ids: string[] }>({ n: 0, ids: [] });
  useEffect(() => {
    if (pedidoFoco.n > 0) focarPrimeiro(pedidoFoco.ids);
  }, [pedidoFoco]);

  const erros = achatarErros(errors);
  const resumo =
    submitCount > 0
      ? erros.map((e) => ({ id: id(e.caminho), rotulo: ROTULO_CAMPO[e.caminho] ?? e.caminho, mensagem: e.mensagem }))
      : [];
  const msg = (caminho: string) => erros.find((e) => e.caminho === caminho)?.mensagem;
  const salvando = envio.fase === "salvando";

  return (
    <form
      noValidate
      aria-label="Formulário de lead"
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        if (salvando) {
          e.preventDefault();
          return;
        }
        void handleSubmit(onSalvar, (invalidos: FieldErrors<NovoLead>) => {
          const lista = achatarErros(invalidos);
          if (lista.some((x) => x.caminho.startsWith("interesse") || x.caminho === "orcamento"))
            setDetalhesAbertos(true);
          setPedidoFoco((p) => ({ n: p.n + 1, ids: lista.map((x) => id(x.caminho)) }));
        })(e);
      }}
    >
      <AlertaServidor envio={envio} />
      <ResumoErros erros={resumo} />

      <FormSection id="lead-contato" titulo="Dados do lead" descricao="O mínimo para registrar o contato.">
        <Field label="Nome" requirement="required" id={id("nome")} error={msg("nome")} className={LARGURA_TOTAL}>
          <Input autoComplete="name" {...register("nome")} />
        </Field>
        <Field label="Telefone" requirement="optional" id={id("contato.telefone")} error={msg("contato.telefone")}>
          <Controller
            control={control}
            name="contato.telefone"
            render={({ field }) => (
              <CampoMascara
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                digitos={field.value ?? ""}
                onChange={(d) => field.onChange(d === "" ? undefined : d)}
                onBlur={field.onBlur}
                mascarar={mascararTelefone}
                maxDigitos={11}
                placeholder="(11) 91234-5678"
              />
            )}
          />
        </Field>
        <Field label="E-mail" requirement="optional" id={id("contato.email")} error={msg("contato.email")}>
          <Controller
            control={control}
            name="contato.email"
            render={({ field }) => (
              <Input
                type="email"
                autoComplete="email"
                name={field.name}
                value={field.value ?? ""}
                onBlur={field.onBlur}
                onChange={(e) => field.onChange(e.target.value.trim() === "" ? undefined : e.target.value)}
              />
            )}
          />
        </Field>
        <Field label="Origem" requirement="required" id={id("origem")} error={msg("origem")}>
          <Controller
            control={control}
            name="origem"
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={field.onChange}
                placeholder="Selecione a origem"
                options={ORIGENS.map((o) => ({ value: o, label: ORIGEM_ROTULO[o] }))}
              />
            )}
          />
        </Field>
        <Field label="Responsável" requirement="required" id={id("responsavelId")} error={msg("responsavelId")}>
          <Controller
            control={control}
            name="responsavelId"
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={field.onChange}
                placeholder="Selecione o responsável"
                options={corretores.map((c) => ({ value: c.id, label: c.nome }))}
              />
            )}
          />
        </Field>
        {imoveis ? (
          <Field
            label="Imóvel de interesse"
            requirement="optional"
            id={id("imovelId")}
            error={msg("imovelId")}
            className={LARGURA_TOTAL}
          >
            <Controller
              control={control}
              name="imovelId"
              render={({ field }) => (
                <Combobox
                  options={[{ value: SEM_IMOVEL, label: "Sem imóvel (definir depois)" }, ...imoveis]}
                  value={field.value ?? SEM_IMOVEL}
                  onValueChange={(v) => field.onChange(v === SEM_IMOVEL || v === "" ? undefined : v)}
                  placeholder="Selecione o imóvel"
                  searchPlaceholder="Buscar por código ou título"
                />
              )}
            />
          </Field>
        ) : null}

        <Recolhivel titulo="Mais detalhes" aberto={detalhesAbertos} onAbertoChange={setDetalhesAbertos}>
          <Field
            label="Orçamento"
            requirement="optional"
            id={id("orcamento")}
            error={msg("orcamento")}
            className={LARGURA_TOTAL}
          >
            <Controller
              control={control}
              name="orcamento"
              render={({ field }) => (
                <CampoMoeda value={field.value} vazio={null} onChange={field.onChange} onBlur={field.onBlur} />
              )}
            />
          </Field>
          <Controller
            control={control}
            name="interesse"
            render={({ field }) => <BlocoInteresse valor={field.value} onChange={field.onChange} id={id} msg={msg} />}
          />
        </Recolhivel>
      </FormSection>

      <RodapeEnvio envio={envio} onCancelar={onCancelar} rotuloSalvar="Salvar lead" />
    </form>
  );
}

function BlocoInteresse({
  valor,
  onChange,
  id,
  msg,
}: {
  valor: NovoLead["interesse"];
  onChange: (v: NovoLead["interesse"]) => void;
  id: (caminho: string) => string;
  msg: (caminho: string) => string | undefined;
}) {
  const atualizar = (parte: Partial<Interesse>) => {
    const novo = { tipos: [], bairros: [], ...valor, ...parte } as Interesse;
    const vazio = !novo.finalidade && novo.tipos.length === 0 && novo.bairros.length === 0 && !novo.quartosMin;
    // Sem nenhum dado de interesse, o objeto some (o schema trata `interesse` como opcional).
    onChange(vazio ? undefined : novo);
  };
  const tipos = valor?.tipos ?? [];
  return (
    <>
      <Field
        label="Finalidade do interesse"
        requirement="optional"
        id={id("interesse.finalidade")}
        error={msg("interesse.finalidade")}
      >
        <Select
          value={valor?.finalidade ?? ""}
          onValueChange={(v) => atualizar({ finalidade: v as Interesse["finalidade"] })}
          placeholder="Selecione"
          options={FINALIDADES.map((f) => ({ value: f, label: FINALIDADE_ROTULO[f] }))}
        />
      </Field>
      <Field
        label="Quartos (mínimo)"
        requirement="optional"
        id={id("interesse.quartosMin")}
        error={msg("interesse.quartosMin")}
      >
        <CampoNumero
          value={valor?.quartosMin}
          vazio={undefined}
          onChange={(v) => atualizar({ quartosMin: v as number | undefined })}
        />
      </Field>
      <fieldset className={`flex flex-col gap-2 ${LARGURA_TOTAL}`}>
        <legend className="mb-2 text-sm font-medium text-text">Tipos de imóvel</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {TIPOS_IMOVEL.map((t) => (
            <Checkbox
              key={t}
              label={TIPO_IMOVEL_ROTULO[t]}
              checked={tipos.includes(t)}
              onCheckedChange={(c) => atualizar({ tipos: c === true ? [...tipos, t] : tipos.filter((x) => x !== t) })}
            />
          ))}
        </div>
      </fieldset>
      <Field
        label="Bairros de interesse"
        requirement="optional"
        description="Digite e pressione Enter para adicionar."
        id={id("interesse.bairros")}
        error={msg("interesse.bairros")}
        className={LARGURA_TOTAL}
      >
        <CampoChips
          value={valor?.bairros ?? []}
          onChange={(bairros) => atualizar({ bairros })}
          rotuloAdicionar="Adicionar bairro"
          placeholder="Ex.: Pinheiros"
        />
      </Field>
    </>
  );
}

/** Esqueleto do formulário de lead, com a forma final (seção de contato + rodapé). */
export function LeadFormSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Carregando formulário…</span>
      <FormSectionSkeleton campos={5} />
      <RodapeEnvioSkeleton />
    </div>
  );
}
