import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@devmentor/ui";
import { connection } from "next/server";

import { withRequestScope } from "@/server/container";

// Backend page: shadcn/ui components from @devmentor/ui.
export default async function AdminDashboard() {
  await connection();
  const userCount = await withRequestScope((scope) => scope.resolve("userRepository").count());

  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Registered accounts</CardDescription>
      </CardHeader>
      <CardContent className="text-4xl font-semibold">{userCount}</CardContent>
    </Card>
  );
}
