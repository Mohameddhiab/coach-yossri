import * as React from "react"

import { cn } from "@/lib/utils"

function StaggeredList({
  children,
  className,
  delay = 50,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <div className={cn(className)}>
      {React.Children.map(children, (child, index) => (
        <div
          className="animate-slide-up"
          style={{ animationDelay: `${index * delay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

export { StaggeredList }