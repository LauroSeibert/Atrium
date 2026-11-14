import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./Drawer";

function setup() {
  render(
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Ver lead</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Marina Albuquerque</DrawerTitle>
          <DrawerDescription>Visita agendada</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <Button>Registrar contato</Button>
        </DrawerBody>
      </DrawerContent>
    </Drawer>,
  );
}

describe("Drawer", () => {
  it("prende o foco (Tab e Shift+Tab ciclam) e Esc fecha devolvendo o foco ao gatilho", async () => {
    const user = userEvent.setup();
    setup();
    const trigger = screen.getByRole("button", { name: "Ver lead" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Marina Albuquerque" });

    const registrar = screen.getByRole("button", { name: "Registrar contato" });
    const fechar = screen.getByRole("button", { name: "Fechar" });
    // Foco inicial dentro do painel.
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    registrar.focus();
    await user.tab();
    expect(fechar).toHaveFocus();
    await user.tab();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(trigger).not.toHaveFocus();
    // Shift+Tab a partir do primeiro volta ao último, sem sair do painel.
    await user.tab({ shift: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(trigger).not.toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
