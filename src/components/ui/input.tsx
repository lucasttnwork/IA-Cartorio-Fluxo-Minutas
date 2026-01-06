import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border-2 border-gray-300 dark:border-gray-600",
          "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm",
          "px-4 py-2 text-base md:text-sm",
          "text-gray-900 dark:text-gray-100",
          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
          "shadow-sm hover:shadow-md",
          "transition-all duration-200 ease-in-out",
          "hover:border-blue-400 dark:hover:border-blue-500",
          "hover:bg-white dark:hover:bg-gray-800",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "focus:border-blue-500 dark:focus:border-blue-400",
          "focus:bg-white dark:focus:bg-gray-800",
          "focus:shadow-lg focus:shadow-blue-100 dark:focus:shadow-blue-900/20",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "disabled:bg-gray-100 dark:disabled:bg-gray-700",
          "disabled:border-gray-200 dark:disabled:border-gray-600",
          "disabled:text-gray-400 dark:disabled:text-gray-500",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
