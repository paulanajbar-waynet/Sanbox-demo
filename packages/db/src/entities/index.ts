import { User } from "./auth/user.entity";

export { User };

/** Every entity must be listed here; discovery is explicit so it works in bundled code. */
export const entities = [User];
