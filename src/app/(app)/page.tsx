'use client'

import { NoteList } from '@/components/layout/note-list'

export default function DashboardPage() {
  return (
    <>
      <NoteList filter="all" />
      <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
        <p className="text-sm">Select a note or create a new one</p>
      </div>
    </>
  )
}
