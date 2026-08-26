import * as React from "react"

import { cn } from "@/lib/utils"

type GradientCardVariant = "default" | "amber" | "success" | "danger"

const gradients: Record<GradientCardVariant, string> = {
  default: "from-border via-primary/30 to-border",
  amber: "from-primary/70 via-amber-300/30 to-primary/10",
  success: "from-success/70 via-emerald-300/30 to-success/10",
  danger: "from-destructive/70 via-red-300/30 to-destructive/10",
}

function GradientCard({
  className,
  contentClassName,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: GradientCardVariant
  contentClassName?: string
}) {
  return (
    <div
      data-slot="gradient-card"
      className={cn(
        "rounded-[var(--radius-lg)] bg-gradient-to-br p-px transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]",
        gradients[variant],
        className
      )}
      {...props}
    >
      <div className={cn("h-full rounded-[calc(var(--radius-lg)-1px)] bg-card", contentClassName)}>
        {children}
      </div>
    </div>
  )
}

export { GradientCard }