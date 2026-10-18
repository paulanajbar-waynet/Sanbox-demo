import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ApiError, CrudForm } from "../src";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Enter a valid email"),
  rate: z.number().positive().optional(),
});
const fields = [
  { name: "name", label: "Name" },
  { name: "email", label: "Email", type: "email" },
  { name: "rate", label: "Rate", type: "number" },
] as const;

function setup(props: Partial<Parameters<typeof CrudForm<typeof schema>>[0]> = {}) {
  const onSubmit = vi.fn(async () => undefined);
  const onCancel = vi.fn();
  render(<CrudForm schema={schema} fields={[...fields]} onSubmit={onSubmit} onCancel={onCancel} {...props} />);
  return { onSubmit, onCancel, user: userEvent.setup() };
}

describe("CrudForm", () => {
  it("validates on the client with the shared schema and does not submit", async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits parsed values, coercing numbers and dropping empty optional fields", async () => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByLabelText("Name"), "Ada");
    await user.type(screen.getByLabelText("Email"), "ada@example.test");
    await user.type(screen.getByLabelText("Rate"), "120");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Ada", email: "ada@example.test", rate: 120 });
  });

  it("shows server field errors next to the right field", async () => {
    const onSubmit = vi.fn(async () => {
      throw new ApiError(400, { code: "validation_error", message: "Invalid input", fieldErrors: { email: ["Already taken"] } });
    });
    const { user } = setup({ onSubmit, initialValues: { name: "Ada", email: "ada@example.test" } });
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Already taken")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid input");
  });

  it("submits on Ctrl+Enter and cancels on Escape", async () => {
    const { onSubmit, onCancel, user } = setup({ initialValues: { name: "Ada", email: "ada@example.test" } });
    await user.click(screen.getByLabelText("Name"));
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(onSubmit).toHaveBeenCalledOnce();

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
