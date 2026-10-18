import type { MikroORM } from "@mikro-orm/postgresql";
import { createContainer } from "awilix";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { registerDb, User, type DbCradle } from "../src";
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

describe("registerDb", () => {
  it("gives each request scope its own forked EntityManager", () => {
    const container = createContainer<DbCradle>();
    registerDb(container, orm);

    const a = container.createScope<DbCradle>();
    const b = container.createScope<DbCradle>();

    expect(a.resolve("em")).toBe(a.resolve("em"));
    expect(a.resolve("em")).not.toBe(b.resolve("em"));
    expect(a.resolve("em")).not.toBe(orm.em);
    expect(container.resolve("orm")).toBe(orm);
  });
});

describe("UserRepository", () => {
  it("counts users", async () => {
    const container = createContainer<DbCradle>();
    registerDb(container, orm);
    const before = await container.createScope<DbCradle>().resolve("userRepository").count();

    const em = orm.em.fork();
    const users = ["a", "b"].map((label) => em.create(User, { email: uniqueEmail(label), name: `Test ${label}` }));
    await em.flush();
    createdIds.push(...users.map((u) => u.id));

    const after = await container.createScope<DbCradle>().resolve("userRepository").count();
    expect(after).toBe(before + 2);
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
