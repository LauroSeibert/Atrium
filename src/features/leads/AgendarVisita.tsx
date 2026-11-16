"use client";
/** Agendar visita a partir do lead (RF-37): imóvel, data e hora. A regra "no futuro" é do domínio. */
import { useCallback, useState } from "react";
import { EstadoRecurso } from "@/components/patterns/EstadoRecurso";
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
import { DateInput, TimeInput } from "@/components/ui/DateInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { fakeApi } from "@/mocks/services/fakeApi";
import { useEscrita } from "@/features/dados/escrita";
import { useConsulta } from "@/features/dados/useConsulta";

type Props = { leadId: string; aberto: boolean; onAbertoChange: (aberto: boolean) => void };

export function AgendarVisita({ leadId, aberto, onAbertoChange }: Props) {
  const { estado: imoveis, recarregar } = useConsulta(
    useCallback(async () => {
      if (!aberto) return [];
      const { itens } = await fakeApi.listImoveis({}, { pagina: 1, porPagina: 500 });
      return itens.map((i) => ({ value: i.id, label: `${i.codigo} · ${i.titulo}` }));
    }, [aberto]),
  );
  const [imovelId, setImovelId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [tentou, setTentou] = useState(false);
  const { estado, executar, limpar } = useEscrita();

  function fechar(a: boolean) {
    if (estado.fase === "enviando") return;
    if (!a) {
      limpar();
      setTentou(false);
    }
    onAbertoChange(a);
  }

  async function agendar(e: React.FormEvent) {
    e.preventDefault();
    setTentou(true);
    if (!imovelId || !data || !hora) return;
    const dataHora = new Date(`${data}T${hora}:00`).toISOString();
    const r = await executar(() => fakeApi.agendarVisita({ imovelId, leadId, dataHora }), {
      sucesso: "Visita agendada",
      silenciarErro: true,
    });
    if (r.fase === "ok") {
      setImovelId("");
      setData("");
      setHora("");
      setTentou(false);
      onAbertoChange(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Agendar visita</DialogTitle>
          <DialogDescription className="sr-only">Imóvel, data e hora</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={(e) => void agendar(e)} className="flex flex-col gap-4">
          <Field label="Imóvel" requirement="required" error={tentou && !imovelId ? "Escolha o imóvel." : undefined}>
            <EstadoRecurso
              estado={imoveis}
              carregando={<Skeleton className="h-10 w-full rounded-md" />}
              onTentarNovamente={recarregar}
              erro={{ titulo: "Não foi possível carregar os imóveis" }}
            >
              {(opcoes) => (
                <Combobox
                  options={opcoes}
                  value={imovelId}
                  onValueChange={setImovelId}
                  placeholder="Selecione o imóvel"
                  searchPlaceholder="Buscar por código ou título"
                />
              )}
            </EstadoRecurso>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Data" requirement="required" error={tentou && !data ? "Informe a data." : undefined}>
              <DateInput value={data} onValueChange={setData} />
            </Field>
            <Field label="Hora" requirement="required" error={tentou && !hora ? "Informe a hora." : undefined}>
              <TimeInput value={hora} onValueChange={setHora} />
            </Field>
          </div>
          {estado.fase === "erro" ? (
            <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              {estado.mensagem}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="secondary" onClick={() => fechar(false)} disabled={estado.fase === "enviando"}>
              Cancelar
            </Button>
            <Button type="submit" loading={estado.fase === "enviando"}>
              Agendar visita
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
