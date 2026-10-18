import { User, type EntityManager } from "@devmentor/db";

import type { Page, PageQuery } from "../../http/pagination";

/** What leaves the service: explicit fields only, so new entity columns never leak by accident. */
export interface UserDto {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

const toUserDto = (user: User): UserDto => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt.toISOString(),
});

export class UserService {
  private readonly em: EntityManager;

  constructor({ em }: { em: EntityManager }) {
    this.em = em;
  }

  async list({ page, pageSize }: PageQuery): Promise<Page<UserDto>> {
    const [users, total] = await this.em.findAndCount(
      User,
      {},
      { orderBy: { createdAt: "desc", id: "asc" }, limit: pageSize, offset: (page - 1) * pageSize },
    );
    return { items: users.map(toUserDto), total, page, pageSize };
  }
}
