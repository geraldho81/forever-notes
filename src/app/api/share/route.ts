import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { noteId, password, expiresAt } = body

  // Verify note ownership
  const { data: note } = await supabase
    .from('notes')
    .select('id')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single()

  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  }

  // Hash password if provided
  let passwordHash = null
  if (password) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    passwordHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  const { data: link, error } = await supabase
    .from('shared_links')
    .insert({
      note_id: noteId,
      user_id: user.id,
      password_hash: passwordHash,
      expires_at: expiresAt || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ token: link.token })
}
