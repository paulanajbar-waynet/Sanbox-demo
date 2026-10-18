import { getOrm } from "@devmentor/db";
import { afterAll, describe, expect, it, vi } from "vitest";

import { getContainer, logger, UserService, withScope } from "../src";

afterAll(async () => {
  await (await getOrm()).close();
});

describe("container", () => {
  it("registers explicit singletons and scoped services", async () => {
    const root = await getContainer();
    expect(root.resolve("logger")).toBe(logger);
    expect(root.resolve("orm")).toBe(await getOrm());

    await withScope(async (scope) => {
      expect(scope.resolve("userService")).toBeInstanceOf(UserService);
      expect(scope.resolve("userService")).toBe(scope.resolve("userService"));
    });
  });
});

describe("withScope", () => {
  it("gives every scope its own EntityManager, never the global one", async () => {
    const first = await withScope(async (scope) => scope.resolve("em"));
    const second = await withScope(async (scope) => scope.resolve("em"));
    expect(first).not.toBe(second);
    expect(first).not.toBe((await getOrm()).em);
  });

  it("disposes the scope even when the callback throws", async () => {
    const root = await getContainer();
    const createScope = root.createScope.bind(root);
    let dispose: ReturnType<typeof vi.fn> | undefined;
    const spy = vi.spyOn(root, "createScope").mockImplementation(() => {
      const scope = createScope();
      dispose = vi.spyOn(scope, "dispose") as unknown as ReturnType<typeof vi.fn>;
      return scope;
    });

    await expect(
      withScope(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(dispose).toHaveBeenCalledOnce();

    spy.mockRestore();
  });
});
