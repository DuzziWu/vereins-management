import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/workgroups/[id]/kanban/tasks/[taskId]/attachments/[attachmentId] - Download attachment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string; attachmentId: string }> }
) {
  const { taskId, attachmentId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get attachment
  const { data: attachment, error } = await supabase
    .from('kanban_task_attachments')
    .select('*')
    .eq('id', attachmentId)
    .eq('task_id', taskId)
    .single()

  if (error || !attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  // Generate signed URL for download
  const { data: signedUrl, error: urlError } = await supabase.storage
    .from('kanban-attachments')
    .createSignedUrl(attachment.storage_path, 60) // 60 seconds expiry

  if (urlError || !signedUrl) {
    console.error('Error creating signed URL:', urlError)
    return NextResponse.json({ error: 'Could not generate download URL' }, { status: 500 })
  }

  return NextResponse.json({
    download_url: signedUrl.signedUrl,
    filename: attachment.filename,
    mime_type: attachment.mime_type,
  })
}

// DELETE /api/workgroups/[id]/kanban/tasks/[taskId]/attachments/[attachmentId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string; attachmentId: string }> }
) {
  const { id: workgroupId, taskId, attachmentId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const isVorstand = profile.role === 'vorstand'

  // Get attachment
  const { data: attachment } = await supabase
    .from('kanban_task_attachments')
    .select('*')
    .eq('id', attachmentId)
    .eq('task_id', taskId)
    .single()

  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  // Only uploader or Vorstand can delete
  if (attachment.uploaded_by !== profile.id && !isVorstand) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('kanban-attachments')
    .remove([attachment.storage_path])

  if (storageError) {
    console.error('Error deleting from storage:', storageError)
    // Continue anyway to delete the DB record
  }

  // Delete record
  const { error: deleteError } = await supabase
    .from('kanban_task_attachments')
    .delete()
    .eq('id', attachmentId)

  if (deleteError) {
    console.error('Error deleting attachment record:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
