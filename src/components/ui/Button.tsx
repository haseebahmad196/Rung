import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-[rgb(var(--accent))] text-black hover:opacity-90",
  secondary: "bg-white/5 border border-white/10 hover:bg-white/10",
  ghost: "hover:bg-white/5",
};

export function Button({
  variant = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={cn(base, variants[variant], className)} {...props} />
  );
}