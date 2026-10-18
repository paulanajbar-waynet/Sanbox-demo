import { defineEntity, p } from "@mikro-orm/postgresql";

import { baseProperties } from "../base.entity";

export const UserSchema = defineEntity({
  name: "User",
  tableName: "users",
  properties: {
    ...baseProperties,
    email: p.string().unique(),
    name: p.string(),
  },
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
