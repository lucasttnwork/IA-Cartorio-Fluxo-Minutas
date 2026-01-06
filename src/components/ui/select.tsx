import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg border border-gray-300 dark:border-gray-600",
      "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
      "px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100",
      "shadow-sm hover:shadow-md transition-all duration-200",
      "hover:bg-white dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-transparent",
      "data-[placeholder]:text-gray-500 dark:data-[placeholder]:text-gray-400",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:shadow-none",
      "dark:disabled:bg-gray-800 dark:disabled:border-gray-700 dark:disabled:text-gray-500",
      "disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700",
      "[&>span]:line-clamp-1 [&>span]:text-left",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200 data-[state=open]:rotate-180" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1.5 text-gray-500 dark:text-gray-400",
      "hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-150",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1.5 text-gray-500 dark:text-gray-400",
      "hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-150",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-hidden",
        "rounded-lg border border-gray-200 dark:border-gray-700",
        "bg-white/95 dark:bg-gray-800/95 backdrop-blur-md",
        "text-gray-900 dark:text-gray-100",
        "shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        "origin-[--radix-select-content-transform-origin]",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-xs font-semibold uppercase tracking-wide",
      "text-gray-500 dark:text-gray-400",
      className
    )}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center gap-2",
      "rounded-md py-2 pl-3 pr-9 text-sm font-medium",
      "text-gray-700 dark:text-gray-300",
      "outline-none transition-colors duration-150",
      "hover:bg-gray-100 dark:hover:bg-gray-700/50",
      "focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:text-blue-700 dark:focus:text-blue-300",
      "data-[state=checked]:bg-blue-50 dark:data-[state=checked]:bg-blue-900/30",
      "data-[state=checked]:text-blue-700 dark:data-[state=checked]:text-blue-300",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText className="flex-1">{children}</SelectPrimitive.ItemText>
    <span className="absolute right-2 flex h-5 w-5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn(
      "-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-700",
      className
    )}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
