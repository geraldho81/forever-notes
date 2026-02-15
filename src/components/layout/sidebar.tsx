'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Plus,
  Search,
  Star,
  Trash2,
  BookOpen,
  Tag,
  Settings,
  LogOut,
  PanelLeftClose,
  Clock,
  Loader2,
  MoreHorizontal,
  Pencil,
} from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

const navItems = [
  { label: 'All Notes', icon: FileText, href: '/' },
  { label: 'Search', icon: Search, href: '/search' },
  { label: 'Favorites', icon: Star, href: '/favorites' },
  { label: 'Trash', icon: Trash2, href: '/trash' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { setSidebarOpen } = useAppStore()
  const [creatingNote, setCreatingNote] = useState(false)
  const [creatingNotebook, setCreatingNotebook] = useState(false)
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [dragOverNotebookId, setDragOverNotebookId] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: Infinity,
  })

  const { data: notebooks } = useQuery({
    queryKey: ['notebooks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notebooks')
        .select('*')
        .order('sort_order')
      return data ?? []
    },
  })

  useEffect(() => {
    if (editingNotebookId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingNotebookId])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleNewNote() {
    if (!user || creatingNote) return
    setCreatingNote(true)

    const { data: note, error } = await supabase
      .from('notes')
      .insert({ user_id: user.id, title: 'Untitled' })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create note')
      setCreatingNote(false)
      return
    }

    if (note) {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      router.push(`/notes/${note.id}`)
    }
    setCreatingNote(false)
  }

  async function handleNewNotebook() {
    if (!user || creatingNotebook) return
    setCreatingNotebook(true)

    const { data, error } = await supabase
      .from('notebooks')
      .insert({ user_id: user.id, name: 'New Notebook' })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create notebook')
      setCreatingNotebook(false)
      return
    }

    if (data) {
      await queryClient.invalidateQueries({ queryKey: ['notebooks'] })
      setEditingNotebookId(data.id)
      setEditName(data.name)
    }
    setCreatingNotebook(false)
  }

  async function saveNotebookName(id: string) {
    const trimmed = editName.trim()
    if (!trimmed) {
      setEditingNotebookId(null)
      return
    }
    await supabase.from('notebooks').update({ name: trimmed }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['notebooks'] })
    setEditingNotebookId(null)
  }

  async function deleteNotebook(id: string) {
    await supabase.from('notebooks').delete().eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['notebooks'] })
    toast.success('Notebook deleted')
  }

  const handleNoteDrop = useCallback(async (notebookId: string, e: React.DragEvent) => {
    e.preventDefault()
    setDragOverNotebookId(null)
    const noteId = e.dataTransfer.getData('text/note-id')
    if (!noteId) return

    const { error } = await supabase
      .from('notes')
      .update({ notebook_id: notebookId })
      .eq('id', noteId)

    if (error) {
      toast.error('Failed to move note')
      return
    }

    queryClient.invalidateQueries({ queryKey: ['notes'] })
    toast.success('Note moved to notebook')
  }, [supabase, queryClient])

  return (
    <div className="flex h-full w-[260px] flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span className="font-semibold text-sm">Forever Notes</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-3 pb-2">
        <Button
          onClick={handleNewNote}
          className="w-full justify-start gap-2"
          size="sm"
          disabled={creatingNote}
        >
          {creatingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New Note
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-start gap-2',
                pathname === item.href && 'bg-accent'
              )}
              onClick={() => router.push(item.href)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>

        <Separator className="my-3" />

        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Notebooks
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleNewNotebook}
              disabled={creatingNotebook}
            >
              {creatingNotebook ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            </Button>
          </div>

          {notebooks?.map((notebook) => (
            <div
              key={notebook.id}
              className={cn(
                'rounded-md transition-colors',
                dragOverNotebookId === notebook.id && 'ring-2 ring-primary bg-primary/10'
              )}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setDragOverNotebookId(notebook.id)
              }}
              onDragLeave={() => setDragOverNotebookId(null)}
              onDrop={(e) => handleNoteDrop(notebook.id, e)}
            >
              {editingNotebookId === notebook.id ? (
                <div className="flex items-center gap-1 px-2 py-1">
                  <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    ref={editInputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => saveNotebookName(notebook.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveNotebookName(notebook.id)
                      if (e.key === 'Escape') setEditingNotebookId(null)
                    }}
                    className="h-6 text-sm px-1 py-0"
                  />
                </div>
              ) : (
                <div className="group flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'flex-1 justify-start gap-2 text-sm',
                      pathname === `/notebooks/${notebook.id}` && 'bg-accent'
                    )}
                    onClick={() => router.push(`/notebooks/${notebook.id}`)}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span className="truncate">{notebook.name}</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="bottom">
                      <DropdownMenuItem onClick={() => {
                        setEditingNotebookId(notebook.id)
                        setEditName(notebook.name)
                      }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteNotebook(notebook.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}

          {(!notebooks || notebooks.length === 0) && (
            <p className="px-2 py-1 text-xs text-muted-foreground">No notebooks yet</p>
          )}
        </div>

        <Separator className="my-3" />

        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full justify-start gap-2',
              pathname === '/tags' && 'bg-accent'
            )}
            onClick={() => router.push('/tags')}
          >
            <Tag className="h-4 w-4" />
            Tags
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full justify-start gap-2',
              pathname === '/templates' && 'bg-accent'
            )}
            onClick={() => router.push('/templates')}
          >
            <Clock className="h-4 w-4" />
            Templates
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full justify-start gap-2',
              pathname === '/settings' && 'bg-accent'
            )}
            onClick={() => router.push('/settings')}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </ScrollArea>

      <Separator />
      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}
