import { cn } from "@/lib/cn";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-[rgb(var(--muted))] focus:ring-2 focus:ring-[rgb(var(--accent))/0.4]",
        className
      )}
      {...props}
    />
  );
}