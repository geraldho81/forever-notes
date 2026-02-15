'use client'

import { type Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Minus,
  Highlighter,
  Undo,
  Redo,
  CodeSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditorToolbarProps {
  editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  const tools = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), tooltip: 'Bold' },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), tooltip: 'Italic' },
    { icon: Underline, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline'), tooltip: 'Underline' },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), tooltip: 'Strikethrough' },
    { icon: Code, action: () => editor.chain().focus().toggleCode().run(), active: editor.isActive('code'), tooltip: 'Inline code' },
    { icon: Highlighter, action: () => editor.chain().focus().toggleHighlight().run(), active: editor.isActive('highlight'), tooltip: 'Highlight' },
    'separator',
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }), tooltip: 'Heading 1' },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), tooltip: 'Heading 2' },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }), tooltip: 'Heading 3' },
    'separator',
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), tooltip: 'Bullet list' },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), tooltip: 'Ordered list' },
    { icon: ListChecks, action: () => editor.chain().focus().toggleTaskList().run(), active: editor.isActive('taskList'), tooltip: 'Task list' },
    'separator',
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote'), tooltip: 'Quote' },
    { icon: CodeSquare, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock'), tooltip: 'Code block' },
    { icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run(), active: false, tooltip: 'Divider' },
    'separator',
    { icon: Undo, action: () => editor.chain().focus().undo().run(), active: false, tooltip: 'Undo' },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), active: false, tooltip: 'Redo' },
  ] as const

  return (
    <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b bg-background/95">
      {tools.map((tool, i) => {
        if (tool === 'separator') {
          return <Separator key={i} orientation="vertical" className="mx-1 h-6" />
        }
        return (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8', tool.active && 'bg-accent')}
                onClick={tool.action}
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {tool.tooltip}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
