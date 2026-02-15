'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { NoteEditor } from '@/components/notes/note-editor'
import { NoteList } from '@/components/layout/note-list'
import { useAppStore } from '@/stores/app-store'
import { useEffect } from 'react'

export default function NoteEditorPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const noteId = params.noteId as string
  const supabase = createClient()
  const { setSelectedNoteId } = useAppStore()

  // Determine which list context to show based on where user navigated from
  const fromNotebook = searchParams.get('notebook') ?? undefined
  const fromFilter = searchParams.get('filter') as 'favorites' | 'trash' | 'all' | undefined

  useEffect(() => {
    setSelectedNoteId(noteId)
  }, [noteId, setSelectedNoteId])

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', noteId],
    queryFn: async () => {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single()
      return data
    },
    enabled: !!noteId,
  })

  return (
    <>
      <div className="hidden md:block">
        <NoteList
          filter={fromFilter ?? 'all'}
          notebookId={fromNotebook}
        />
      </div>
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : note ? (
        <NoteEditor note={note} />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Note not found</p>
        </div>
      )}
    </>
  )
}
