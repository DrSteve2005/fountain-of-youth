import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-md bg-bg px-3 text-sm text-fg",
        "shadow-[var(--shadow-border)] outline-none",
        "placeholder:text-subtle",
        "transition-[box-shadow] duration-150 ease-out",
        "focus-visible:shadow-[0_0_0_1px_rgb(212_175_55_/_0.55),0_0_0_4px_rgb(212_175_55_/_0.16)]",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
