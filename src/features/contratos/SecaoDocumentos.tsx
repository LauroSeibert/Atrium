"use client";
/** Documentos do contrato (RF-76): enviar, listar, baixar e remover (com confirmação e Desfazer). */
import { Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { ConfirmDestructive } from "@/components/patterns/ConfirmDestructive";
import { DocumentList, formatTamanhoArquivo } from "@/components/patterns/DocumentList";
import { TIPO_DOCUMENTO_ROTULO } from "@/components/patterns/rotulos";
import { SectionCard } from "@/components/patterns/SectionCard";
import { Button } from "@/components/ui/Button";
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
import { toast } from "@/components/ui/Toast";
import { MIMES_DOCUMENTO, TAMANHO_MAXIMO_DOCUMENTO, TIPOS_DOCUMENTO, type TipoDocumento } from "@/domain";
import { faseConfirmacaoDe, useEscrita } from "@/features/dados/escrita";
import { useConsulta } from "@/features/dados/useConsulta";
import { paraErroApi } from "@/mocks/services/erros";
import { fakeApi } from "@/mocks/services/fakeApi";

const eTipo = (v: string): v is TipoDocumento => (TIPOS_DOCUMENTO as readonly string[]).includes(v);

function baixarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function EnviarDocumento({
  contratoId,
  aberto,
  onAbertoChange,
}: {
  contratoId: string;
  aberto: boolean;
  onAbertoChange: (a: boolean) => void;
}) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [tipo, setTipo] = useState<TipoDocumento | "">("");
  const [tentou, setTentou] = useState(false);
  const escrita = useEscrita();

  const fechar = (a: boolean) => {
    onAbertoChange(a);
    if (!a) {
      setArquivo(null);
      setTipo("");
      setTentou(false);
      escrita.limpar();
    }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setTentou(true);
    if (!arquivo || !tipo) return;
    const r = await escrita.executar(() => fakeApi.enviarDocumento(contratoId, arquivo, tipo), {
      sucesso: (_, e) => (e.soNestaSessao ? "Documento enviado. O arquivo vale só nesta sessão." : "Documento enviado"),
      silenciarErro: true,
    });
    if (r.fase === "ok") fechar(false);
  };

  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogContent size="md">
        <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Enviar documento</DialogTitle>
            <DialogDescription>
              PDF, JPG ou PNG, até {formatTamanhoArquivo(TAMANHO_MAXIMO_DOCUMENTO)}.
            </DialogDescription>
          </DialogHeader>
          <Field label="Arquivo" error={tentou && !arquivo ? "Escolha um arquivo." : undefined}>
            {(c) => (
              <Input
                {...c}
                type="file"
                accept={MIMES_DOCUMENTO.join(",")}
                onChange={(e) => {
                  setArquivo(e.target.files?.[0] ?? null);
                  escrita.limpar();
                }}
              />
            )}
          </Field>
          <Field label="Tipo" error={tentou && !tipo ? "Escolha o tipo." : undefined}>
            {(c) => (
              <Select
                {...c}
                value={tipo}
                onValueChange={(v) => setTipo(eTipo(v) ? v : "")}
                options={TIPOS_DOCUMENTO.map((t) => ({ value: t, label: TIPO_DOCUMENTO_ROTULO[t] }))}
              />
            )}
          </Field>
          {escrita.estado.fase === "erro" ? (
            <p role="alert" className="text-sm text-danger">
              {escrita.estado.mensagem}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => fechar(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={escrita.estado.fase === "enviando"}>
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SecaoDocumentos({ contratoId }: { contratoId: string }) {
  const carregar = useCallback(() => fakeApi.listDocumentos(contratoId), [contratoId]);
  const { estado, recarregar } = useConsulta(carregar);
  const [enviando, setEnviando] = useState(false);
  const [baixandoId, setBaixandoId] = useState<string | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const remocao = useEscrita();

  const itens = "dados" in estado ? estado.dados : undefined;
  const removendo = itens?.find((d) => d.id === removendoId);

  const baixar = async (id: string) => {
    const doc = itens?.find((d) => d.id === id);
    setBaixandoId(id);
    try {
      baixarBlob(await fakeApi.baixarDocumento(id), doc?.nome ?? "documento");
    } catch (e) {
      toast({ tone: "error", title: "Não foi possível baixar", description: paraErroApi(e).message });
    } finally {
      setBaixandoId(null);
    }
  };

  const remover = async () => {
    if (!removendo) return;
    const r = await remocao.executar(() => fakeApi.removerDocumento(removendo.id), {
      sucesso: "Documento removido",
      silenciarErro: true,
    });
    if (r.fase === "ok") setRemovendoId(null);
  };
  const fase = faseConfirmacaoDe(remocao.estado);

  const botaoEnviar = (
    <Button variant="secondary" size="touch" leadingIcon={Upload} onClick={() => setEnviando(true)}>
      Enviar documento
    </Button>
  );

  return (
    <SectionCard titulo="Documentos" acoes={itens?.length === 0 ? undefined : botaoEnviar}>
      <DocumentList
        estado={estado}
        onBaixar={(id) => void baixar(id)}
        onRemover={setRemovendoId}
        baixandoId={baixandoId}
        acaoVazio={botaoEnviar}
        onTentarNovamente={recarregar}
      />
      <EnviarDocumento contratoId={contratoId} aberto={enviando} onAbertoChange={setEnviando} />
      <ConfirmDestructive
        aberto={removendo !== undefined}
        onAbertoChange={(a) => {
          if (!a) {
            setRemovendoId(null);
            remocao.limpar();
          }
        }}
        titulo={`Remover ${removendo?.nome ?? "o documento"}?`}
        impactos={["O documento sai da lista do contrato.", "Dá para desfazer logo depois pelo aviso."]}
        rotuloConfirmar="Remover documento"
        rotuloVoltar="Manter documento"
        fase={fase}
        onConfirmar={() => void remover()}
      />
    </SectionCard>
  );
}
