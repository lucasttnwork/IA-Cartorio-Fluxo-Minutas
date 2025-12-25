/**
 * InlineEditExtension
 *
 * A Tiptap extension that marks editable fields in the draft.
 * Fields can be edited inline with a double-click interaction.
 */

import { Mark, mergeAttributes } from '@tiptap/core'

export interface InlineEditOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineEdit: {
      /**
       * Set an inline editable field
       */
      setInlineEdit: (attributes: { fieldPath: string; fieldType: string }) => ReturnType
      /**
       * Toggle an inline editable field
       */
      toggleInlineEdit: (attributes: { fieldPath: string; fieldType: string }) => ReturnType
      /**
       * Unset an inline editable field
       */
      unsetInlineEdit: () => ReturnType
    }
  }
}

export const InlineEdit = Mark.create<InlineEditOptions>({
  name: 'inlineEdit',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      fieldPath: {
        default: null,
        parseHTML: element => element.getAttribute('data-field-path'),
        renderHTML: attributes => {
          if (!attributes.fieldPath) {
            return {}
          }

          return {
            'data-field-path': attributes.fieldPath,
          }
        },
      },
      fieldType: {
        default: 'text',
        parseHTML: element => element.getAttribute('data-field-type'),
        renderHTML: attributes => {
          if (!attributes.fieldType) {
            return {}
          }

          return {
            'data-field-type': attributes.fieldType,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-field-path]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: 'inline-edit-field',
          style: 'cursor: pointer; border-bottom: 2px dotted rgba(59, 130, 246, 0.5); transition: all 0.2s;'
        }
      ),
      0,
    ]
  },

  addCommands() {
    return {
      setInlineEdit:
        attributes =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes)
        },
      toggleInlineEdit:
        attributes =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes)
        },
      unsetInlineEdit:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
    }
  },
})

export default InlineEdit
