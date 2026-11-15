/**
 * Textos pt-BR de Atividade e RegistroAlteracao (RF-13, RF-26, RF-34, RF-65).
 * Só apresentação: monta frases a partir de `tipo` + `dados`; não decide nenhuma regra de fluxo.
 */
import {
  ArrowRightLeft,
  Banknote,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  FilePlus,
  FileText,
  House,
  Link2,
  RefreshCw,
  StickyNote,
  Tag,
  type LucideIcon,
} from "lucide-react";
import type { Atividade, RegistroAlteracao, TipoAtividade, ValorBruto } from "@/domain";
import { formatData, formatDataHora, formatMoeda, formatNumero } from "@/lib/format";
import { ETAPA_UI, MOTIVO_PERDA_ROTULO, STATUS_CONTRATO_UI, STATUS_IMOVEL_UI } from "./rotulos";

export const ICONE_ATIVIDADE: Record<TipoAtividade, LucideIcon> = {
  etapaAlterada: ArrowRightLeft,
  nota: StickyNote,
  visitaAgendada: CalendarPlus,
  visitaRealizada: CalendarCheck,
  visitaCancelada: CalendarX,
  propostaEnviada: FileText,
  imovelCriado: House,
  precoAlterado: Tag,
  statusAlterado: RefreshCw,
  pagamentoRegistrado: Banknote,
  contratoCriado: FilePlus,
  contratoVinculado: Link2,
};

type Dados = Atividade["dados"];

const CAMPO_ROTULO: Record<string, string> = {
  preco: "Preço",
  condominio: "Condomínio",
  iptu: "IPTU",
  orcamento: "Orçamento",
  etapa: "Etapa",
  status: "Status",
  valor: "Valor",
  taxaAdministracao: "Taxa de administração",
};

function rotuloEnum(mapa: Record<string, { rotulo: string }>, valor: unknown): string {
  return typeof valor === "string" ? (mapa[valor]?.rotulo ?? valor) : "—";
}

function moeda(valor: unknown): string {
  return typeof valor === "number" ? formatMoeda(valor) : "—";
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

/** Rótulo de status conforme a entidade do alvo (imóvel e contrato têm vocabulários distintos). */
function rotuloStatus(alvo: Atividade["alvo"]["tipo"], valor: unknown): string {
  return rotuloEnum(alvo === "contrato" ? STATUS_CONTRATO_UI : STATUS_IMOVEL_UI, valor);
}

export type TextoAtividade = { titulo: string; detalhe?: string };

/** "Etapa alterada de Visita para Proposta", "Pagamento registrado da parcela 3"… */
export function textoAtividade(a: Pick<Atividade, "tipo" | "dados" | "alvo">): TextoAtividade {
  const d: Dados = a.dados;
  switch (a.tipo) {
    case "etapaAlterada": {
      const motivo =
        typeof d.motivo === "string" ? MOTIVO_PERDA_ROTULO[d.motivo as keyof typeof MOTIVO_PERDA_ROTULO] : undefined;
      return {
        titulo: `Etapa alterada de ${rotuloEnum(ETAPA_UI, d.de)} para ${rotuloEnum(ETAPA_UI, d.para)}`,
        detalhe: motivo ? `Motivo: ${motivo}` : undefined,
      };
    }
    case "nota":
      return { titulo: "Nota adicionada", detalhe: texto(d.texto) || undefined };
    case "visitaAgendada":
      return { titulo: d.dataHora ? `Visita agendada para ${formatDataHora(texto(d.dataHora))}` : "Visita agendada" };
    case "visitaRealizada":
      return { titulo: "Visita realizada" };
    case "visitaCancelada":
      return { titulo: "Visita cancelada" };
    case "propostaEnviada":
      return { titulo: typeof d.valor === "number" ? `Proposta enviada de ${moeda(d.valor)}` : "Proposta enviada" };
    case "imovelCriado":
      return { titulo: d.codigo ? `Imóvel ${texto(d.codigo)} cadastrado` : "Imóvel cadastrado" };
    case "precoAlterado": {
      const campo = CAMPO_ROTULO[texto(d.campo)] ?? "Valor";
      return { titulo: `${campo} alterado de ${moeda(d.de)} para ${moeda(d.para)}` };
    }
    case "statusAlterado":
      return {
        titulo: `Status alterado de ${rotuloStatus(a.alvo.tipo, d.de)} para ${rotuloStatus(a.alvo.tipo, d.para)}`,
        detalhe: texto(d.motivo) ? `Motivo: ${texto(d.motivo)}` : undefined,
      };
    case "pagamentoRegistrado":
      return {
        titulo: `Pagamento registrado da parcela ${formatNumero(Number(d.numero ?? 0))}`,
        detalhe: typeof d.valor === "number" ? moeda(d.valor) : undefined,
      };
    case "contratoCriado":
      return {
        titulo: d.numero ? `Contrato ${texto(d.numero)} criado` : "Contrato criado",
        detalhe: typeof d.valor === "number" ? moeda(d.valor) : undefined,
      };
    case "contratoVinculado":
      return { titulo: d.numero ? `Contrato ${texto(d.numero)} vinculado ao lead` : "Contrato vinculado ao lead" };
  }
}

const PARCELA = /^(parcela|comissao)\.(\d+)\.(valor|pagoEm|pagaEm)$/;

/** Rótulo do campo: `parcela.3.pagoEm` → "Pagamento da parcela 3". */
export function rotuloCampo(campo: string): string {
  const m = PARCELA.exec(campo);
  if (m) {
    const [, tipo, n, sub] = m;
    const de = tipo === "parcela" ? "parcela" : "comissão";
    return sub === "valor" ? `Valor da ${de} ${n}` : `Pagamento da ${de} ${n}`;
  }
  return CAMPO_ROTULO[campo] ?? campo;
}

/** Formata `de`/`para` conforme o campo: R$ para dinheiro, rótulo para status, data para pagamento. */
export function textoValor(r: Pick<RegistroAlteracao, "campo" | "entidade">, v: ValorBruto): string {
  const m = PARCELA.exec(r.campo);
  if (m?.[3] === "pagoEm" || m?.[3] === "pagaEm") return v === null ? "Não pago" : formatData(String(v));
  if (m?.[3] === "valor") return typeof v === "number" ? formatMoeda(v) : "—";
  switch (r.campo) {
    case "preco":
    case "condominio":
    case "iptu":
    case "valor":
      return typeof v === "number" ? formatMoeda(v) : "—";
    case "orcamento":
      return typeof v === "number" ? formatMoeda(v) : "Sem orçamento";
    case "taxaAdministracao":
      return typeof v === "number" ? `${formatNumero(v, 1)} %` : "—";
    case "etapa":
      return rotuloEnum(ETAPA_UI, v);
    case "status":
      return rotuloStatus(r.entidade.tipo, v);
    default:
      return v === null ? "—" : String(v);
  }
}
