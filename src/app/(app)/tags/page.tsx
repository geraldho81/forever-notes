'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Tag as TagIcon, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function TagsPage() {
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tags')
        .select('*')
        .order('name')
      return data ?? []
    },
  })

  async function createTag() {
    if (!newTagName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('tags')
      .insert({ user_id: user.id, name: newTagName.trim() })

    if (error) {
      toast.error('Tag already exists or could not be created')
    } else {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setNewTagName('')
      setShowCreate(false)
    }
  }

  async function renameTag(id: string) {
    if (!editName.trim()) return
    await supabase.from('tags').update({ name: editName.trim() }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['tags'] })
    setEditingId(null)
  }

  async function deleteTag(id: string) {
    await supabase.from('tags').delete().eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['tags'] })
    toast.success('Tag deleted')
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Tags</h1>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Tag
          </Button>
        </div>

        {showCreate && (
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createTag()
                if (e.key === 'Escape') setShowCreate(false)
              }}
              autoFocus
            />
            <Button onClick={createTag} size="sm">Create</Button>
            <Button onClick={() => setShowCreate(false)} variant="ghost" size="sm">Cancel</Button>
          </div>
        )}

        <div className="space-y-2">
          {tags?.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => {
                if (editingId !== tag.id) router.push(`/tags/${tag.id}`)
              }}
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <div className="flex-1 min-w-0">
                {editingId === tag.id ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => renameTag(tag.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renameTag(tag.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    autoFocus
                    className="h-7 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p className="font-medium text-sm">{tag.name}</p>
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
                    setEditingId(tag.id)
                    setEditName(tag.name)
                  }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteTag(tag.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {(!tags || tags.length === 0) && !showCreate && (
            <div className="text-center py-12 text-muted-foreground">
              <TagIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No tags yet</p>
              <Button variant="link" size="sm" onClick={() => setShowCreate(true)}>
                Create your first tag
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
