/**
 * Dados mock fixos para as histórias do Storybook e testes dos compostos (Fase 6).
 * Mesma semente e mesmo "hoje" sempre: as histórias não mudam de um dia para o outro.
 */
import { dataLocal } from "@/domain/comum/tipos";
import { gerarBaseComCasos } from "./gerador";

export const AGORA_HISTORIAS = "2026-11-14T12:00:00.000Z";
export const HOJE_HISTORIAS = dataLocal(AGORA_HISTORIAS);

const { base, casos } = gerarBaseComCasos({ hoje: AGORA_HISTORIAS });

export const BASE_HISTORIAS = base;
export const CASOS_HISTORIAS = casos;

export const imovelPorId = (id: string) => base.imoveis.find((i) => i.id === id)!;
export const leadPorId = (id: string) => base.leads.find((l) => l.id === id)!;
export const contratoPorId = (id: string) => base.contratos.find((c) => c.id === id)!;
export const corretorPorId = (id: string) => base.corretores.find((c) => c.id === id)!;
