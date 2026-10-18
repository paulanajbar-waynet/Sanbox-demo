import { apiHandler } from "@devmentor/core";

// Liveness only: must answer without a database, so it never touches the container.
export const GET = apiHandler(async () => ({ status: "ok" }));
