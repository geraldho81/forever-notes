import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')

  // Use service role to bypass RLS for shared notes
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: link } = await supabase
    .from('shared_links')
    .select('*, notes(title, content)')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (!link) {
    return NextResponse.json({ error: 'Link not found or inactive' }, { status: 404 })
  }

  // Check expiration
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
  }

  // Check password
  if (link.password_hash) {
    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 401 })
    }
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    if (hash !== link.password_hash) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }
  }

  // Increment view count
  await supabase
    .from('shared_links')
    .update({ view_count: (link.view_count || 0) + 1 })
    .eq('id', link.id)

  const noteData = link.notes as unknown as { title: string; content: Record<string, unknown> }
  return NextResponse.json({
    title: noteData.title,
    content: noteData.content,
  })
}
