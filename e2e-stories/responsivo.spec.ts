import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * Gate 6: compostos responsivos em 360 / 768 / 1280 / 1920 px (RNF de reflow, WCAG 1.4.10).
 * A página da história não pode rolar na horizontal; tabelas e kanban rolam dentro do próprio contêiner.
 */
type Entry = { id: string; title: string; name: string; type: "story" | "docs"; tags?: string[] };
const index = JSON.parse(readFileSync("storybook-static/index.json", "utf8")) as { entries: Record<string, Entry> };
const stories = Object.values(index.entries).filter(
  (e) => e.type === "story" && e.title.startsWith("Padrões/") && !e.tags?.includes("skip-responsivo"),
);

const LARGURAS = [360, 768, 1280, 1920] as const;

for (const story of stories) {
  test(`${story.title} › ${story.name} sem rolagem horizontal`, async ({ page }) => {
    for (const largura of LARGURAS) {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
      await page.locator("#storybook-root").waitFor();
      await page.waitForTimeout(150);
      const { scroll, viewport } = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      }));
      expect(scroll, `${largura}px: largura do conteúdo ${scroll}px > ${viewport}px`).toBeLessThanOrEqual(viewport);
    }
  });
}
