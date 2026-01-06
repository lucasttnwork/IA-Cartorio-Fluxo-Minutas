import { toast as sonnerToast } from "sonner"

export const toast = sonnerToast

// Convenience methods with descriptive names
export const showToast = {
  success: (message: string, description?: string) => {
    return toast.success(message, { description })
  },
  error: (message: string, description?: string) => {
    return toast.error(message, { description })
  },
  warning: (message: string, description?: string) => {
    return toast.warning(message, { description })
  },
  info: (message: string, description?: string) => {
    return toast.info(message, { description })
  },
  message: (message: string, description?: string) => {
    return toast.message(message, { description })
  },
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, { loading, success, error })
  },
}
