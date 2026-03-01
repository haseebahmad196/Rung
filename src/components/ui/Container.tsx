import { cn } from "@/lib/cn";

export function Container({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-3xl px-4 py-4", className)}
      {...props}
    />
  );
}