/**
 * PendingItemExtension for Tiptap
 *
 * A custom Tiptap extension that highlights pending items in the draft
 * with a yellow/amber background. Pending items are marked with a data attribute
 * and styled using CSS classes.
 */

import { Mark } from '@tiptap/core'

export interface PendingItemOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pendingItem: {
      /**
       * Set a pending item mark
       */
      setPendingItem: (attributes?: { id: string; reason?: string; severity?: string }) => ReturnType
      /**
       * Toggle a pending item mark
       */
      togglePendingItem: (attributes?: { id: string; reason?: string; severity?: string }) => ReturnType
      /**
       * Unset a pending item mark
       */
      unsetPendingItem: () => ReturnType
    }
  }
}

export const PendingItem = Mark.create<PendingItemOptions>({
  name: 'pendingItem',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-pending-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {}
          }
          return {
            'data-pending-id': attributes.id,
          }
        },
      },
      reason: {
        default: null,
        parseHTML: element => element.getAttribute('data-pending-reason'),
        renderHTML: attributes => {
          if (!attributes.reason) {
            return {}
          }
          return {
            'data-pending-reason': attributes.reason,
          }
        },
      },
      severity: {
        default: 'warning',
        parseHTML: element => element.getAttribute('data-pending-severity') || 'warning',
        renderHTML: attributes => {
          return {
            'data-pending-severity': attributes.severity || 'warning',
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-pending-id]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...this.options.HTMLAttributes, ...HTMLAttributes, class: 'pending-item-highlight' }, 0]
  },

  addCommands() {
    return {
      setPendingItem:
        attributes =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes)
        },
      togglePendingItem:
        attributes =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes)
        },
      unsetPendingItem:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
    }
  },
})

export default PendingItem
