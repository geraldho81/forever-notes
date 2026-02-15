'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/app-store'
import { FileText } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/date-utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export default function TagNotesPage() {
  const params = useParams()
  const tagId = params.tagId as string
  const supabase = createClient()
  const router = useRouter()
  const { selectedNoteId, setSelectedNoteId } = useAppStore()

  const { data: tag } = useQuery({
    queryKey: ['tag', tagId],
    queryFn: async () => {
      const { data } = await supabase.from('tags').select('*').eq('id', tagId).single()
      return data
    },
  })

  const { data: notes } = useQuery({
    queryKey: ['tag-notes', tagId],
    queryFn: async () => {
      const { data } = await supabase
        .from('note_tags')
        .select('note_id, notes(id, title, plain_text, updated_at)')
        .eq('tag_id', tagId)
      return data?.map((nt) => (nt as unknown as { notes: { id: string; title: string; plain_text: string; updated_at: string } }).notes).filter(Boolean) ?? []
    },
  })

  return (
    <>
      <div className="flex h-full w-[300px] flex-col border-r">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          {tag && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />}
          <h2 className="font-semibold text-sm">{tag?.name ?? 'Tag'}</h2>
        </div>
        <ScrollArea className="flex-1">
          {notes && notes.length > 0 ? (
            <div className="divide-y">
              {notes.map((note) => (
                <button
                  key={note.id}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors',
                    selectedNoteId === note.id && 'bg-accent'
                  )}
                  onClick={() => {
                    setSelectedNoteId(note.id)
                    router.push(`/notes/${note.id}`)
                  }}
                >
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{note.title || 'Untitled'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(note.updated_at)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">No notes with this tag</div>
          )}
        </ScrollArea>
      </div>
      <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
        <p className="text-sm">Select a note</p>
      </div>
    </>
  )
}
