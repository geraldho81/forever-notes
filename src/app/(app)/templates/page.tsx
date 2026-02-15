'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, FileText, MoreHorizontal, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import type { Json } from '@/types/database'

const systemTemplates = [
  {
    name: 'Meeting Notes',
    category: 'work',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Meeting Notes' }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Date: ' }, { type: 'text', text: '' }] },
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Attendees: ' }, { type: 'text', text: '' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Agenda' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Discussion' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Action Items' }] },
        { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }] },
      ],
    },
  },
  {
    name: 'Daily Journal',
    category: 'personal',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Daily Journal' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Gratitude' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: "Today's Goals" }] },
        { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Reflections' }] },
        { type: 'paragraph' },
      ],
    },
  },
  {
    name: 'Project Plan',
    category: 'work',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Project Plan' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Overview' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Goals' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Timeline' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Tasks' }] },
        { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }] },
      ],
    },
  },
]

export default function TemplatesPage() {
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: customTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })
      return data ?? []
    },
  })

  async function createFromTemplate(name: string, content: Record<string, unknown>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: note } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: name,
        content: content as unknown as Json,
      })
      .select()
      .single()

    if (note) {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      router.push(`/notes/${note.id}`)
    }
  }

  async function deleteTemplate(id: string) {
    await supabase.from('templates').delete().eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['templates'] })
    toast.success('Template deleted')
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Templates</h1>

        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          System Templates
        </h2>
        <div className="grid gap-3 mb-8">
          {systemTemplates.map((template) => (
            <button
              key={template.name}
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors text-left"
              onClick={() => createFromTemplate(template.name, template.content)}
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{template.name}</p>
                <p className="text-xs text-muted-foreground">{template.category}</p>
              </div>
            </button>
          ))}
        </div>

        {customTemplates && customTemplates.length > 0 && (
          <>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Custom Templates
            </h2>
            <div className="grid gap-3">
              {customTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => createFromTemplate(template.name, template.content as Record<string, unknown>)}
                >
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.category}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTemplate(template.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
