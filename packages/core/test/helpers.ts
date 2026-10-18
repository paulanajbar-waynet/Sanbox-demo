import { User, type EntityManager } from "@devmentor/db";

export const uniqueEmail = (label: string) => `test-${label}-${crypto.randomUUID()}@example.test`;

/** Creates users in their own EntityManager and returns them; the caller deletes them in teardown. */
export async function createUsers(em: EntityManager, labels: string[]): Promise<User[]> {
  const users = labels.map((label) => em.create(User, { email: uniqueEmail(label), name: `Test ${label}` }));
  await em.flush();
  return users;
}

export async function deleteUsers(em: EntityManager, ids: string[]): Promise<void> {
  if (ids.length) await em.nativeDelete(User, { id: { $in: ids } });
}
