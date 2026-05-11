import { type JSX } from "preact";
import { cn } from "@/lib/utils";

type SliderProps = Omit<JSX.HTMLAttributes<HTMLInputElement>, "onChange"> & {
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
};

export function Slider({ class: className, onChange, ...props }: SliderProps) {
  return (
    <input
      type="range"
      class={cn(
        "w-full h-2 rounded-lg appearance-none cursor-pointer bg-secondary accent-primary",
        className,
      )}
      onInput={(e) => onChange?.(Number((e.target as HTMLInputElement).value))}
      {...props}
    />
  );
}
