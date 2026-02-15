'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search, FileText } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { formatDistanceToNow } from '@/lib/date-utils'

interface SearchResult {
  id: string
  title: string
  plain_text: string
  updated_at: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { setSelectedNoteId } = useAppStore()

  async function handleSearch(q: string) {
    setQuery(q)
    if (q.trim().length < 2) {
      setResults([])
      return
    }

    setSearching(true)
    // Use full-text search with tsvector
    const { data } = await supabase
      .from('notes')
      .select('id, title, plain_text, updated_at')
      .eq('is_trashed', false)
      .or(`title.ilike.%${q}%,plain_text.ilike.%${q}%`)
      .order('updated_at', { ascending: false })
      .limit(20)

    setResults(data ?? [])
    setSearching(false)
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {searching && <p className="text-sm text-muted-foreground">Searching...</p>}

        <div className="space-y-2">
          {results.map((note) => (
            <button
              key={note.id}
              className="w-full text-left p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              onClick={() => {
                setSelectedNoteId(note.id)
                router.push(`/notes/${note.id}`)
              }}
            >
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{note.title || 'Untitled'}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {note.plain_text?.slice(0, 120) || 'No content'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(note.updated_at)}
                  </p>
                </div>
              </div>
            </button>
          ))}

          {query.length >= 2 && !searching && results.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No results found for &quot;{query}&quot;
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
