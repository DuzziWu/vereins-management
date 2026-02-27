import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { kanbanAttachmentValidation } from '@/lib/validations/kanban'

const MAX_ATTACHMENTS = kanbanAttachmentValidation.maxFilesPerTask

// GET /api/workgroups/[id]/kanban/tasks/[taskId]/attachments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: attachments, error } = await supabase
    .from('kanban_task_attachments')
    .select(`
      *,
      uploader:profiles!kanban_task_attachments_uploaded_by_fkey(id, first_name, last_name)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const formattedAttachments = (attachments || []).map(att => ({
    ...att,
    uploader_name: att.uploader
      ? `${att.uploader.first_name} ${att.uploader.last_name}`
      : null,
  }))

  return NextResponse.json({ attachments: formattedAttachments })
}

// POST /api/workgroups/[id]/kanban/tasks/[taskId]/attachments - Upload attachment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: workgroupId, taskId } = await params
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

  // Check membership
  if (!isVorstand) {
    const { data: membership } = await supabase
      .from('workgroup_members')
      .select('id')
      .eq('workgroup_id', workgroupId)
      .eq('profile_id', profile.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
  }

  // Verify task belongs to workgroup
  const { data: task } = await supabase
    .from('kanban_tasks')
    .select(`
      id,
      column:kanban_columns!kanban_tasks_column_id_fkey(workgroup_id)
    `)
    .eq('id', taskId)
    .single()

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taskColumn = task.column as any
  if (!taskColumn || taskColumn.workgroup_id !== workgroupId) {
    return NextResponse.json({ error: 'Task not found in this workgroup' }, { status: 404 })
  }

  // Check attachment count limit
  const { count: attachmentCount } = await supabase
    .from('kanban_task_attachments')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', taskId)

  if ((attachmentCount || 0) >= MAX_ATTACHMENTS) {
    return NextResponse.json({
      error: `Maximal ${MAX_ATTACHMENTS} Dateien pro Task erlaubt`
    }, { status: 400 })
  }

  // Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file size
  if (file.size > kanbanAttachmentValidation.maxFileSize) {
    return NextResponse.json({
      error: `Datei zu groß. Maximum: ${kanbanAttachmentValidation.maxFileSize / 1024 / 1024} MB`
    }, { status: 400 })
  }

  // Validate file type
  if (!kanbanAttachmentValidation.allowedMimeTypes.includes(file.type)) {
    return NextResponse.json({
      error: 'Dateityp nicht erlaubt. Erlaubt: PDF, Office, Bilder, ZIP'
    }, { status: 400 })
  }

  // Generate storage path
  const fileExt = file.name.split('.').pop() || 'bin'
  const attachmentId = crypto.randomUUID()
  const storagePath = `${workgroupId}/${taskId}/${attachmentId}.${fileExt}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('kanban-attachments')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
  }

  // Create attachment record
  const { data: attachment, error: insertError } = await supabase
    .from('kanban_task_attachments')
    .insert({
      id: attachmentId,
      task_id: taskId,
      filename: file.name,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: profile.id,
    })
    .select(`
      *,
      uploader:profiles!kanban_task_attachments_uploaded_by_fkey(id, first_name, last_name)
    `)
    .single()

  if (insertError) {
    console.error('Error creating attachment record:', insertError)
    // Try to clean up the uploaded file
    await supabase.storage.from('kanban-attachments').remove([storagePath])
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const formattedAttachment = {
    ...attachment,
    uploader_name: attachment.uploader
      ? `${attachment.uploader.first_name} ${attachment.uploader.last_name}`
      : null,
  }

  return NextResponse.json({ attachment: formattedAttachment }, { status: 201 })
}
