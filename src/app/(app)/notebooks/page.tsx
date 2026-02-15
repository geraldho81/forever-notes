'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function NotebooksPage() {
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const { data: notebooks } = useQuery({
    queryKey: ['notebooks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notebooks')
        .select('*, notes(count)')
        .order('sort_order')
      return data ?? []
    },
  })

  async function createNotebook() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notebooks')
      .insert({ user_id: user.id, name: 'New Notebook' })
      .select()
      .single()

    queryClient.invalidateQueries({ queryKey: ['notebooks'] })
    if (data) {
      setEditingId(data.id)
      setEditName(data.name)
    }
  }

  async function renameNotebook(id: string) {
    if (!editName.trim()) return
    await supabase.from('notebooks').update({ name: editName.trim() }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['notebooks'] })
    setEditingId(null)
  }

  async function deleteNotebook(id: string) {
    await supabase.from('notebooks').delete().eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['notebooks'] })
    toast.success('Notebook deleted')
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notebooks</h1>
          <Button onClick={createNotebook} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Notebook
          </Button>
        </div>

        <div className="space-y-2">
          {notebooks?.map((notebook) => (
            <div
              key={notebook.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => {
                if (editingId !== notebook.id) router.push(`/notebooks/${notebook.id}`)
              }}
            >
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                {editingId === notebook.id ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => renameNotebook(notebook.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renameNotebook(notebook.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    autoFocus
                    className="h-7 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p className="font-medium text-sm truncate">{notebook.name}</p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    setEditingId(notebook.id)
                    setEditName(notebook.name)
                  }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotebook(notebook.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {(!notebooks || notebooks.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No notebooks yet</p>
              <Button variant="link" size="sm" onClick={createNotebook}>
                Create your first notebook
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
