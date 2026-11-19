"use client";
/** Controles dos filtros de imóveis (RF-21) dentro do Popover da FilterBar. Só emitem mudanças de URL. */
import { useState, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { STATUS_IMOVEL_UI, TIPO_IMOVEL_ROTULO } from "@/components/patterns/rotulos";
import { STATUS_IMOVEL, TIPOS_IMOVEL } from "@/domain";
import type { Parametros } from "@/features/dados/useParametrosUrl";
import type { ParametrosImoveis } from "./filtros";

type Mudar = (mudancas: Parametros) => void;

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-text">{titulo}</legend>
      {children}
    </fieldset>
  );
}

function alternar<T>(lista: T[], valor: T, marcado: boolean): T[] {
  return marcado ? [...lista, valor] : lista.filter((v) => v !== valor);
}

export function FiltrosPrincipais({ p, onMudar }: { p: ParametrosImoveis; onMudar: Mudar }) {
  return (
    <>
      <Grupo titulo="Tipo">
        {TIPOS_IMOVEL.map((t) => (
          <Checkbox
            key={t}
            label={TIPO_IMOVEL_ROTULO[t]}
            checked={p.tipos.includes(t)}
            onCheckedChange={(m) => onMudar({ tipo: alternar(p.tipos, t, m === true) })}
          />
        ))}
      </Grupo>
      <Grupo titulo="Status">
        {STATUS_IMOVEL.map((s) => (
          <Checkbox
            key={s}
            label={STATUS_IMOVEL_UI[s].rotulo}
            checked={p.status.includes(s)}
            onCheckedChange={(m) => onMudar({ status: alternar(p.status, s, m === true) })}
          />
        ))}
      </Grupo>
      <Grupo titulo="Quartos">
        <SegmentedControl
          aria-label="Quartos"
          value={p.quartos === undefined ? "todos" : String(p.quartos)}
          onValueChange={(v) => onMudar({ quartos: v === "todos" ? undefined : v })}
          options={[
            { value: "todos", label: "Todos" },
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4+" },
          ]}
        />
      </Grupo>
      <Switch
        label="Só favoritos"
        checked={p.favoritos}
        onCheckedChange={(m) => onMudar({ favoritos: m ? "1" : undefined })}
      />
    </>
  );
}

/** Faixa de preço em reais: grava na URL ao sair do campo ou com Enter. */
function CampoReais({ rotulo, valor, onGravar }: { rotulo: string; valor?: number; onGravar: (v?: number) => void }) {
  const [texto, setTexto] = useState(valor === undefined ? "" : String(valor));
  const [visto, setVisto] = useState(valor);
  if (visto !== valor) {
    setVisto(valor);
    setTexto(valor === undefined ? "" : String(valor));
  }
  const gravar = () => {
    const digitos = texto.replace(/\D/g, "");
    onGravar(digitos === "" ? undefined : Number(digitos));
  };
  return (
    <Input
      aria-label={rotulo}
      placeholder={rotulo}
      inputMode="numeric"
      prefix="R$"
      autoComplete="off"
      className="tnum"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={gravar}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          gravar();
        }
      }}
    />
  );
}

export function FiltrosAvancados({
  p,
  bairros,
  corretores,
  corretorEfetivo,
  onMudar,
}: {
  p: ParametrosImoveis;
  bairros: string[];
  corretores: { id: string; nome: string }[];
  corretorEfetivo?: string;
  onMudar: Mudar;
}) {
  return (
    <>
      <Grupo titulo="Preço">
        <div className="grid grid-cols-2 gap-2">
          <CampoReais
            rotulo="Preço mínimo"
            valor={p.precoMin}
            onGravar={(v) => onMudar({ precoMin: v === undefined ? undefined : String(v) })}
          />
          <CampoReais
            rotulo="Preço máximo"
            valor={p.precoMax}
            onGravar={(v) => onMudar({ precoMax: v === undefined ? undefined : String(v) })}
          />
        </div>
      </Grupo>
      <Grupo titulo="Corretor">
        <Select
          aria-label="Corretor responsável"
          value={corretorEfetivo ?? "todos"}
          onValueChange={(v) => onMudar({ corretor: v })}
          options={[
            { value: "todos", label: "Todos os corretores" },
            ...corretores.map((c) => ({ value: c.id, label: c.nome })),
          ]}
        />
      </Grupo>
      {bairros.length > 0 ? (
        <Grupo titulo="Bairro">
          <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
            {bairros.map((b) => (
              <Checkbox
                key={b}
                label={b}
                checked={p.bairros.includes(b)}
                onCheckedChange={(m) => onMudar({ bairro: alternar(p.bairros, b, m === true) })}
              />
            ))}
          </div>
        </Grupo>
      ) : null}
    </>
  );
}
