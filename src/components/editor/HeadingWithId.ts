/**
 * HeadingWithId Extension
 *
 * Custom Tiptap extension that extends the default Heading extension
 * to automatically generate ID attributes based on heading text content.
 * This enables section navigation functionality.
 */

import Heading from '@tiptap/extension-heading'

export const HeadingWithId = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: element => element.getAttribute('id'),
        renderHTML: attributes => {
          if (attributes.id) {
            return { id: attributes.id }
          }
          return {}
        },
      },
    }
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const level = node.attrs.level
      const text = node.textContent || ''

      // Generate ID from text content
      const id = text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-\u00C0-\u017F]+/g, '') // Support Portuguese characters
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
        || `heading-${getPos()}`

      const dom = document.createElement(`h${level}`)
      dom.id = id
      dom.setAttribute('data-heading-level', String(level))

      // Add classes from attributes
      if (HTMLAttributes.class) {
        dom.className = HTMLAttributes.class
      }

      const contentDOM = document.createElement('span')
      dom.appendChild(contentDOM)

      return {
        dom,
        contentDOM,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'heading') return false
          if (updatedNode.attrs.level !== level) return false

          // Update ID when text changes
          const newText = updatedNode.textContent || ''
          const newId = newText
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-\u00C0-\u017F]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '')
            || `heading-${getPos()}`

          dom.id = newId
          return true
        },
      }
    }
  },
})
