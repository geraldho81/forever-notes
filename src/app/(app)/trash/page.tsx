'use client'

import { NoteList } from '@/components/layout/note-list'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function TrashPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  async function emptyTrash() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notes')
      .delete()
      .eq('user_id', user.id)
      .eq('is_trashed', true)

    queryClient.invalidateQueries({ queryKey: ['notes'] })
    toast.success('Trash emptied')
  }

  return (
    <>
      <NoteList filter="trash" />
      <div className="hidden md:flex flex-1 flex-col items-center justify-center text-muted-foreground gap-4">
        <Trash2 className="h-12 w-12 opacity-50" />
        <p className="text-sm">Select a note to restore or permanently delete</p>
        <Button variant="destructive" size="sm" onClick={emptyTrash}>
          Empty Trash
        </Button>
      </div>
    </>
  )
}
