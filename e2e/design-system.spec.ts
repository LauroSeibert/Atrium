import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const RESTRICOES_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const esquema of ["light", "dark"] as const) {
  test(`página de cores sem violações de acessibilidade (${esquema})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: esquema });
    await page.goto("/design-system/colors");
    await expect(page.getByRole("heading", { level: 1, name: "Cores" })).toBeVisible();
    await expect(page.locator("html")).toHaveClass(new RegExp(esquema));
    const { violations } = await new AxeBuilder({ page }).withTags(RESTRICOES_WCAG).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
}

test("raiz mostra o Dashboard dentro do shell (RF-01)", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
});

test("alternador de tema aplica e persiste a escolha (RF-03)", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/design-system/colors");
  const escuro = page.getByRole("button", { name: "Escuro", exact: true });
  await escuro.click();
  await expect(escuro).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("sem rolagem horizontal em 320 px (RNF-01)", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/design-system/colors");
  const larguraExtra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(larguraExtra).toBeLessThanOrEqual(0);
});

for (const esquema of ["light", "dark"] as const) {
  test(`página de ilustrações carrega sem violações de acessibilidade (${esquema})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: esquema });
    await page.goto("/design-system/illustrations");
    await expect(page.getByRole("heading", { level: 1, name: "Ilustrações" })).toBeVisible();
    await expect(page.locator("html")).toHaveClass(new RegExp(esquema));
    expect(await page.locator("svg[role=img]").count()).toBeGreaterThanOrEqual(26);
    const { violations } = await new AxeBuilder({ page }).withTags(RESTRICOES_WCAG).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
}

test("ilustrações sem rolagem horizontal em 320 px (RNF-01)", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/design-system/illustrations");
  const larguraExtra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(larguraExtra).toBeLessThanOrEqual(0);
});
