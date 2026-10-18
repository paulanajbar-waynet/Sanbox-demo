import { getOrm, type MikroORM } from "@devmentor/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserService } from "../src";
import { createUsers, deleteUsers } from "./helpers";

let orm: MikroORM;
const createdIds: string[] = [];

beforeAll(async () => {
  orm = await getOrm();
});

afterAll(async () => {
  await deleteUsers(orm.em.fork(), createdIds);
  await orm.close();
});

describe("UserService.list", () => {
  it("pages users newest first and returns DTOs with explicit fields only", async () => {
    const users = await createUsers(orm.em.fork(), ["one", "two", "three"]);
    createdIds.push(...users.map((u) => u.id));
    const service = new UserService({ em: orm.em.fork() });

    const all = await service.list({ page: 1, pageSize: 100 });
    const ours = all.items.filter((u) => createdIds.includes(u.id));
    expect(ours).toHaveLength(3);
    expect(Object.keys(ours[0]).sort()).toEqual(["createdAt", "email", "id", "name"]);
    expect(typeof ours[0].createdAt).toBe("string");

    const firstPage = await service.list({ page: 1, pageSize: 2 });
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.total).toBe(all.total);
    expect(firstPage.items[0].createdAt >= firstPage.items[1].createdAt).toBe(true);
  });
});
