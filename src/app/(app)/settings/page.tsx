'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function SettingsPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = useState('')

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      return data
    },
  })

  useEffect(() => {
    if (profile) setDisplayName(profile.display_name ?? '')
  }, [profile])

  async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id)
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    toast.success('Profile updated')
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">Settings</h1>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <Button onClick={saveProfile} size="sm">Save</Button>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Import / Export</h2>
          <p className="text-sm text-muted-foreground">Coming soon: Export your notes as PDF, Markdown, or HTML. Import from Evernote or Apple Notes.</p>
        </div>
      </div>
    </div>
  )
}
