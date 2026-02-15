import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

const lowlight = createLowlight(common)

const extensions = [
  StarterKit.configure({ codeBlock: false }),
  TaskList,
  TaskItem,
  Underline,
  Highlight,
  Image,
  CodeBlockLowlight.configure({ lowlight }),
]

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const noteId = searchParams.get('noteId')
  const format = searchParams.get('format') || 'html'

  if (!noteId) {
    return NextResponse.json({ error: 'noteId required' }, { status: 400 })
  }

  const { data: note } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single()

  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  }

  const content = note.content as Record<string, unknown>

  if (format === 'markdown') {
    // Simple markdown conversion from plain text
    const md = `# ${note.title}\n\n${note.plain_text}`
    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${note.title || 'note'}.md"`,
      },
    })
  }

  if (format === 'html') {
    const html = generateHTML(content, extensions)
    const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${note.title}</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;line-height:1.6}
h1{font-size:2rem}pre{background:#f5f5f5;padding:1rem;border-radius:0.5rem;overflow-x:auto}
code{background:#f5f5f5;padding:0.125rem 0.375rem;border-radius:0.25rem;font-size:0.875rem}
blockquote{border-left:3px solid #ddd;padding-left:1rem;margin-left:0}
img{max-width:100%;border-radius:0.5rem}</style>
</head><body><h1>${note.title}</h1>${html}</body></html>`

    return new NextResponse(fullHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${note.title || 'note'}.html"`,
      },
    })
  }

  return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
}
