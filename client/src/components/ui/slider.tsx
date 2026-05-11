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
        "w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-purple-500 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(168,85,247,0.5)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-0",
        className,
      )}
      onInput={(e) => onChange?.(Number((e.target as HTMLInputElement).value))}
      {...props}
    />
  );
}
