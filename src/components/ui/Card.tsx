import { cn } from "@/lib/cn";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-[rgb(var(--card))] p-4 shadow-sm",
        className
      )}
      {...props}
    />
  );
}