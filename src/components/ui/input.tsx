import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

export type InputProps = React.ComponentProps<"input"> & {
  variant?: "default" | "pill"
}

function Input({
  className,
  type,
  variant = "default",
  ...props
}: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-border/80 bg-muted/60 px-2.5 py-1 text-base text-foreground/80 transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 hover:bg-muted/70 focus-visible:border-ring focus-visible:bg-background focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:border-input dark:bg-input/30 dark:text-foreground/85 dark:hover:bg-input/40 dark:focus-visible:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        variant === "pill" &&
          "h-9 rounded-full border-border/80 bg-muted/50 px-3.5 text-sm text-foreground/80 shadow-sm hover:bg-muted/65 focus-visible:bg-background focus-visible:text-foreground focus-visible:ring-2",
        className
      )}
      {...props}
    />
  )
}

export { Input }
