/**
 * Clipboard Utility
 *
 * Provides functions for copying text to the clipboard with user feedback.
 */

import { toast } from 'sonner'

/**
 * Copy text to clipboard
 * @param text - The text to copy
 * @param fieldLabel - Optional label for the field being copied (for toast message)
 * @returns Promise<boolean> - True if copy was successful
 */
export async function copyToClipboard(
  text: string,
  fieldLabel?: string
): Promise<boolean> {
  // Return early if no text to copy
  if (!text || text === '-' || text.trim() === '') {
    toast.error('Nenhum valor para copiar')
    return false
  }

  try {
    // Check if Clipboard API is available
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)

      // Show success toast
      const message = fieldLabel
        ? `${fieldLabel} copiado!`
        : 'Copiado para a área de transferência!'

      toast.success(message, {
        duration: 2000,
      })

      return true
    } else {
      // Fallback for non-secure contexts or older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const successful = document.execCommand('copy')
      textArea.remove()

      if (successful) {
        const message = fieldLabel
          ? `${fieldLabel} copiado!`
          : 'Copiado para a área de transferência!'

        toast.success(message, {
          duration: 2000,
        })
        return true
      } else {
        throw new Error('Failed to copy using fallback method')
      }
    }
  } catch (error) {
    console.error('Failed to copy text:', error)
    toast.error('Erro ao copiar texto')
    return false
  }
}

/**
 * Check if clipboard API is available
 * @returns boolean
 */
export function isClipboardSupported(): boolean {
  return !!(navigator.clipboard && window.isSecureContext) ||
         document.queryCommandSupported?.('copy')
}
