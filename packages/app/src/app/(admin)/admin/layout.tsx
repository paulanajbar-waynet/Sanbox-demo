import type { ReactNode } from "react";

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-6 font-semibold">DevMentor admin</div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
