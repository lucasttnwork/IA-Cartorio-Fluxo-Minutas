import * as React from "react"
import { Tab } from "@headlessui/react"
import { cn } from "@/lib/utils"

// TabGroup component
const TabGroup = React.forwardRef<
  React.ElementRef<typeof Tab.Group>,
  React.ComponentPropsWithoutRef<typeof Tab.Group>
>(({ className, ...props }, ref) => (
  <Tab.Group ref={ref} className={cn("w-full", className)} {...props} />
))
TabGroup.displayName = "TabGroup"

// TabList component
const TabList = React.forwardRef<
  React.ElementRef<typeof Tab.List>,
  React.ComponentPropsWithoutRef<typeof Tab.List>
>(({ className, ...props }, ref) => (
  <Tab.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full",
      className
    )}
    {...props}
  />
))
TabList.displayName = "TabList"

// TabTrigger component (individual tab button)
const TabTrigger = React.forwardRef<
  React.ElementRef<typeof Tab>,
  React.ComponentPropsWithoutRef<typeof Tab>
>(({ className, children, ...props }, ref) => (
  <Tab
    ref={ref}
    className={({ selected }) =>
      cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        selected
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
        className
      )
    }
    {...props}
  >
    {children}
  </Tab>
))
TabTrigger.displayName = "TabTrigger"

// TabPanels component
const TabPanels = React.forwardRef<
  React.ElementRef<typeof Tab.Panels>,
  React.ComponentPropsWithoutRef<typeof Tab.Panels>
>(({ className, ...props }, ref) => (
  <Tab.Panels
    ref={ref}
    className={cn("mt-2 w-full", className)}
    {...props}
  />
))
TabPanels.displayName = "TabPanels"

// TabPanel component
const TabPanel = React.forwardRef<
  React.ElementRef<typeof Tab.Panel>,
  React.ComponentPropsWithoutRef<typeof Tab.Panel>
>(({ className, ...props }, ref) => (
  <Tab.Panel
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabPanel.displayName = "TabPanel"

export { TabGroup, TabList, TabTrigger, TabPanels, TabPanel }
