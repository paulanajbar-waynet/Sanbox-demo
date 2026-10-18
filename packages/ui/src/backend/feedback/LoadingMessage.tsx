export function LoadingMessage({ label = "Loading…" }: { label?: string }) {
  return (
    <p role="status" className="py-8 text-center text-sm text-muted-foreground">
      {label}
    </p>
  );
}
