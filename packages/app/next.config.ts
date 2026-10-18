import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // MikroORM loads drivers dynamically; keep it out of the server bundle.
  // (@mikro-orm/core is already on Next's built-in list.)
  serverExternalPackages: ["@mikro-orm/postgresql", "@mikro-orm/sql"],
};

export default nextConfig;
