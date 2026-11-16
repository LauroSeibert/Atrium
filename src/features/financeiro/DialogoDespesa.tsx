"use client";
/**
 * Lançar ou editar despesa (RF-78). Validação com o schema do domínio (`dadosDespesaSchema`), erros inline
 * em pt-BR e resumo no topo (WCAG 3.3.1). Quem pode editar é o domínio (`podeEditar`), decidido por quem abre.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useId, useState } from "react";
import { Controller, useForm, type DefaultValues, type FieldErrors } from "react-hook-form";
import {
  achatarErros,
  AlertaServidor,
  CampoMoeda,
  FormSection,
  focarPrimeiro,
  idDoCampo,
  LARGURA_TOTAL,
  mensagemZodPtBr,
  ResumoErros,
} from "@/components/patterns/FormSection";
import { CATEGORIA_DESPESA_ROTULO } from "@/components/patterns/rotulos";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { DateInput } from "@/components/ui/DateInput";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CATEGORIAS_DESPESA, dadosDespesaSchema, type DadosDespesa } from "@/domain";
import { envioDe, useEscrita } from "@/features/dados/escrita";
import { useConsulta } from "@/features/dados/useConsulta";
import { dadosDe } from "@/lib/recurso";
import { fakeApi } from "@/mocks/services/fakeApi";
import type { LinhaDespesa } from "./tipos";

export type AlvoDespesa = { modo: "nova" } | { modo: "editar"; despesa: LinhaDespesa };

const SEM_CONTRATO = "__sem_contrato";
const ROTULO_CAMPO: Record<string, string> = {
  categoria: "Categoria",
  descricao: "Descrição",
  valor: "Valor",
  vencimento: "Vencimento",
  contratoId: "Contrato",
};

const erroDoSchema = (iss: Parameters<typeof mensagemZodPtBr>[0]) =>
  iss.path?.[0] === "vencimento" ? "Informe a data de vencimento" : mensagemZodPtBr(iss);

function valoresIniciais(alvo: AlvoDespesa): DefaultValues<DadosDespesa> {
  if (alvo.modo === "nova")
    return { descricao: "", valor: null as unknown as number, vencimento: "", contratoId: null };
  const d = alvo.despesa;
  return {
    categoria: d.categoria,
    descricao: d.descricao,
    valor: d.valor,
    vencimento: d.vencimento,
    contratoId: d.contratoId,
  };
}

function Formulario({ alvo, onFechar }: { alvo: AlvoDespesa; onFechar: () => void }) {
  const base = useId();
  const id = (caminho: string) => idDoCampo(base, caminho);
  const { estado, executar } = useEscrita();
  const { estado: contratos } = useConsulta(
    useCallback(async () => {
      const { itens } = await fakeApi.listContratos({}, { pagina: 1, porPagina: 500 });
      return itens.map((l) => ({ value: l.contrato.id, label: l.contrato.numero }));
    }, []),
  );
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<DadosDespesa>({
    resolver: zodResolver(dadosDespesaSchema, { error: erroDoSchema }),
    defaultValues: valoresIniciais(alvo),
    mode: "onTouched",
  });
  const [pedidoFoco, setPedidoFoco] = useState<{ n: number; ids: string[] }>({ n: 0, ids: [] });
  useEffect(() => {
    if (pedidoFoco.n > 0) focarPrimeiro(pedidoFoco.ids);
  }, [pedidoFoco]);

  const erros = achatarErros(errors);
  const msg = (c: string) => erros.find((e) => e.caminho === c)?.mensagem;
  const resumo =
    submitCount > 0
      ? erros.map((e) => ({ id: id(e.caminho), rotulo: ROTULO_CAMPO[e.caminho] ?? e.caminho, mensagem: e.mensagem }))
      : [];
  const envio = envioDe(estado);
  const salvando = envio.fase === "salvando";
  const editando = alvo.modo === "editar";

  async function salvar(dados: DadosDespesa) {
    const r = await executar(() => fakeApi.saveDespesa({ ...dados, id: editando ? alvo.despesa.id : undefined }), {
      sucesso: editando ? "Despesa atualizada" : "Despesa lançada",
      silenciarErro: true,
    });
    if (r.fase === "ok") onFechar();
  }

  return (
    <form
      noValidate
      aria-label="Formulário de despesa"
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        if (salvando) {
          e.preventDefault();
          return;
        }
        void handleSubmit(salvar, (invalidos: FieldErrors<DadosDespesa>) =>
          setPedidoFoco((p) => ({ n: p.n + 1, ids: achatarErros(invalidos).map((x) => id(x.caminho)) })),
        )(e);
      }}
    >
      <AlertaServidor envio={envio} />
      <ResumoErros erros={resumo} />
      <FormSection id={`${base}-dados`} titulo="Dados da despesa" className="border-0">
        <Field label="Categoria" requirement="required" id={id("categoria")} error={msg("categoria")}>
          <Controller
            control={control}
            name="categoria"
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={field.onChange}
                placeholder="Selecione a categoria"
                options={CATEGORIAS_DESPESA.map((c) => ({ value: c, label: CATEGORIA_DESPESA_ROTULO[c] }))}
              />
            )}
          />
        </Field>
        <Field label="Vencimento" requirement="required" id={id("vencimento")} error={msg("vencimento")}>
          <Controller
            control={control}
            name="vencimento"
            render={({ field }) => (
              <DateInput value={field.value ?? ""} onValueChange={field.onChange} onBlur={field.onBlur} />
            )}
          />
        </Field>
        <Field
          label="Descrição"
          requirement="required"
          id={id("descricao")}
          error={msg("descricao")}
          className={LARGURA_TOTAL}
        >
          <Input autoComplete="off" maxLength={140} {...register("descricao")} />
        </Field>
        <Field label="Valor" requirement="required" id={id("valor")} error={msg("valor")}>
          <Controller
            control={control}
            name="valor"
            render={({ field }) => (
              <CampoMoeda value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="0,00" />
            )}
          />
        </Field>
        <Field label="Contrato" requirement="optional" id={id("contratoId")} error={msg("contratoId")}>
          <Controller
            control={control}
            name="contratoId"
            render={({ field }) => (
              <Combobox
                options={[{ value: SEM_CONTRATO, label: "Sem contrato" }, ...(dadosDe(contratos) ?? [])]}
                value={field.value ?? SEM_CONTRATO}
                onValueChange={(v) => field.onChange(v === SEM_CONTRATO ? null : v)}
                placeholder="Sem contrato"
                searchPlaceholder="Buscar pelo número"
              />
            )}
          />
        </Field>
      </FormSection>
      <DialogFooter>
        <Button variant="secondary" onClick={onFechar} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" loading={salvando}>
          {editando ? "Salvar" : "Lançar despesa"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DialogoDespesa({ alvo, onFechar }: { alvo: AlvoDespesa | null; onFechar: () => void }) {
  return (
    <Dialog open={alvo !== null} onOpenChange={(aberto) => (aberto ? undefined : onFechar())}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{alvo?.modo === "editar" ? "Editar despesa" : "Nova despesa"}</DialogTitle>
          <DialogDescription className="sr-only">Categoria, descrição, valor, vencimento e contrato.</DialogDescription>
        </DialogHeader>
        {alvo ? (
          <Formulario key={alvo.modo === "editar" ? alvo.despesa.id : "nova"} alvo={alvo} onFechar={onFechar} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
