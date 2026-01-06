import { Toaster as Sonner } from "sonner"

interface ToasterProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center"
  expand?: boolean
  richColors?: boolean
  closeButton?: boolean
}

export function Toaster({
  position = "top-right",
  expand = false,
  richColors = true,
  closeButton = true,
  ...props
}: ToasterProps) {
  return (
    <Sonner
      position={position}
      expand={expand}
      richColors={richColors}
      closeButton={closeButton}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast glass-card group-[.toaster]:bg-white/90 group-[.toaster]:dark:bg-gray-900/90 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border-white/20 group-[.toaster]:dark:border-gray-700/50 group-[.toaster]:shadow-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error:
            "group-[.toaster]:bg-red-50/90 group-[.toaster]:dark:bg-red-950/90 group-[.toaster]:border-red-200/50 group-[.toaster]:dark:border-red-800/50 group-[.toaster]:text-red-900 group-[.toaster]:dark:text-red-100",
          success:
            "group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-green-50/95 group-[.toaster]:to-emerald-50/90 group-[.toaster]:dark:from-green-950/95 group-[.toaster]:dark:to-emerald-950/90 group-[.toaster]:border-green-300/60 group-[.toaster]:dark:border-green-700/60 group-[.toaster]:text-green-900 group-[.toaster]:dark:text-green-100 group-[.toaster]:shadow-green-100/50 group-[.toaster]:dark:shadow-green-900/30 group-[.toaster]:ring-1 group-[.toaster]:ring-green-200/50 group-[.toaster]:dark:ring-green-800/50",
          warning:
            "group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-amber-50/95 group-[.toaster]:to-orange-50/90 group-[.toaster]:dark:from-amber-950/95 group-[.toaster]:dark:to-orange-950/90 group-[.toaster]:border-amber-300/60 group-[.toaster]:dark:border-amber-700/60 group-[.toaster]:text-amber-900 group-[.toaster]:dark:text-amber-100 group-[.toaster]:shadow-amber-100/50 group-[.toaster]:dark:shadow-amber-900/30 group-[.toaster]:ring-1 group-[.toaster]:ring-amber-200/50 group-[.toaster]:dark:ring-amber-800/50",
          info:
            "group-[.toaster]:bg-blue-50/90 group-[.toaster]:dark:bg-blue-950/90 group-[.toaster]:border-blue-200/50 group-[.toaster]:dark:border-blue-800/50 group-[.toaster]:text-blue-900 group-[.toaster]:dark:text-blue-100",
        },
      }}
      {...props}
    />
  )
}
