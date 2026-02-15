'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Plus, FileText } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/date-utils'
import type { Note } from '@/types/database'

interface NoteListProps {
  notebookId?: string
  filter?: 'favorites' | 'trash' | 'all'
}

export function NoteList({ notebookId, filter = 'all' }: NoteListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { selectedNoteId, setSelectedNoteId } = useAppStore()

  const queryKey = ['notes', { notebookId, filter }]

  const { data: notes, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('notes')
        .select('id, title, plain_text, updated_at, is_favorited, is_pinned, is_trashed, notebook_id')
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })

      if (filter === 'favorites') {
        query = query.eq('is_favorited', true).eq('is_trashed', false)
      } else if (filter === 'trash') {
        query = query.eq('is_trashed', true)
      } else if (notebookId) {
        query = query.eq('notebook_id', notebookId).eq('is_trashed', false)
      } else {
        query = query.eq('is_trashed', false)
      }

      const { data } = await query.limit(100)
      return data ?? []
    },
  })

  async function handleNewNote() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const insertData: { user_id: string; title: string; notebook_id?: string } = {
      user_id: user.id,
      title: 'Untitled',
    }
    if (notebookId) insertData.notebook_id = notebookId

    const { data: note } = await supabase
      .from('notes')
      .insert(insertData)
      .select()
      .single()

    if (note) {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      setSelectedNoteId(note.id)
      router.push(`/notes/${note.id}`)
    }
  }

  function getPreview(note: Pick<Note, 'plain_text'>) {
    const text = note.plain_text || ''
    return text.slice(0, 100).trim() || 'No content'
  }

  return (
    <div className="flex h-full w-[300px] flex-col border-r">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold text-sm">
          {filter === 'favorites' ? 'Favorites' : filter === 'trash' ? 'Trash' : notebookId ? 'Notebook' : 'All Notes'}
        </h2>
        {filter !== 'trash' && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewNote}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        ) : notes && notes.length > 0 ? (
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
                    <p className="font-medium text-sm truncate">
                      {note.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {getPreview(note as Pick<Note, 'plain_text'>)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(note.updated_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <p>No notes yet</p>
            {filter !== 'trash' && (
              <Button variant="link" size="sm" onClick={handleNewNote} className="mt-1">
                Create your first note
              </Button>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
