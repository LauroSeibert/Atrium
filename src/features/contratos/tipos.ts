import type { fakeApi } from "@/mocks/services/fakeApi";

type Lista = Awaited<ReturnType<typeof fakeApi.listContratos>>;
/** Uma linha da lista de contratos como o fakeApi devolve (já com status e vencimento derivados). */
export type LinhaContrato = Lista["itens"][number];

type Detalhe = Awaited<ReturnType<typeof fakeApi.getContrato>>;
export type DetalheContrato = Detalhe;
