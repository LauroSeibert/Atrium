import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Gate 7: shell do painel (RF-01, RF-02, RF-03, RF-60, RF-61, RF-63, RF-64; RNF-01, RNF-02, RNF-03).
 * O fakeApi tem latência de 300 a 800 ms: tudo aqui usa expects com auto-wait, sem sleeps fixos.
 */
const RESTRICOES_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const MODULOS = [
  { rotulo: "Dashboard", rota: "/", h1: "Dashboard" },
  { rotulo: "Imóveis", rota: "/imoveis", h1: "Imóveis" },
  { rotulo: "Leads", rota: "/leads", h1: "Leads" },
  { rotulo: "Contratos", rota: "/contratos", h1: "Contratos" },
  { rotulo: "Financeiro", rota: "/financeiro", h1: "Financeiro" },
  { rotulo: "Configurações", rota: "/configuracoes", h1: "Configurações" },
] as const;

/** O nome do link pode ganhar o contador ("Leads, 3 leads novos"): casa pelo início. */
const nomeDoItem = (rotulo: string) => new RegExp(`^${rotulo}\\s*(,|$)`);

const menuPrincipal = (page: Page) => page.getByRole("complementary", { name: "Menu principal" });
const trilha = (page: Page) => page.getByRole("navigation", { name: "Trilha de navegação" });

/** Espera o conteúdo estabilizar: h1 visível, nenhum aria-busy e nenhuma animação em curso. */
async function aguardarCarregado(page: Page) {
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
}

async function semRolagemHorizontal(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

/** Abre o primeiro imóvel da lista e devolve o código mostrado na trilha (dados reais do mock). */
async function abrirPrimeiroImovel(page: Page): Promise<string> {
  await page.goto("/imoveis?corretor=todos");
  await page.getByRole("list", { name: "Imóveis" }).getByRole("link").first().click();
  const atual = trilha(page).locator("li").last();
  await expect(atual).toHaveText(/^AT-\d{4}$/);
  return (await atual.textContent())!.trim();
}

test.describe("shell no desktop", () => {
  test.skip(({ isMobile }) => isMobile, "Cenário de desktop (sidebar fixa, largura >= 1280).");

  test("cada item da sidebar leva à rota certa e fica com aria-current (Gate 7, RF-01)", async ({ page }) => {
    await page.goto("/configuracoes");
    await expect(page.getByRole("heading", { level: 1, name: "Configurações" })).toBeVisible();
    for (const modulo of MODULOS) {
      await menuPrincipal(page)
        .getByRole("link", { name: nomeDoItem(modulo.rotulo) })
        .click();
      await expect(page).toHaveURL(modulo.rota === "/" ? /\/$/ : new RegExp(`${modulo.rota}$`));
      await expect(page.getByRole("heading", { level: 1, name: modulo.h1 })).toBeVisible();
      await expect(menuPrincipal(page).getByRole("link", { name: nomeDoItem(modulo.rotulo) })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(menuPrincipal(page).locator('a[aria-current="page"]')).toHaveCount(1);
    }
  });

  test("detalhe de imóvel mantém Imóveis ativo e a trilha mostra Imóveis › código (RF-01, RF-61)", async ({ page }) => {
    const codigo = await abrirPrimeiroImovel(page);
    await expect(page).toHaveURL(/\/imoveis\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(menuPrincipal(page).getByRole("link", { name: nomeDoItem("Imóveis") })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(trilha(page).getByText("Imóveis", { exact: true })).toBeVisible();
    await expect(trilha(page).getByText(codigo, { exact: true })).toBeVisible();
  });

  test("id inexistente mostra não encontrado, com Imóveis ativo (RF-01, RF-61)", async ({ page }) => {
    await page.goto("/imoveis/abc");
    await expect(page.getByRole("heading", { level: 1, name: "Imóvel" })).toBeVisible();
    await expect(page.getByText("Imóvel não encontrado")).toBeVisible();
    await expect(menuPrincipal(page).getByRole("link", { name: nomeDoItem("Imóveis") })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(trilha(page).getByText("Imóveis", { exact: true })).toBeVisible();
  });

  test("edição de imóvel mostra a trilha Imóveis › código › Editar (RF-61)", async ({ page }) => {
    const codigo = await abrirPrimeiroImovel(page);
    await page.getByRole("link", { name: "Editar" }).first().click();
    await expect(page).toHaveURL(/\/imoveis\/[^/]+\/editar$/);
    await expect(page.getByRole("heading", { level: 1, name: "Editar imóvel" })).toBeVisible();
    await expect(menuPrincipal(page).getByRole("link", { name: nomeDoItem("Imóveis") })).toHaveAttribute(
      "aria-current",
      "page",
    );
    for (const rotulo of ["Imóveis", codigo, "Editar"]) {
      await expect(trilha(page).getByText(rotulo, { exact: true })).toBeVisible();
    }
  });

  test("sidebar recolhida persiste após recarregar (RF-60)", async ({ page }) => {
    await page.goto("/imoveis");
    await expect(page.getByRole("heading", { level: 1, name: "Imóveis" })).toBeVisible();
    await menuPrincipal(page).getByRole("button", { name: "Recolher menu" }).click();
    await expect(menuPrincipal(page).getByRole("button", { name: "Expandir menu" })).toBeVisible();
    await page.reload();
    await expect(menuPrincipal(page).getByRole("button", { name: "Expandir menu" })).toBeVisible();
    // O texto some, mas o link mantém o nome acessível (aria-label).
    await expect(menuPrincipal(page).getByText("Imóveis", { exact: true })).toHaveCount(0);
    await expect(menuPrincipal(page).getByRole("link", { name: nomeDoItem("Imóveis") })).toBeVisible();
    // Limpa a preferência para não vazar para outros testes do mesmo contexto.
    await menuPrincipal(page).getByRole("button", { name: "Expandir menu" }).click();
    await expect(menuPrincipal(page).getByRole("button", { name: "Recolher menu" })).toBeVisible();
  });

  test("skip link é o primeiro foco e leva ao conteúdo (RNF-03)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Ir para o conteúdo" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#conteudo")).toBeFocused();
  });
});

test.describe("shell no mobile", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test("sidebar oculta, drawer abre pelo botão e fecha ao navegar (RF-01, RF-63)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
    await expect(menuPrincipal(page)).toBeHidden();
    await page.getByRole("button", { name: "Abrir menu" }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: nomeDoItem("Leads") }).click();
    await expect(page).toHaveURL(/\/leads$/);
    await expect(page.getByRole("heading", { level: 1, name: "Leads" })).toBeVisible();
    await expect(drawer).toBeHidden();
  });

  test("barra inferior mostra a ação principal da tela (RF-63)", async ({ page }) => {
    await page.goto("/imoveis");
    await expect(page.getByRole("heading", { level: 1, name: "Imóveis" })).toBeVisible();
    const barra = page.getByRole("region", { name: "Ação principal" });
    await expect(barra).toBeVisible();
    await expect(barra.getByRole("link", { name: "Novo imóvel" })).toBeVisible();
  });
});

test("tema escolhido no menu da topbar aplica e persiste (RF-03)", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  await page.getByRole("button", { name: /^Tema/ }).click();
  await page.getByRole("menuitemradio", { name: "Escuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("paleta de comandos abre com Ctrl+K e navega (RF-02)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  await page.keyboard.press("Control+K");
  const paleta = page.getByRole("dialog", { name: "Paleta de comandos" });
  await expect(paleta).toBeVisible();
  await paleta.getByPlaceholder(/Buscar/).fill("Contratos");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/contratos$/);
  await expect(page.getByRole("heading", { level: 1, name: "Contratos" })).toBeVisible();
});

test("botão de notificações abre a lista (RF-64)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  await page.getByRole("button", { name: /^Notificações/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Notificações" })).toBeVisible();
});

test.describe("layout nos breakpoints", () => {
  test.skip(({ isMobile }) => isMobile, "Viewport explícito: roda só no projeto desktop.");

  const LARGURAS = [320, 360, 768, 1024, 1280, 1920] as const;
  const ROTAS = ["/", "/imoveis", "/imoveis/abc/editar"] as const;

  for (const largura of LARGURAS) {
    for (const rota of ROTAS) {
      test(`${rota} em ${largura} px sem rolagem horizontal (Gate 7, RNF-01)`, async ({ page }) => {
        await page.setViewportSize({ width: largura, height: 900 });
        await page.goto(rota);
        await aguardarCarregado(page);
        expect(await semRolagemHorizontal(page)).toBeLessThanOrEqual(0);
        // ≥ 768 px: trilho de ícones (tablet) ou sidebar completa (desktop); abaixo, gaveta.
        if (largura >= 768) {
          await expect(menuPrincipal(page)).toBeVisible();
        } else {
          await expect(menuPrincipal(page)).toBeHidden();
        }
        if (largura === 1920) {
          const caixa = await page.locator("#conteudo").boundingBox();
          expect(caixa?.width ?? 0).toBeGreaterThan(0);
          expect(caixa?.width ?? Infinity).toBeLessThanOrEqual(1440);
        }
      });
    }
  }
});

test.describe("acessibilidade das rotas do shell", () => {
  const ROTAS = [
    "/",
    "/imoveis",
    "/imoveis/novo",
    "/imoveis/abc",
    "/imoveis/abc/editar",
    "/leads",
    "/leads/abc",
    "/contratos",
    "/contratos/abc",
    "/financeiro",
    "/configuracoes",
    "/design-system/colors",
    "/design-system/illustrations",
  ];

  for (const esquema of ["light", "dark"] as const) {
    for (const rota of ROTAS) {
      test(`${rota} sem violações de acessibilidade (${esquema}, RNF-02)`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: esquema });
        await page.goto(rota);
        await expect(page.locator("html")).toHaveClass(new RegExp(esquema));
        await aguardarCarregado(page);
        const { violations } = await new AxeBuilder({ page }).withTags(RESTRICOES_WCAG).analyze();
        expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
      });
    }
  }
});
