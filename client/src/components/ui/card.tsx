import { type JSX } from "preact";
import { cn } from "@/lib/utils";

type DivProps = JSX.HTMLAttributes<HTMLDivElement>;

export function Card({ class: className, ...props }: DivProps) {
  return (
    <div
      class={cn("rounded-xl border bg-card text-card-foreground shadow", className)}
      {...props}
    />
  );
}

export function CardHeader({ class: className, ...props }: DivProps) {
  return <div class={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ class: className, ...props }: DivProps) {
  return <div class={cn("font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function CardDescription({ class: className, ...props }: DivProps) {
  return <div class={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ class: className, ...props }: DivProps) {
  return <div class={cn("p-6 pt-0", className)} {...props} />;
}
