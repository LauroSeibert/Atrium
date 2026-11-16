import type { fakeApi } from "@/mocks/services/fakeApi";

type Item<F extends (...a: never[]) => Promise<{ itens: unknown[] }>> = Awaited<ReturnType<F>>["itens"][number];
type Lista<F extends (...a: never[]) => Promise<unknown[]>> = Awaited<ReturnType<F>>[number];

export type LinhaReceitaTela = Item<typeof fakeApi.listReceitas>;
export type LinhaDespesa = Item<typeof fakeApi.listDespesas>;
export type LinhaComissaoTela = Lista<typeof fakeApi.listComissoes>;
export type LinhaRepasseTela = Lista<typeof fakeApi.listRepasses>;
