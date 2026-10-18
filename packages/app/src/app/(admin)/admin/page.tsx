import { Card, CardDescription, CardHeader, CardTitle } from "@devmentor/ui";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link href="/admin/users" className="rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
        <Card className="transition-colors hover:bg-accent">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Registered accounts</CardDescription>
          </CardHeader>
        </Card>
      </Link>
    </div>
  );
}
