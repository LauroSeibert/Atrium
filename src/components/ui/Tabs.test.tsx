import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";

function Exemplo() {
  return (
    <Tabs defaultValue="geral">
      <TabsList aria-label="Seções do imóvel">
        <TabsTrigger value="geral">Visão geral</TabsTrigger>
        <TabsTrigger value="comodos">Cômodos</TabsTrigger>
        <TabsTrigger value="leads" count={4}>
          Leads
        </TabsTrigger>
      </TabsList>
      <TabsContent value="geral">Painel geral</TabsContent>
      <TabsContent value="comodos">Painel cômodos</TabsContent>
      <TabsContent value="leads">Painel leads</TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("setas movem o foco entre abas e ativam (Home/End incluídos)", async () => {
    const user = userEvent.setup();
    render(<Exemplo />);
    await user.tab();
    expect(screen.getByRole("tab", { name: "Visão geral" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Cômodos" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Cômodos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Painel cômodos")).toBeVisible();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: /Leads/ })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Visão geral" })).toHaveFocus();
  });

  it("exibe contagem no rótulo", () => {
    render(<Exemplo />);
    expect(screen.getByRole("tab", { name: "Leads (4)" })).toBeInTheDocument();
  });
});
