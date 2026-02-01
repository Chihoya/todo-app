"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Square, SquareCheck } from "lucide-react";

import { cn } from "./utils";

function Checkbox({
  className,
  checked,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      checked={checked}
      className={cn(
        "peer shrink-0 transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {checked ? (
        <SquareCheck className="size-5 text-[#666a6e]" />
      ) : (
        <Square className="size-5 text-[#666a6e]" />
      )}
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };