import { type JSX } from "preact";
import { cn } from "@/lib/utils";

type LabelProps = JSX.HTMLAttributes<HTMLLabelElement>;

export function Label({ class: className, ...props }: LabelProps) {
  return (
    <label
      class={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
