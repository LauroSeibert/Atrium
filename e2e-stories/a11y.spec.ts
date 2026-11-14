import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

type Entry = { id: string; title: string; name: string; type: "story" | "docs"; tags?: string[] };
const index = JSON.parse(readFileSync("storybook-static/index.json", "utf8")) as { entries: Record<string, Entry> };
const stories = Object.values(index.entries).filter((e) => e.type === "story" && !e.tags?.includes("skip-a11y"));

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const story of stories) {
  for (const theme of ["light", "dark"] as const) {
    test(`${story.title} › ${story.name} (${theme === "light" ? "claro" : "escuro"})`, async ({ page }) => {
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`);
      await page.locator("#storybook-root").waitFor();
      await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`));
      const { violations } = await new AxeBuilder({ page })
        .include("#storybook-root")
        .withTags(WCAG)
        // Histórias isoladas não têm landmarks/título de página: regras de página ficam para o e2e do app.
        .disableRules(["region", "landmark-one-main", "page-has-heading-one"])
        .analyze();
      expect(
        violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
      ).toEqual([]);
    });
  }
}
