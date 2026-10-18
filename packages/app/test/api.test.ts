import { User, getOrm, type MikroORM } from "@devmentor/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { GET as health } from "../src/app/api/health/route";
import { GET as listUsers } from "../src/app/api/users/route";

let orm: MikroORM;
const createdIds: string[] = [];

beforeAll(async () => {
  orm = await getOrm();
});

afterAll(async () => {
  if (createdIds.length) await orm.em.fork().nativeDelete(User, { id: { $in: createdIds } });
  await orm.close();
});

describe("GET /api/health", () => {
  it("answers without touching the database", async () => {
    const res = await health(new Request("http://localhost/api/health"), {});
    expect(await res.json()).toEqual({ ok: true, data: { status: "ok" } });
  });
});

describe("GET /api/users", () => {
  it("returns a page of users in the envelope", async () => {
    const em = orm.em.fork();
    const user = em.create(User, { email: `test-api-${crypto.randomUUID()}@example.test`, name: "API test" });
    await em.flush();
    createdIds.push(user.id);

    const res = await listUsers(new Request("http://localhost/api/users?pageSize=100"), {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({ page: 1, pageSize: 100 });
    expect(body.data.items).toContainEqual({
      id: user.id,
      email: user.email,
      name: "API test",
      createdAt: user.createdAt.toISOString(),
    });
  });

  it("rejects an out-of-range page size", async () => {
    const res = await listUsers(new Request("http://localhost/api/users?pageSize=5000"), {});
    expect(res.status).toBe(400);
  });
});
