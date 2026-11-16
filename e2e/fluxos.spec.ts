import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Gate 8: fluxos principais ponta a ponta com o mock (REQUISITOS §7) e acessibilidade de cada tela.
 * O fakeApi tem latência de 300 a 800 ms: só expects com auto-wait. Cada teste começa com o mock limpo.
 */
const RESTRICOES_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function semRolagemHorizontal(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

/** Espera a tela assentar: h1, nenhum skeleton e nenhuma animação. */
async function aguardar(page: Page) {
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 10_000 });
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
}

test.beforeEach(async ({ page }) => {
  // Mock limpo a cada teste (o fakeApi persiste no localStorage, RF-51).
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("e2e-limpo")) {
      localStorage.clear();
      sessionStorage.setItem("e2e-limpo", "1");
    }
  });
});

test("filtrar imóveis e abrir o detalhe (RF-21, RF-22, RF-24, RF-06)", async ({ page }) => {
  await page.goto("/imoveis?corretor=todos");
  await aguardar(page);
  const busca = page
    .getByRole("searchbox")
    .or(page.getByPlaceholder(/código/i))
    .first();
  await busca.fill("AT-00");
  await expect(page).toHaveURL(/[?&]q=AT-00/);
  const primeiro = page.locator('a[href^="/imoveis/AT-"]').first();
  await primeiro.click();
  await expect(page).toHaveURL(/\/imoveis\/AT-\d{4}$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: /galeria|cômodos/i }).first()).toBeVisible();
});

test("mover lead pelo menu e ver o toast com Desfazer (RF-31, RF-04)", async ({ page, isMobile }) => {
  test.skip(isMobile, "No celular o kanban rola na horizontal; o fluxo é o mesmo.");
  await page.goto("/leads?responsavel=todos");
  await aguardar(page);
  const menu = page.getByRole("button", { name: /^Mover .+ para…$/ }).first();
  const nome = (await menu.getAttribute("aria-label"))!.replace(/^Mover (.+) para…$/, "$1");
  await menu.click();
  await page.getByRole("menuitem", { name: /Proposta/ }).click();
  await expect(page.getByText(`${nome} movido para Proposta`, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Desfazer" })).toBeVisible();
});

test("registrar pagamento atualiza o indicador e oferece Desfazer (RF-43, RF-44, RF-04)", async ({ page }) => {
  await page.goto("/contratos?status=ativo");
  await aguardar(page);
  await page.locator('a[href^="/contratos/ctr_"]').first().click();
  await expect(page).toHaveURL(/\/contratos\/ctr_/);
  await aguardar(page);
  const registrar = page.getByRole("button", { name: /^Registrar pagamento da parcela \d+$/ }).first();
  await expect(registrar).toBeEnabled();
  const nome = (await registrar.getAttribute("aria-label"))!;
  await registrar.click();
  await expect(page.getByText(/^Pagamento da parcela \d+ registrado$/).first()).toBeVisible();
  // A parcela deixa de oferecer o registro (virou paga) e o Desfazer devolve.
  await expect(page.getByRole("button", { name: nome, exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.getByRole("button", { name: nome, exact: true })).toHaveCount(1);
});

const TELAS = ["/", "/imoveis", "/leads", "/contratos", "/financeiro", "/configuracoes", "/imoveis/novo"];

for (const tema of ["light", "dark"] as const) {
  test.describe(`tema ${tema === "light" ? "claro" : "escuro"}`, () => {
    test.use({ colorScheme: tema });
    for (const rota of TELAS) {
      test(`${rota}: sem violações do axe e sem rolagem horizontal (RNF-01, RNF-02)`, async ({ page }) => {
        await page.goto(rota);
        await aguardar(page);
        expect(await semRolagemHorizontal(page)).toBeLessThanOrEqual(0);
        const r = await new AxeBuilder({ page }).withTags(RESTRICOES_WCAG).analyze();
        expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
      });
    }
  });
}

test("detalhes: imóvel, lead e contrato sem violações do axe (RNF-02)", async ({ page }) => {
  for (const [lista, padrao] of [
    ["/imoveis?corretor=todos", /\/imoveis\/AT-\d{4}$/],
    ["/contratos", /\/contratos\/ctr_/],
  ] as const) {
    await page.goto(lista);
    await aguardar(page);
    const link = page
      .locator(`a[href^="${lista.split("?")[0]}/${lista.startsWith("/imoveis") ? "AT-" : "ctr_"}"]`)
      .first();
    await page.goto((await link.getAttribute("href"))!);
    await expect(page).toHaveURL(padrao);
    await aguardar(page);
    const r = await new AxeBuilder({ page }).withTags(RESTRICOES_WCAG).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  }
});
