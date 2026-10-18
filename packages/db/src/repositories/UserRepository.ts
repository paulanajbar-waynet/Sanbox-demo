import type { EntityManager } from "@mikro-orm/postgresql";

import { User } from "../entities";

export class UserRepository {
  private readonly em: EntityManager;

  constructor({ em }: { em: EntityManager }) {
    this.em = em;
  }

  count(): Promise<number> {
    return this.em.count(User);
  }
}
