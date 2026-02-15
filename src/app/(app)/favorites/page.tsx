'use client'

import { NoteList } from '@/components/layout/note-list'

export default function FavoritesPage() {
  return (
    <>
      <NoteList filter="favorites" />
      <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
        <p className="text-sm">Select a favorited note</p>
      </div>
    </>
  )
}
