// MikroORM CLI configuration (migrations). Not imported by the app.
import { Migrator } from "@mikro-orm/migrations";

import { createOrmConfig } from "./config";

export default createOrmConfig({
  extensions: [Migrator],
  migrations: {
    path: "./src/migrations",
    glob: "!(*.d).{js,ts}",
    emit: "ts",
    // Fixed name, so the snapshot does not depend on the database name of the environment.
    snapshotName: ".snapshot-devmentor",
  },
});
