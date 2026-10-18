import type { MikroORM } from "@mikro-orm/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { User } from "../src";
import { initTestOrm, uniqueEmail } from "./helpers";

let orm: MikroORM;
const createdIds: string[] = [];

beforeAll(async () => {
  orm = await initTestOrm();
});

afterAll(async () => {
  if (createdIds.length) {
    await orm.em.fork().nativeDelete(User, { id: { $in: createdIds } });
  }
  await orm?.close();
});

describe("migrations", () => {
  it("leave no difference between entities and the database schema", async () => {
    expect(await orm.migrator.checkSchema()).toBe(false);
  });
});

describe("User entity", () => {
  it("gets a UUID id and creation time from the base properties", async () => {
    const em = orm.em.fork();
    const user = em.create(User, { email: uniqueEmail("base"), name: "Base" });
    await em.flush();
    createdIds.push(user.id);

    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it("rejects duplicate emails", async () => {
    const email = uniqueEmail("dup");
    const em = orm.em.fork();
    const first = em.create(User, { email, name: "First" });
    await em.flush();
    createdIds.push(first.id);

    const em2 = orm.em.fork();
    em2.create(User, { email, name: "Second" });
    await expect(em2.flush()).rejects.toThrow();
  });
});
