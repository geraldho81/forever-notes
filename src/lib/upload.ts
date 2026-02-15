import { createClient } from '@/lib/supabase/client'

export async function uploadFile(
  file: File,
  noteId: string,
  bucket: string = 'attachments'
): Promise<{ path: string; url: string } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const ext = file.name.split('.').pop()
  const fileName = `${user.id}/${noteId}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file)

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return { path: data.path, url: urlData.publicUrl }
}

export async function createAttachmentRecord(
  noteId: string,
  file: File,
  storagePath: string
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('attachments')
    .insert({
      note_id: noteId,
      user_id: user.id,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
    })
    .select()
    .single()

  return data
}
