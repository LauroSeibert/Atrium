import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getPageItems, Pagination } from "./Pagination";

describe("Pagination", () => {
  it("chama onPageChange ao clicar em número e em próxima", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={2} pageCount={4} onPageChange={onPageChange} />);
    await user.click(screen.getByRole("button", { name: "Página 3" }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
  });

  it("desabilita anterior na primeira página e próxima na última", () => {
    const { rerender } = render(<Pagination page={1} pageCount={4} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    rerender(<Pagination page={4} pageCount={4} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeDisabled();
  });

  it("marca a página atual e mostra o resumo", () => {
    render(<Pagination page={1} pageCount={4} pageSize={12} total={48} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Página 1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Mostrando 1–12 de 48")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Paginação" })).toBeInTheDocument();
  });

  it("renderiza links com hrefBuilder", () => {
    render(<Pagination page={2} pageCount={3} hrefBuilder={(p) => `?p=${p}`} />);
    expect(screen.getByRole("link", { name: "Página 3" })).toHaveAttribute("href", "?p=3");
  });

  it("usa reticências em intervalos grandes", () => {
    expect(getPageItems(50, 100)).toEqual([1, "ellipsis-start", 49, 50, 51, "ellipsis-end", 100]);
    expect(getPageItems(1, 100)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 100]);
  });
});
