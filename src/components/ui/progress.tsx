"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: "default" | "success" | "warning" | "error" | "gradient"
  size?: "sm" | "md" | "lg"
  showGlow?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "default", size = "md", showGlow = false, ...props }, ref) => {
  // Size classes
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  }

  // Track (background) classes based on variant
  const trackClasses = {
    default: "bg-gray-200 dark:bg-gray-700",
    success: "bg-green-100 dark:bg-green-900/30",
    warning: "bg-yellow-100 dark:bg-yellow-900/30",
    error: "bg-red-100 dark:bg-red-900/30",
    gradient: "bg-gray-200 dark:bg-gray-700",
  }

  // Indicator (bar) classes based on variant
  const indicatorClasses = {
    default: "bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500",
    success: "bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500",
    warning: "bg-gradient-to-r from-yellow-500 to-amber-600 dark:from-yellow-400 dark:to-amber-500",
    error: "bg-gradient-to-r from-red-500 to-rose-600 dark:from-red-400 dark:to-rose-500",
    gradient: "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400",
  }

  // Glow effect classes
  const glowClasses = {
    default: "shadow-[0_0_8px_rgba(59,130,246,0.5)] dark:shadow-[0_0_8px_rgba(96,165,250,0.5)]",
    success: "shadow-[0_0_8px_rgba(34,197,94,0.5)] dark:shadow-[0_0_8px_rgba(74,222,128,0.5)]",
    warning: "shadow-[0_0_8px_rgba(234,179,8,0.5)] dark:shadow-[0_0_8px_rgba(250,204,21,0.5)]",
    error: "shadow-[0_0_8px_rgba(239,68,68,0.5)] dark:shadow-[0_0_8px_rgba(248,113,113,0.5)]",
    gradient: "shadow-[0_0_12px_rgba(168,85,247,0.6)] dark:shadow-[0_0_12px_rgba(192,132,252,0.6)]",
  }

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative w-full overflow-hidden rounded-full",
        sizeClasses[size],
        trackClasses[variant],
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-all duration-500 ease-out",
          indicatorClasses[variant],
          showGlow && glowClasses[variant]
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
