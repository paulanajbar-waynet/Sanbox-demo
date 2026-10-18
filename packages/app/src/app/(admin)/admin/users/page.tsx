import { Card, CardContent, CardHeader, CardTitle } from "@devmentor/ui";

import { UsersTable } from "./UsersTable";

export default function UsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent>
        <UsersTable />
      </CardContent>
    </Card>
  );
}
