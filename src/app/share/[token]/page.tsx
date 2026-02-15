'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { FileText, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const lowlight = createLowlight(common)

interface SharedNote {
  title: string
  content: Record<string, unknown>
}

export default function SharedNotePage() {
  const params = useParams()
  const token = params.token as string
  const [note, setNote] = useState<SharedNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [password, setPassword] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      TaskList,
      TaskItem,
      Underline,
      Highlight,
      Image,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none px-8 py-4',
      },
    },
  })

  async function fetchNote(pw?: string) {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/share/${token}${pw ? `?password=${encodeURIComponent(pw)}` : ''}`)
    const data = await res.json()

    if (res.status === 401) {
      setNeedsPassword(true)
      setError(data.error)
    } else if (!res.ok) {
      setError(data.error || 'Failed to load note')
    } else {
      setNote(data)
      setNeedsPassword(false)
      editor?.commands.setContent(data.content)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNote()
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (needsPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-4 px-4 text-center">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold">Password Protected</h2>
          <p className="text-sm text-muted-foreground">This note requires a password to view.</p>
          {error && error !== 'Password required' && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              fetchNote(password)
            }}
            className="space-y-2"
          >
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full">View Note</Button>
          </form>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <FileText className="h-5 w-5" />
          <span className="font-semibold text-sm">Forever Notes</span>
          <span className="text-xs text-muted-foreground ml-auto">Shared note (read-only)</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-bold px-8 mb-4">{note?.title || 'Untitled'}</h1>
        <EditorContent editor={editor} />
      </main>
    </div>
  )
}
