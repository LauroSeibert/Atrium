import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./Dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "./Drawer";

describe("Dialog", () => {
  it("abre, tem nome acessível, Esc fecha e o foco volta ao gatilho", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Agendar visita</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar visita</DialogTitle>
            <DialogDescription>Escolha o horário.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Agendar visita" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Agendar visita" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("botão Fechar fecha o diálogo", async () => {
    const user = userEvent.setup();
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Título</DialogTitle>
          <DialogDescription>Descrição</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Drawer", () => {
  it("Esc fecha e devolve o foco ao gatilho", async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <DrawerTrigger asChild>
          <Button>Ver lead</Button>
        </DrawerTrigger>
        <DrawerContent aria-describedby={undefined}>
          <DrawerTitle>Marina Albuquerque</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    const trigger = screen.getByRole("button", { name: "Ver lead" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Marina Albuquerque" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
