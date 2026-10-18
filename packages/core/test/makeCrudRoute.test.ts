import { getOrm, type MikroORM } from "@devmentor/db";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { CSRF_HEADER, makeCrudRoute, NotFoundError, type UserDto } from "../src";
import { createUsers, deleteUsers } from "./helpers";

let orm: MikroORM;
const createdIds: string[] = [];
const base = "http://localhost/api/things";
const ID = "8f2b3c4d-1e2f-4a5b-8c7d-9e0f1a2b3c4d";

beforeAll(async () => {
  orm = await getOrm();
});

afterAll(async () => {
  await deleteUsers(orm.em.fork(), createdIds);
  await orm.close();
});

describe("makeCrudRoute with a real service", () => {
  const { GET } = makeCrudRoute({
    service: (scope) => scope.resolve("userService"),
    list: (service, query) => service.list(query),
  });

  it("lists through the request-scoped service", async () => {
    const users = await createUsers(orm.em.fork(), ["crud"]);
    createdIds.push(...users.map((u) => u.id));

    const res = await GET(new Request(`${base}?pageSize=100`), {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.pageSize).toBe(100);
    expect(body.data.items.map((u: UserDto) => u.id)).toContain(users[0].id);
  });

  it("answers 405 for methods that were not configured", async () => {
    const { POST } = makeCrudRoute({
      service: (scope) => scope.resolve("userService"),
      list: (service, query) => service.list(query),
    });
    const res = await POST(new Request(base, { method: "POST", headers: { [CSRF_HEADER]: "1" } }), {});
    expect(res.status).toBe(405);
  });

  it("returns 400 with field errors for an invalid page size", async () => {
    const res = await GET(new Request(`${base}?pageSize=1000`), {});
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.fieldErrors.pageSize).toBeDefined();
  });
});

describe("makeCrudRoute write operations", () => {
  const thingSchema = z.object({ name: z.string().min(1) });
  const service = {
    create: vi.fn(async (input: { name: string }) => ({ id: ID, ...input })),
    update: vi.fn(async (id: string, input: { name: string }) => ({ id, ...input })),
    remove: vi.fn(async (id: string) => {
      if (id !== ID) throw new NotFoundError();
    }),
  };
  const { POST, PUT, DELETE } = makeCrudRoute({
    service: () => service,
    create: { schema: thingSchema, run: (s, input) => s.create(input) },
    update: { schema: thingSchema, run: (s, id, input) => s.update(id, input) },
    remove: (s, id) => s.remove(id),
  });
  const write = (method: string, qs: string, body?: object) =>
    new Request(`${base}${qs}`, {
      method,
      headers: { [CSRF_HEADER]: "1" },
      body: body ? JSON.stringify(body) : undefined,
    });

  it("creates with 201 and passes only schema output to the service", async () => {
    const res = await POST(write("POST", "", { name: "Ada", id: "smuggled" }), {});
    expect(res.status).toBe(201);
    expect(service.create).toHaveBeenCalledWith({ name: "Ada" });
  });

  it("updates by ?id=", async () => {
    const res = await PUT(write("PUT", `?id=${ID}`, { name: "Grace" }), {});
    expect(res.status).toBe(200);
    expect(service.update).toHaveBeenCalledWith(ID, { name: "Grace" });
  });

  it("rejects a non-UUID id", async () => {
    const res = await DELETE(write("DELETE", "?id=1"), {});
    expect(res.status).toBe(400);
  });

  it("maps service errors from delete", async () => {
    const res = await DELETE(write("DELETE", "?id=00000000-0000-4000-8000-000000000000"), {});
    expect(res.status).toBe(404);
  });

  it("deletes and returns null data", async () => {
    const res = await DELETE(write("DELETE", `?id=${ID}`), {});
    expect(await res.json()).toEqual({ ok: true, data: null });
  });
});
