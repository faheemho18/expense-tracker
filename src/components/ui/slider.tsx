"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, min = 0, orientation = "horizontal", disabled = false, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-auto select-none items-center data-[orientation=vertical]:flex-col data-[orientation=vertical]:h-full data-[orientation=vertical]:w-5",
      className
    )}
    orientation={orientation}
    min={min}
    disabled={disabled}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2 md:h-3">
      <SliderPrimitive.Range className="absolute h-full bg-primary data-[orientation=vertical]:w-full data-[orientation=vertical]:h-auto" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 md:h-6 md:w-6 cursor-grab active:cursor-grabbing data-[disabled]:cursor-not-allowed"
      data-testid="slider-thumb"
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
