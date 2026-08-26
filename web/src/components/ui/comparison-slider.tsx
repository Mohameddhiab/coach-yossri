"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function ComparisonSlider({
  before,
  after,
  beforeLabel = "قبل",
  afterLabel = "بعد",
  className,
}: {
  before: string
  after: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
}) {
  const [position, setPosition] = React.useState(50)

  return (
    <div className={cn("relative aspect-[4/3] overflow-hidden rounded-xl bg-muted", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-y-0 start-0 overflow-hidden" style={{ width: `${position}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before}
          alt={beforeLabel}
          className="h-full max-w-none object-cover"
          style={{ width: position ? `${100 / (position / 100)}%` : "100%" }}
          loading="lazy"
        />
      </div>
      <span className="absolute start-3 top-3 rounded-full bg-background/80 px-2 py-1 text-xs font-semibold backdrop-blur">
        {beforeLabel}
      </span>
      <span className="absolute end-3 top-3 rounded-full bg-background/80 px-2 py-1 text-xs font-semibold backdrop-blur">
        {afterLabel}
      </span>
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label="مقارنة قبل وبعد"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.12)]"
        style={{ insetInlineStart: `${position}%` }}
      >
        <span className="absolute top-1/2 start-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-black text-primary-foreground shadow-lg">
          ↔
        </span>
      </div>
    </div>
  )
}

export { ComparisonSlider }