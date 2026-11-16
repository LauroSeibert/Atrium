"use client";
/**
 * Tela Configurações (RF-50 perfil, RF-03 tema, RF-09 densidade, RF-08 persona, RF-51 demonstração).
 * Contêiner: só liga compostos ao fakeApi, ao next-themes e às preferências. Validade dos dados do perfil
 * vem do schema do domínio (`dadosPerfilSchema`); latência/erro valem só na sessão (RF-51).
 */
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PAPEL_ROTULO } from "@/components/layout/UserMenu";
import { ConfirmDestructive, type FaseConfirmacao } from "@/components/patterns/ConfirmDestructive";
import { EstadoRecurso } from "@/components/patterns/EstadoRecurso";
import {
  AlertaServidor,
  FormSection,
  FormSectionSkeleton,
  FormSectionIndex,
  LARGURA_TOTAL,
  type EnvioFormulario,
} from "@/components/patterns/FormSection";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import type { TableDensity } from "@/components/ui/Table";
import { dadosPerfilSchema, type Corretor } from "@/domain";
import { paraErroApi } from "@/mocks/services/erros";
import { fakeApi } from "@/mocks/services/fakeApi";
import { usePreferencia } from "@/lib/preferencias";
import { combinar } from "@/lib/recurso";
import { executarEscrita } from "@/features/dados/escrita";
import { invalidarDados } from "@/features/dados/revisao";
import { useConsulta } from "@/features/dados/useConsulta";

type Tema = "light" | "dark" | "system";
const assinarNada = () => () => {};

/* ---------- Perfil (RF-50) ---------- */

type Rascunho = Pick<Corretor, "nome" | "email" | "telefone">;
type ErrosPerfil = Partial<Record<keyof Rascunho, string>>;

const MENSAGENS: Record<keyof Rascunho, string> = {
  nome: "Preencha este campo",
  email: "Informe um e-mail válido",
  telefone: "Telefone com DDD, 10 ou 11 dígitos",
};

function SecaoPerfil({ perfil }: { perfil: Corretor }) {
  const [rascunho, setRascunho] = useState<Rascunho>({
    nome: perfil.nome,
    email: perfil.email,
    telefone: perfil.telefone,
  });
  const [erros, setErros] = useState<ErrosPerfil>({});
  const [envio, setEnvio] = useState<EnvioFormulario>({ fase: "idle" });

  const editar = (campo: keyof Rascunho, valor: string) => {
    setRascunho((r) => ({ ...r, [campo]: valor }));
    if (envio.fase !== "idle") setEnvio({ fase: "idle" });
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    const dados = { ...rascunho, nome: rascunho.nome.trim(), telefone: rascunho.telefone.replace(/\D/g, "") };
    const validacao = dadosPerfilSchema.safeParse(dados);
    if (!validacao.success) {
      const novos: ErrosPerfil = {};
      for (const issue of validacao.error.issues) {
        const campo = issue.path[0] as keyof Rascunho;
        novos[campo] ??= MENSAGENS[campo];
      }
      setErros(novos);
      return;
    }
    setErros({});
    setEnvio({ fase: "salvando" });
    const r = await executarEscrita(() => fakeApi.savePerfil(validacao.data), {
      sucesso: "Perfil salvo",
      silenciarErro: true,
    });
    if (r.fase === "ok") {
      setRascunho(validacao.data);
      setEnvio({ fase: "salvo" });
    } else setEnvio({ fase: "erro", mensagem: r.erro.message });
  };

  return (
    <form onSubmit={salvar} noValidate className="animate-fade-in">
      <FormSection id="perfil" titulo="Perfil">
        <Field label="Nome" requirement="required" error={erros.nome}>
          <Input value={rascunho.nome} onChange={(e) => editar("nome", e.target.value)} autoComplete="name" />
        </Field>
        <Field label="E-mail" requirement="required" error={erros.email}>
          <Input
            type="email"
            value={rascunho.email}
            onChange={(e) => editar("email", e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Telefone" requirement="required" error={erros.telefone}>
          <Input
            type="tel"
            inputMode="tel"
            value={rascunho.telefone}
            onChange={(e) => editar("telefone", e.target.value)}
            autoComplete="tel"
          />
        </Field>
        <div className={`flex flex-col gap-3 ${LARGURA_TOTAL}`}>
          <AlertaServidor envio={envio} />
          <div className="flex items-center justify-end gap-3">
            <p role="status" className="mr-auto text-sm text-text-muted">
              {envio.fase === "salvando" ? "Salvando…" : envio.fase === "salvo" ? "Salvo" : null}
            </p>
            <Button type="submit" loading={envio.fase === "salvando"} className="max-md:h-11">
              Salvar
            </Button>
          </div>
        </div>
      </FormSection>
    </form>
  );
}

/* ---------- Tela ---------- */

const SECOES = [
  { id: "perfil", titulo: "Perfil" },
  { id: "aparencia", titulo: "Aparência" },
  { id: "usuario", titulo: "Usuário atual" },
  { id: "demonstracao", titulo: "Demonstração" },
];

export function TelaConfiguracoes() {
  const perfil = useConsulta(useCallback(() => fakeApi.getPerfil(), []));
  const corretores = useConsulta(useCallback(() => fakeApi.listCorretores(), []));

  // Tema (RF-03): só é conhecido depois de montar.
  const { theme, setTheme } = useTheme();
  const montado = useSyncExternalStore(
    assinarNada,
    () => true,
    () => false,
  );
  const tema: Tema = montado && (theme === "light" || theme === "dark") ? theme : "system";

  // Densidade (RF-09): os valores são os de DataTable (`TableDensity`).
  const [densidade, setDensidade] = usePreferencia<TableDensity>("densidade", "comfortable");

  // Demonstração (RF-51): vale só na sessão.
  const [config, setConfig] = useState(() => fakeApi.getConfig());
  const atualizarConfig = (parcial: Parameters<typeof fakeApi.configurar>[0]) => {
    fakeApi.configurar(parcial);
    setConfig(fakeApi.getConfig());
  };

  const [confirmando, setConfirmando] = useState(false);
  const [faseReset, setFaseReset] = useState<FaseConfirmacao>({ fase: "idle" });

  const trocarPersona = async (id: string) => {
    try {
      await fakeApi.setUsuarioAtual(id);
      invalidarDados();
      toast({ tone: "success", title: "Usuário trocado" });
    } catch (e) {
      toast({ tone: "error", title: "Não foi possível trocar de usuário", description: paraErroApi(e).message });
    }
  };

  const restaurar = async () => {
    setFaseReset({ fase: "confirmando" });
    try {
      await fakeApi.resetMock();
    } catch (e) {
      setFaseReset({ fase: "erro", mensagem: paraErroApi(e).message });
      return;
    }
    invalidarDados();
    setFaseReset({ fase: "idle" });
    setConfirmando(false);
    toast({ tone: "success", title: "Dados mock restaurados" });
  };

  const persona = useMemo(
    () =>
      combinar(perfil.estado, corretores.estado, (p, lista) => ({
        atualId: p.id,
        opcoes: lista.map((c) => ({ value: c.id, label: `${c.nome} (${PAPEL_ROTULO[c.papel]})` })),
      })),
    [perfil.estado, corretores.estado],
  );
  const recarregarPersona = () => {
    perfil.recarregar();
    corretores.recarregar();
  };

  return (
    <>
      <PageHeader eyebrow="Conta · preferências" titulo="Configurações" />
      {/* Mesma largura das outras telas: índice das seções à esquerda (desktop) e seções ocupando o resto. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <FormSectionIndex
          secoes={SECOES}
          className="hidden lg:sticky lg:top-20 lg:col-span-3 lg:block lg:self-start xl:col-span-2"
        />
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-9 xl:col-span-10">
          <EstadoRecurso
            estado={perfil.estado}
            carregando={<FormSectionSkeleton campos={3} />}
            erro={{ titulo: "Não foi possível carregar o perfil" }}
            onTentarNovamente={perfil.recarregar}
          >
            {(p) => <SecaoPerfil key={p.id} perfil={p} />}
          </EstadoRecurso>

          <FormSection id="aparencia" titulo="Aparência">
            <div className="flex flex-col gap-2">
              <span aria-hidden="true" className="text-caption font-medium text-text">
                Tema
              </span>
              <SegmentedControl<Tema>
                aria-label="Tema"
                value={tema}
                onValueChange={setTheme}
                options={[
                  { value: "light", label: "Claro", icon: Sun },
                  { value: "dark", label: "Escuro", icon: Moon },
                  { value: "system", label: "Sistema", icon: Monitor },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span aria-hidden="true" className="text-caption font-medium text-text">
                Densidade das tabelas
              </span>
              <SegmentedControl<TableDensity>
                aria-label="Densidade das tabelas"
                value={densidade}
                onValueChange={setDensidade}
                options={[
                  { value: "comfortable", label: "Confortável" },
                  { value: "compact", label: "Compacta" },
                ]}
              />
            </div>
          </FormSection>

          <FormSection id="usuario" titulo="Usuário atual">
            <EstadoRecurso
              estado={persona}
              carregando={<Skeleton shape="rect" className="h-10" />}
              erro={{ titulo: "Não foi possível carregar os usuários" }}
              onTentarNovamente={recarregarPersona}
            >
              {(p) => (
                <Field label="Entrar como">
                  <Select options={p.opcoes} value={p.atualId} onValueChange={(id) => void trocarPersona(id)} />
                </Field>
              )}
            </EstadoRecurso>
          </FormSection>

          <FormSection id="demonstracao" titulo="Demonstração">
            <Field label="Latência">
              <Slider
                thumbLabels={["Latência em milissegundos"]}
                min={0}
                max={2000}
                step={100}
                value={[config.latencia[1]]}
                onValueChange={([v]) => atualizarConfig({ latencia: [v ?? 0, v ?? 0] })}
                formatValue={(v) => `${v} ms`}
              />
            </Field>
            <Field label="Taxa de erro">
              <Slider
                thumbLabels={["Taxa de erro em porcentagem"]}
                min={0}
                max={50}
                step={5}
                value={[Math.round(config.taxaErro * 100)]}
                onValueChange={([v]) => atualizarConfig({ taxaErro: (v ?? 0) / 100 })}
                formatValue={(v) => `${v}%`}
              />
            </Field>
            <div className={LARGURA_TOTAL}>
              <Button variant="secondary" onClick={() => setConfirmando(true)} className="max-md:h-11">
                Restaurar dados mock
              </Button>
            </div>
          </FormSection>
        </div>
      </div>

      <ConfirmDestructive
        aberto={confirmando}
        onAbertoChange={(a) => {
          setConfirmando(a);
          if (!a) setFaseReset({ fase: "idle" });
        }}
        titulo="Restaurar dados mock?"
        impactos={["Leads, imóveis, contratos e parcelas voltam ao estado inicial.", "Não dá para desfazer."]}
        rotuloConfirmar="Restaurar"
        fase={faseReset}
        onConfirmar={() => void restaurar()}
      />
    </>
  );
}
