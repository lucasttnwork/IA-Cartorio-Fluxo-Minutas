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

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { PendingItem } from './PendingItemExtension'
import { InlineEdit } from './InlineEditExtension'
import { InlineEditPopover } from './InlineEditPopover'
import { HeadingWithId } from './HeadingWithId'
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
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  ClockIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import type { PendingItem as PendingItemType } from '../../types'
import type { SaveStatus } from '@/hooks/useDraftAutoSave'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

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
  saveStatus?: SaveStatus
  lastSaved?: Date | null
  onForceSave?: () => void
  onInlineEdit?: (fieldPath: string, newValue: string) => void
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
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      variant={isActive ? "secondary" : "ghost"}
      size="icon"
      className={cn(
        "h-9 w-9 transition-all duration-200",
        isActive && "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md dark:from-blue-600 dark:to-blue-700"
      )}
    >
      <div className="w-5 h-5">{icon}</div>
    </Button>
  )
}

// -----------------------------------------------------------------------------
// Toolbar Divider Component
// -----------------------------------------------------------------------------

function ToolbarDivider() {
  return <Separator orientation="vertical" className="h-6 mx-1" />
}

// -----------------------------------------------------------------------------
// Save Status Indicator Component
// -----------------------------------------------------------------------------

interface SaveStatusIndicatorProps {
  status: SaveStatus
  lastSaved: Date | null
  onForceSave?: () => void
}

function SaveStatusIndicator({ status, lastSaved, onForceSave }: SaveStatusIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saved':
        return {
          icon: <CheckCircleIcon className="w-4 h-4" />,
          text: lastSaved
            ? `Salvo ${formatLastSaved(lastSaved)}`
            : 'Salvo',
          className: 'text-green-600 dark:text-green-400',
        }
      case 'saving':
        return {
          icon: <ArrowPathIcon className="w-4 h-4 animate-spin" />,
          text: 'Salvando...',
          className: 'text-blue-600 dark:text-blue-400',
        }
      case 'unsaved':
        return {
          icon: <ClockIcon className="w-4 h-4" />,
          text: 'Não salvo',
          className: 'text-yellow-600 dark:text-yellow-400',
        }
      case 'error':
        return {
          icon: <ExclamationCircleIcon className="w-4 h-4" />,
          text: 'Erro ao salvar',
          className: 'text-red-600 dark:text-red-400',
        }
    }
  }

  const display = getStatusDisplay()

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <div className={cn('flex items-center gap-1.5 text-xs font-medium', display.className)}>
        {display.icon}
        <span>{display.text}</span>
      </div>
      {status === 'error' && onForceSave && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onForceSave}
          className="h-6 px-2 text-xs"
        >
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

function formatLastSaved(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)

  if (diffSecs < 10) {
    return 'agora'
  } else if (diffSecs < 60) {
    return `há ${diffSecs}s`
  } else if (diffMins < 60) {
    return `há ${diffMins}m`
  } else {
    return `às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }
}

// -----------------------------------------------------------------------------
// Toolbar Component
// -----------------------------------------------------------------------------

interface ToolbarProps {
  editor: any
  saveStatus?: SaveStatus
  lastSaved?: Date | null
  onForceSave?: () => void
  trackChangesEnabled: boolean
  onTrackChangesToggle: () => void
}

function Toolbar({
  editor,
  saveStatus,
  lastSaved,
  onForceSave,
  trackChangesEnabled,
  onTrackChangesToggle,
}: ToolbarProps) {
  if (!editor) {
    return null
  }

  return (
    <div className="border-b border-gray-200/50 dark:border-gray-700/50 glass-subtle p-3 flex items-center gap-1.5 flex-wrap justify-between shadow-sm">
      <div className="flex items-center gap-1.5 flex-wrap">
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

        <ToolbarDivider />

        {/* Track Changes Toggle */}
        <ToolbarButton
          onClick={onTrackChangesToggle}
          isActive={trackChangesEnabled}
          icon={<PencilSquareIcon className="w-5 h-5" />}
          title="Controlar alterações (Ctrl+Shift+T)"
        />
      </div>

      {/* Save Status Indicator */}
      {saveStatus && (
        <>
          <ToolbarDivider />
          <SaveStatusIndicator
            status={saveStatus}
            lastSaved={lastSaved || null}
            onForceSave={onForceSave}
          />
        </>
      )}
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
  pendingItems: _pendingItems = [],
  saveStatus,
  lastSaved,
  onForceSave,
  onInlineEdit,
}: TiptapEditorProps) {
  const [trackChangesEnabled, setTrackChangesEnabled] = useState(false)
  const [editingField, setEditingField] = useState<{
    fieldPath: string
    fieldType: string
    currentValue: string
    position: { x: number; y: number }
  } | null>(null)

  const handleTrackChangesToggle = () => {
    setTrackChangesEnabled(!trackChangesEnabled)
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable default heading extension
      }),
      HeadingWithId.configure({
        levels: [1, 2, 3],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      PendingItem,
      InlineEdit,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-6 text-gray-900 dark:text-gray-50',
          trackChangesEnabled && 'track-changes-enabled'
        ),
      },
      handleDOMEvents: {
        dblclick: (view, event) => {
          const target = event.target as HTMLElement

          // Check if double-clicked on an inline-edit field
          const editableField = target.closest('[data-field-path]')
          if (editableField && onInlineEdit) {
            const fieldPath = editableField.getAttribute('data-field-path')
            const fieldType = editableField.getAttribute('data-field-type') || 'text'
            const currentValue = editableField.textContent || ''

            if (fieldPath) {
              // Get position for popover
              const rect = editableField.getBoundingClientRect()
              setEditingField({
                fieldPath,
                fieldType,
                currentValue,
                position: {
                  x: rect.left,
                  y: rect.bottom + 8,
                },
              })

              return true
            }
          }

          return false
        },
        keydown: (view, event) => {
          // Handle Ctrl+Shift+T for track changes toggle
          if (event.ctrlKey && event.shiftKey && event.key === 'T') {
            event.preventDefault()
            handleTrackChangesToggle()
            return true
          }
          return false
        },
      },
    },
  })

  const handleSaveInlineEdit = (newValue: string) => {
    if (editingField && onInlineEdit) {
      onInlineEdit(editingField.fieldPath, newValue)

      // Update the editor content
      if (editor) {
        const { from, to } = editor.state.selection
        editor.chain()
          .focus()
          .setTextSelection({ from, to })
          .insertContent(newValue)
          .run()
      }
    }
    setEditingField(null)
  }

  const handleCancelInlineEdit = () => {
    setEditingField(null)
  }

  return (
    <Card className={cn("tiptap-editor glass-card overflow-hidden shadow-xl border-0", className)}>
      {editable && (
        <Toolbar
          editor={editor}
          saveStatus={saveStatus}
          lastSaved={lastSaved}
          onForceSave={onForceSave}
          trackChangesEnabled={trackChangesEnabled}
          onTrackChangesToggle={handleTrackChangesToggle}
        />
      )}
      <div className="overflow-y-auto max-h-[600px] bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <EditorContent editor={editor} />
      </div>

      {/* Track Changes Indicator */}
      {trackChangesEnabled && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
            <PencilSquareIcon className="w-4 h-4" />
            <span className="font-medium">Modo de controle de alterações ativado</span>
          </div>
        </div>
      )}

      {/* Inline Edit Popover */}
      {editingField && (
        <InlineEditPopover
          fieldPath={editingField.fieldPath}
          fieldType={editingField.fieldType}
          currentValue={editingField.currentValue}
          onSave={handleSaveInlineEdit}
          onCancel={handleCancelInlineEdit}
          position={editingField.position}
        />
      )}
    </Card>
  )
}

export default TiptapEditor
