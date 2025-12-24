/**
 * TiptapEditor Component
 *
 * A rich text editor built with Tiptap featuring a comprehensive toolbar
 * with formatting options.
 *
 * Features:
 * - Text formatting (bold, italic, underline, strikethrough)
 * - Headings (H1, H2, H3)
 * - Lists (bullet and numbered)
 * - Text alignment
 * - Code blocks and inline code
 * - Blockquotes
 * - Horizontal rules
 * - Undo/Redo
 * - Dark mode support
 */

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { PendingItem } from './PendingItemExtension'
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  CodeBracketIcon,
  ListBulletIcon,
  Bars3BottomLeftIcon,
  ChatBubbleBottomCenterTextIcon,
  MinusIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from '@heroicons/react/24/outline'
import type { PendingItem as PendingItemType } from '../../types'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface TiptapEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
  pendingItems?: PendingItemType[]
}

// -----------------------------------------------------------------------------
// Toolbar Button Component
// -----------------------------------------------------------------------------

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  icon: React.ReactNode
  title: string
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  icon,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded-md transition-colors
        ${
          isActive
            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="w-5 h-5">{icon}</div>
    </button>
  )
}

// -----------------------------------------------------------------------------
// Toolbar Divider Component
// -----------------------------------------------------------------------------

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
}

// -----------------------------------------------------------------------------
// Toolbar Component
// -----------------------------------------------------------------------------

interface ToolbarProps {
  editor: any
}

function Toolbar({ editor }: ToolbarProps) {
  if (!editor) {
    return null
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 flex items-center gap-1 flex-wrap">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        icon={<ArrowUturnLeftIcon className="w-5 h-5" />}
        title="Desfazer (Ctrl+Z)"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        icon={<ArrowUturnRightIcon className="w-5 h-5" />}
        title="Refazer (Ctrl+Shift+Z)"
      />

      <ToolbarDivider />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        icon={<BoldIcon className="w-5 h-5" />}
        title="Negrito (Ctrl+B)"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        icon={<ItalicIcon className="w-5 h-5" />}
        title="Itálico (Ctrl+I)"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        icon={<StrikethroughIcon className="w-5 h-5" />}
        title="Tachado"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        icon={<CodeBracketIcon className="w-5 h-5" />}
        title="Código inline"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        icon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10M9 21V6a2 2 0 012-2h2a2 2 0 012 2v15M9 12h6"
            />
          </svg>
        }
        title="Destacar"
      />

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        icon={<span className="font-bold text-sm">H1</span>}
        title="Título 1"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        icon={<span className="font-bold text-sm">H2</span>}
        title="Título 2"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        icon={<span className="font-bold text-sm">H3</span>}
        title="Título 3"
      />

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        icon={<ListBulletIcon className="w-5 h-5" />}
        title="Lista com marcadores"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        icon={<Bars3BottomLeftIcon className="w-5 h-5" />}
        title="Lista numerada"
      />

      <ToolbarDivider />

      {/* Code Block */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        icon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        }
        title="Bloco de código"
      />

      {/* Blockquote */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        icon={<ChatBubbleBottomCenterTextIcon className="w-5 h-5" />}
        title="Citação"
      />

      {/* Horizontal Rule */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        icon={<MinusIcon className="w-5 h-5" />}
        title="Linha horizontal"
      />
    </div>
  )
}

// -----------------------------------------------------------------------------
// TiptapEditor Component
// -----------------------------------------------------------------------------

export function TiptapEditor({
  content = '',
  onChange,
  placeholder = 'Comece a escrever...',
  className = '',
  editable = true,
  pendingItems = [],
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      PendingItem,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  })

  return (
    <div
      className={`
        tiptap-editor
        border border-gray-200 dark:border-gray-700
        rounded-lg
        bg-white dark:bg-gray-800
        overflow-hidden
        ${className}
      `}
    >
      {editable && <Toolbar editor={editor} />}
      <div className="overflow-y-auto max-h-[600px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default TiptapEditor
