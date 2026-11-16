"use client";
/**
 * Criar e editar contato (RF-74) em diálogo. Validação inline pelo schema do domínio; vínculos com
 * imóveis e contratos escolhidos em Combobox. Salvar vai por `fakeApi.saveContato` (domínio confere os vínculos).
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  achatarErros,
  AlertaServidor,
  CampoMascara,
  idDoCampo,
  mensagemZodPtBr,
  focarPrimeiro,
} from "@/components/patterns/FormSection";
import { PAPEL_CONTATO_ROTULO } from "@/components/patterns/rotulos";
import { Tag } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
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
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { PAPEIS_CONTATO, dadosContatoSchema, type Contato, type DadosContato } from "@/domain";
import { envioDe, useEscrita } from "@/features/dados/escrita";
import { useConsulta } from "@/features/dados/useConsulta";
import { formatTelefone } from "@/lib/format";
import { fakeApi } from "@/mocks/services/fakeApi";

type Props = { aberto: boolean; contato: Contato | null; onAbertoChange: (aberto: boolean) => void };

const BASE = "contato";
const vazioParaUndefined = (v: string) => v.trim() || undefined;

const VAZIO: DadosContato = {
  nome: "",
  papel: "proprietario",
  telefone: undefined,
  email: undefined,
  observacao: undefined,
  imovelIds: [],
  contratoIds: [],
};

export function DialogoContato({ aberto, contato, onAbertoChange }: Props) {
  // O formulário remonta a cada abertura/contato: estado limpo sem efeitos de reset.
  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent size="md">
        {aberto ? <Formulario key={contato?.id ?? "novo"} contato={contato} onAbertoChange={onAbertoChange} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({ contato, onAbertoChange }: Omit<Props, "aberto">) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DadosContato>({
    resolver: zodResolver(dadosContatoSchema, { error: mensagemZodPtBr }),
    defaultValues: contato
      ? {
          nome: contato.nome,
          papel: contato.papel,
          telefone: contato.telefone,
          email: contato.email,
          observacao: contato.observacao,
          imovelIds: contato.imovelIds,
          contratoIds: contato.contratoIds,
        }
      : VAZIO,
    mode: "onTouched",
  });
  const { estado: envioEscrita, executar } = useEscrita();

  const { estado: opcoes, recarregar } = useConsulta(
    useCallback(async () => {
      const [imoveis, contratos] = await Promise.all([
        fakeApi.listImoveis({}, { pagina: 1, porPagina: 500 }),
        fakeApi.listContratos({}, { pagina: 1, porPagina: 500 }),
      ]);
      return {
        imoveis: imoveis.itens.map((i) => ({ value: i.id, label: `${i.codigo} · ${i.titulo}` })),
        contratos: contratos.itens.map((l) => ({ value: l.contrato.id, label: l.contrato.numero })),
      };
    }, []),
  );
  const dadosOpcoes = "dados" in opcoes ? opcoes.dados : undefined;

  const imovelIds = useWatch({ control, name: "imovelIds" });
  const contratoIds = useWatch({ control, name: "contratoIds" });
  const erros = achatarErros(errors);
  const msg = (caminho: string) => erros.find((e) => e.caminho === caminho)?.mensagem;
  const id = (c: string) => idDoCampo(BASE, c);

  const envio = envioDe(envioEscrita);
  const salvando = envio.fase === "salvando";

  async function salvar(dados: DadosContato) {
    const r = await executar(() => fakeApi.saveContato({ ...dados, id: contato?.id }), {
      sucesso: contato ? "Contato atualizado" : "Contato criado",
      silenciarErro: true,
    });
    if (r.fase === "ok") onAbertoChange(false);
  }

  const rotulo = (lista: { value: string; label: string }[] | undefined, valor: string) =>
    lista?.find((o) => o.value === valor)?.label ?? valor;

  function vinculos(
    campo: "imovelIds" | "contratoIds",
    titulo: string,
    lista: { value: string; label: string }[] | undefined,
    escolhidos: string[],
    marcador: string,
  ) {
    return (
      <Field label={titulo} requirement="optional" error={msg(campo)}>
        <div className="flex flex-col gap-2">
          {dadosOpcoes ? (
            <Combobox
              options={(lista ?? []).filter((o) => !escolhidos.includes(o.value))}
              value=""
              onValueChange={(v) => v && setValue(campo, [...escolhidos, v], { shouldDirty: true })}
              placeholder={marcador}
              searchPlaceholder="Buscar"
            />
          ) : opcoes.fase === "error" ? (
            <Button variant="secondary" onClick={recarregar}>
              Tentar de novo
            </Button>
          ) : (
            <Skeleton className="h-10 w-full rounded-md" />
          )}
          {escolhidos.length > 0 ? (
            <ul aria-label={`${titulo} vinculados`} className="flex flex-wrap gap-2">
              {escolhidos.map((v) => (
                <li key={v} className="min-w-0">
                  <Tag
                    tone="neutral"
                    className="max-w-full"
                    removeLabel={`Remover ${rotulo(lista, v)}`}
                    onRemove={() =>
                      setValue(
                        campo,
                        escolhidos.filter((x) => x !== v),
                        { shouldDirty: true },
                      )
                    }
                  >
                    <span className="truncate">{rotulo(lista, v)}</span>
                  </Tag>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Field>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{contato ? "Editar contato" : "Novo contato"}</DialogTitle>
        <DialogDescription className="sr-only">Nome, papel, telefone, e-mail e vínculos</DialogDescription>
      </DialogHeader>
      <form
        noValidate
        aria-label="Formulário de contato"
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          if (salvando) {
            e.preventDefault();
            return;
          }
          void handleSubmit(salvar, (inv) => focarPrimeiro(achatarErros(inv).map((x) => id(x.caminho))))(e);
        }}
      >
        <AlertaServidor envio={envio} />
        <Field label="Nome" requirement="required" id={id("nome")} error={msg("nome")}>
          <Input autoComplete="off" {...register("nome")} />
        </Field>
        <Field label="Papel" requirement="required" id={id("papel")} error={msg("papel")}>
          <Controller
            control={control}
            name="papel"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                options={PAPEIS_CONTATO.map((p) => ({ value: p, label: PAPEL_CONTATO_ROTULO[p] }))}
              />
            )}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Telefone" requirement="optional" id={id("telefone")} error={msg("telefone")}>
            <Controller
              control={control}
              name="telefone"
              render={({ field }) => (
                <CampoMascara
                  digitos={field.value ?? ""}
                  onChange={(d) => field.onChange(d || undefined)}
                  onBlur={field.onBlur}
                  mascarar={formatTelefone}
                  maxDigitos={11}
                  inputMode="tel"
                  type="tel"
                  placeholder="(11) 98765-4321"
                  autoComplete="off"
                />
              )}
            />
          </Field>
          <Field label="E-mail" requirement="optional" id={id("email")} error={msg("email")}>
            <Input type="email" autoComplete="off" {...register("email", { setValueAs: vazioParaUndefined })} />
          </Field>
        </div>
        <Field label="Observação" requirement="optional" id={id("observacao")} error={msg("observacao")}>
          <Textarea maxLength={500} showCounter {...register("observacao", { setValueAs: vazioParaUndefined })} />
        </Field>
        {vinculos("imovelIds", "Imóveis", dadosOpcoes?.imoveis, imovelIds, "Vincular imóvel")}
        {vinculos("contratoIds", "Contratos", dadosOpcoes?.contratos, contratoIds, "Vincular contrato")}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onAbertoChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvando}>
            {contato ? "Salvar" : "Criar contato"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
