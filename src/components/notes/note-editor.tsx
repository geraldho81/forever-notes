'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import CharacterCount from '@tiptap/extension-character-count'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Dropcursor from '@tiptap/extension-dropcursor'
import { common, createLowlight } from 'lowlight'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { EditorToolbar } from './editor-toolbar'
import { Button } from '@/components/ui/button'
import { Star, MoreHorizontal, Paperclip, Download, Trash2, RotateCcw, Share2, FileDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { uploadFile, createAttachmentRecord } from '@/lib/upload'
import type { Note, Json } from '@/types/database'

const lowlight = createLowlight(common)

interface NoteEditorProps {
  note: Note
}

export function NoteEditor({ note }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const supabase = createClient()
  const queryClient = useQueryClient()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saving, setSaving] = useState(false)
  const [wordCount, setWordCount] = useState(note.word_count)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const noteIdRef = useRef(note.id)
  noteIdRef.current = note.id

  const { data: attachments, refetch: refetchAttachments } = useQuery({
    queryKey: ['attachments', note.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('attachments')
        .select('*')
        .eq('note_id', note.id)
        .order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const pendingDataRef = useRef<{ title?: string; content?: Json; plain_text?: string; word_count?: number } | null>(null)

  const saveNote = useCallback(
    async (data: { title?: string; content?: Json; plain_text?: string; word_count?: number }) => {
      setSaving(true)
      pendingDataRef.current = null
      const { error } = await supabase
        .from('notes')
        .update(data)
        .eq('id', noteIdRef.current)

      if (error) {
        toast.error('Failed to save')
      }
      setSaving(false)
    },
    [supabase]
  )

  const debounceSave = useCallback(
    (data: { title?: string; content?: Json; plain_text?: string; word_count?: number }) => {
      pendingDataRef.current = { ...pendingDataRef.current, ...data }
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => saveNote(pendingDataRef.current!), 1500)
    },
    [saveNote]
  )

  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    if (pendingDataRef.current) {
      saveNote(pendingDataRef.current)
    }
  }, [saveNote])

  // Flush pending saves on unmount / note switch
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (pendingDataRef.current) {
        const data = pendingDataRef.current
        const id = noteIdRef.current
        supabase.from('notes').update(data).eq('id', id)
      }
    }
  }, [supabase])

  const handleImageUpload = useCallback(
    async (file: File) => {
      const result = await uploadFile(file, noteIdRef.current)
      if (result) {
        await createAttachmentRecord(noteIdRef.current, file, result.path)
        refetchAttachments()
        return result.url
      }
      return null
    },
    [refetchAttachments]
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        dropcursor: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Typography,
      CharacterCount,
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Dropcursor.configure({
        color: 'var(--primary)',
        width: 2,
      }),
    ],
    content: note.content as Record<string, unknown>,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)] px-8 py-4',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files.length) {
          const files = Array.from(event.dataTransfer.files)
          const images = files.filter((f) => f.type.startsWith('image/'))

          if (images.length > 0) {
            event.preventDefault()
            images.forEach(async (image) => {
              const url = await handleImageUpload(image)
              if (url && editor) {
                editor.chain().focus().setImage({ src: url }).run()
              }
            })
            return true
          }

          const otherFiles = files.filter((f) => !f.type.startsWith('image/'))
          if (otherFiles.length > 0) {
            event.preventDefault()
            otherFiles.forEach(async (file) => {
              const result = await uploadFile(file, noteIdRef.current)
              if (result) {
                await createAttachmentRecord(noteIdRef.current, file, result.path)
                refetchAttachments()
                toast.success(`Uploaded ${file.name}`)
              }
            })
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false

        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (file) {
              handleImageUpload(file).then((url) => {
                if (url && editor) {
                  editor.chain().focus().setImage({ src: url }).run()
                }
              })
            }
            return true
          }
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON() as unknown as Json
      const text = editor.getText()
      const words = text.split(/\s+/).filter(Boolean).length
      setWordCount(words)
      debounceSave({
        content: json,
        plain_text: text,
        word_count: words,
      })
    },
  })

  useEffect(() => {
    if (editor && note.content) {
      const currentContent = JSON.stringify(editor.getJSON())
      const newContent = JSON.stringify(note.content)
      if (currentContent !== newContent) {
        editor.commands.setContent(note.content as Record<string, unknown>)
      }
    }
    setTitle(note.title)
  }, [note.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle)
    debounceSave({ title: newTitle })
  }

  function handleTitleBlur() {
    flushSave()
    queryClient.invalidateQueries({ queryKey: ['notes'] })
  }

  async function toggleFavorite() {
    await supabase
      .from('notes')
      .update({ is_favorited: !note.is_favorited })
      .eq('id', note.id)
    queryClient.invalidateQueries({ queryKey: ['notes'] })
    queryClient.invalidateQueries({ queryKey: ['note', note.id] })
  }

  async function moveToTrash() {
    await supabase
      .from('notes')
      .update({ is_trashed: true, trashed_at: new Date().toISOString() })
      .eq('id', note.id)
    queryClient.invalidateQueries({ queryKey: ['notes'] })
    toast.success('Moved to trash')
  }

  async function restoreFromTrash() {
    await supabase
      .from('notes')
      .update({ is_trashed: false, trashed_at: null })
      .eq('id', note.id)
    queryClient.invalidateQueries({ queryKey: ['notes'] })
    queryClient.invalidateQueries({ queryKey: ['note', note.id] })
    toast.success('Restored from trash')
  }

  async function handleFileAttach() {
    fileInputRef.current?.click()
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const url = await handleImageUpload(file)
        if (url && editor) {
          editor.chain().focus().setImage({ src: url }).run()
        }
      } else {
        const result = await uploadFile(file, note.id)
        if (result) {
          await createAttachmentRecord(note.id, file, result.path)
          refetchAttachments()
          toast.success(`Uploaded ${file.name}`)
        }
      }
    }
    e.target.value = ''
  }

  async function deleteAttachment(id: string, storagePath: string) {
    await supabase.storage.from('attachments').remove([storagePath])
    await supabase.from('attachments').delete().eq('id', id)
    refetchAttachments()
    toast.success('Attachment deleted')
  }

  function formatFileSize(bytes: number | null) {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    let i = 0
    let size = bytes
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024
      i++
    }
    return `${size.toFixed(1)} ${units[i]}`
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {saving && <span>Saving...</span>}
          {!saving && <span>{wordCount} words</span>}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleFileAttach}
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleFavorite}
          >
            <Star className={cn('h-4 w-4', note.is_favorited && 'fill-yellow-400 text-yellow-400')} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {note.is_trashed ? (
                <>
                  <DropdownMenuItem onClick={restoreFromTrash}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={async () => {
                      await supabase.from('notes').delete().eq('id', note.id)
                      queryClient.invalidateQueries({ queryKey: ['notes'] })
                      toast.success('Permanently deleted')
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete permanently
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={async () => {
                    const res = await fetch('/api/share', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ noteId: note.id }),
                    })
                    const data = await res.json()
                    if (data.token) {
                      const url = `${window.location.origin}/share/${data.token}`
                      await navigator.clipboard.writeText(url)
                      toast.success('Share link copied to clipboard')
                    }
                  }}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    window.open(`/api/notes/export?noteId=${note.id}&format=html`, '_blank')
                  }}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    window.open(`/api/notes/export?noteId=${note.id}&format=markdown`, '_blank')
                  }}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={moveToTrash}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Move to trash
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelected}
        className="hidden"
        multiple
      />

      <EditorToolbar editor={editor} />

      <div className="flex-1 overflow-y-auto">
        <div className="px-8 pt-6">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Untitled"
            className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
          />
        </div>
        <EditorContent editor={editor} />

        {attachments && attachments.length > 0 && (
          <div className="px-8 pb-6 mt-4 border-t pt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Attachments ({attachments.length})
            </h3>
            <div className="space-y-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 p-2 rounded-md border text-sm hover:bg-accent/50"
                >
                  <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{att.file_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(att.file_size)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      const { data } = supabase.storage.from('attachments').getPublicUrl(att.storage_path)
                      window.open(data.publicUrl, '_blank')
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => deleteAttachment(att.id, att.storage_path)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
