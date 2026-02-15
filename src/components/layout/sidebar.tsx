'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
} from 'lucide-react'

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
  const { setSidebarOpen } = useAppStore()

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

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleNewNote() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: note } = await supabase
      .from('notes')
      .insert({ user_id: user.id, title: 'Untitled' })
      .select()
      .single()

    if (note) {
      router.push(`/notes/${note.id}`)
    }
  }

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
        >
          <Plus className="h-4 w-4" />
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
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                const { data } = await supabase
                  .from('notebooks')
                  .insert({ user_id: user.id, name: 'New Notebook' })
                  .select()
                  .single()
                if (data) router.push(`/notebooks/${data.id}`)
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {notebooks?.map((notebook) => (
            <Button
              key={notebook.id}
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-start gap-2 text-sm',
                pathname === `/notebooks/${notebook.id}` && 'bg-accent'
              )}
              onClick={() => router.push(`/notebooks/${notebook.id}`)}
            >
              <BookOpen className="h-4 w-4" />
              <span className="truncate">{notebook.name}</span>
            </Button>
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
