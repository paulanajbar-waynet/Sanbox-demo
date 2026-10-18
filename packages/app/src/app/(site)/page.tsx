import Link from "next/link";

// Frontend page: plain Tailwind.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-6 px-6">
      <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">DevMentor</p>
      <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
        Grow as a developer, with a mentor at your side.
      </h1>
      <p className="text-lg text-neutral-600">
        The app is being built. This page is the public frontend; the back office lives under{" "}
        <Link href="/admin" className="font-medium text-neutral-900 underline underline-offset-4">
          /admin
        </Link>
        .
      </p>
    </main>
  );
}
