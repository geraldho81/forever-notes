'use client'

import { useParams } from 'next/navigation'
import { NoteList } from '@/components/layout/note-list'

export default function NotebookNotesPage() {
  const params = useParams()
  const notebookId = params.notebookId as string

  return (
    <>
      <NoteList notebookId={notebookId} />
      <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
        <p className="text-sm">Select a note or create a new one</p>
      </div>
    </>
  )
}
