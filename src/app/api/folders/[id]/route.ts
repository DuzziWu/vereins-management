import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { folderUpdateSchema, folderMoveSchema } from '@/lib/validations/folders'

// =============================================
// PROJ-26: Single Folder API Routes
// GET /api/folders/[id] - Get folder details
// PATCH /api/folders/[id] - Update folder (Vorstand only)
// DELETE /api/folders/[id] - Delete folder (Vorstand only, not system folders)
// =============================================

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET /api/folders/[id] - Get folder details with breadcrumb
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is Vorstand (Vorstand can see all folders)
  const { data: isVorstand } = await supabase.rpc('is_vorstand')

  // Fetch folder (RLS will filter based on permissions)
  const { data: folder, error } = await supabase
    .from('folders')
    .select(`
      *,
      created_by_profile:profiles!folders_created_by_fkey(id, first_name, last_name)
    `)
    .eq('id', id)
    .single()

  if (error || !folder) {
    // BUG-3 FIX: Distinguish between 404 and 403
    // If user is Vorstand and folder not found → folder truly doesn't exist (404)
    // If user is not Vorstand and folder not found → could be access denied (403)
    // This is secure: non-Vorstand users don't learn if folder exists or not
    if (isVorstand) {
      return NextResponse.json({ error: 'Ordner nicht gefunden.' }, { status: 404 })
    } else {
      return NextResponse.json({ error: 'Du hast keinen Zugriff auf diesen Ordner.' }, { status: 403 })
    }
  }

  // Build breadcrumb from path
  const pathIds = folder.path.split('/').filter(Boolean)
  let breadcrumb: Array<{ id: string; name: string }> = []

  if (pathIds.length > 1) {
    // Fetch all ancestor folders
    const { data: ancestors } = await supabase
      .from('folders')
      .select('id, name')
      .in('id', pathIds)

    if (ancestors) {
      // Sort by path order
      const ancestorMap = new Map(ancestors.map(a => [a.id, a]))
      breadcrumb = pathIds
        .map(pid => ancestorMap.get(pid))
        .filter(Boolean) as Array<{ id: string; name: string }>
    }
  }

  // Fetch subfolders
  const { data: subfolders } = await supabase
    .from('folders')
    .select('id, name, description, is_system_default, created_at')
    .eq('parent_id', id)
    .order('name', { ascending: true })

  return NextResponse.json({
    folder,
    breadcrumb,
    subfolders: subfolders || []
  })
}

// PATCH /api/folders/[id] - Update folder
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is Vorstand
  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Parse request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Check if this is a move operation
  if ('new_parent_id' in body) {
    const moveValidation = folderMoveSchema.safeParse(body)
    if (!moveValidation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: moveValidation.error.flatten()
      }, { status: 400 })
    }

    return handleMoveFolder(supabase, id, moveValidation.data.new_parent_id)
  }

  // Regular update
  const validation = folderUpdateSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Check folder exists
  const { data: existingFolder, error: fetchError } = await supabase
    .from('folders')
    .select('id, name, parent_id')
    .eq('id', id)
    .single()

  if (fetchError || !existingFolder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
  }

  // Check for duplicate name if name is being changed
  if (data.name && data.name !== existingFolder.name) {
    let duplicateQuery = supabase
      .from('folders')
      .select('id')
      .eq('name', data.name)
      .neq('id', id)

    if (existingFolder.parent_id) {
      duplicateQuery = duplicateQuery.eq('parent_id', existingFolder.parent_id)
    } else {
      duplicateQuery = duplicateQuery.is('parent_id', null)
    }

    const { data: duplicateFolder } = await duplicateQuery.maybeSingle()

    if (duplicateFolder) {
      return NextResponse.json({
        error: 'Ein Ordner mit diesem Namen existiert bereits in diesem Verzeichnis.'
      }, { status: 409 })
    }
  }

  // Update folder
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description

  const { data: folder, error: updateError } = await supabase
    .from('folders')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      created_by_profile:profiles!folders_created_by_fkey(id, first_name, last_name)
    `)
    .single()

  if (updateError) {
    console.error('Error updating folder:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ folder })
}

// DELETE /api/folders/[id] - Delete folder
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is Vorstand
  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Check folder exists and is not a system folder
  const { data: folder, error: fetchError } = await supabase
    .from('folders')
    .select('id, name, is_system_default')
    .eq('id', id)
    .single()

  if (fetchError || !folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
  }

  if (folder.is_system_default) {
    return NextResponse.json({
      error: 'System-Ordner können nicht gelöscht werden.'
    }, { status: 403 })
  }

  // Check for subfolders
  const { count: subfolderCount } = await supabase
    .from('folders')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', id)

  if (subfolderCount && subfolderCount > 0) {
    return NextResponse.json({
      error: `Dieser Ordner enthält ${subfolderCount} Unterordner. Bitte zuerst alle Unterordner löschen.`
    }, { status: 400 })
  }

  // TODO: Check for documents when document upload is implemented (PROJ-27)
  // const { count: documentCount } = await supabase
  //   .from('documents')
  //   .select('*', { count: 'exact', head: true })
  //   .eq('folder_id', id)
  //
  // if (documentCount && documentCount > 0) {
  //   return NextResponse.json({
  //     error: `Dieser Ordner enthält ${documentCount} Dokumente. Bitte zuerst alle Dokumente löschen oder verschieben.`
  //   }, { status: 400 })
  // }

  // Delete folder
  const { error: deleteError } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Error deleting folder:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// Helper function to handle folder move
async function handleMoveFolder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  folderId: string,
  newParentId: string | null
) {
  // Check folder exists
  const { data: folder, error: fetchError } = await supabase
    .from('folders')
    .select('id, path, parent_id')
    .eq('id', folderId)
    .single()

  if (fetchError || !folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
  }

  // Skip if parent hasn't changed
  if (folder.parent_id === newParentId) {
    const { data: existingFolder } = await supabase
      .from('folders')
      .select(`
        *,
        created_by_profile:profiles!folders_created_by_fkey(id, first_name, last_name)
      `)
      .eq('id', folderId)
      .single()
    return NextResponse.json({ folder: existingFolder })
  }

  // Check new parent exists (if not root)
  let newParentPermissions: Array<{ role: string | null; group_id: string | null; profile_id: string | null }> = []

  if (newParentId) {
    const { data: newParent, error: parentError } = await supabase
      .from('folders')
      .select('id, path, depth')
      .eq('id', newParentId)
      .single()

    if (parentError || !newParent) {
      return NextResponse.json({ error: 'Target folder not found' }, { status: 404 })
    }

    // Check for circular reference (can't move folder into itself or its children)
    if (newParent.path.startsWith(folder.path)) {
      return NextResponse.json({
        error: 'Ein Ordner kann nicht in sich selbst verschoben werden.'
      }, { status: 400 })
    }

    // Check max depth
    if (newParent.depth >= 5) {
      return NextResponse.json({
        error: 'Maximale Ordner-Tiefe erreicht. Bitte einen Ordner weiter oben wählen.'
      }, { status: 400 })
    }

    // Fetch parent's permissions for inheritance
    const { data: parentPerms } = await supabase
      .from('folder_permissions')
      .select('role, group_id, profile_id')
      .eq('folder_id', newParentId)

    newParentPermissions = parentPerms || []
  }

  // Update folder's parent
  const { data: updatedFolder, error: updateError } = await supabase
    .from('folders')
    .update({ parent_id: newParentId })
    .eq('id', folderId)
    .select(`
      *,
      created_by_profile:profiles!folders_created_by_fkey(id, first_name, last_name)
    `)
    .single()

  if (updateError) {
    console.error('Error moving folder:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // BUG-1 FIX: Update permissions after folder move
  // Step 1: Delete all existing permissions for this folder
  const { error: deletePermError } = await supabase
    .from('folder_permissions')
    .delete()
    .eq('folder_id', folderId)

  if (deletePermError) {
    console.error('Error deleting old permissions:', deletePermError)
    // Continue anyway - folder was moved successfully
  }

  // Step 2: Add new inherited permissions from new parent (or default Vorstand for root)
  if (newParentId && newParentPermissions.length > 0) {
    // Inherit permissions from new parent
    const permissionsToInsert = newParentPermissions.map(perm => ({
      folder_id: folderId,
      role: perm.role,
      group_id: perm.group_id,
      profile_id: perm.profile_id,
      is_inherited: true,
    }))

    const { error: insertPermError } = await supabase
      .from('folder_permissions')
      .insert(permissionsToInsert)

    if (insertPermError) {
      console.error('Error inserting inherited permissions:', insertPermError)
    }
  } else {
    // Root level: default to Vorstand only
    const { error: insertPermError } = await supabase
      .from('folder_permissions')
      .insert({
        folder_id: folderId,
        role: 'vorstand',
        is_inherited: false,
      })

    if (insertPermError) {
      console.error('Error inserting default permission:', insertPermError)
    }
  }

  // Step 3: Also update permissions for all subfolders (recursive inheritance)
  await updateSubfolderPermissions(supabase, folderId)

  return NextResponse.json({ folder: updatedFolder })
}

// Helper function to recursively update subfolder permissions
async function updateSubfolderPermissions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parentFolderId: string
) {
  // Get parent's current permissions
  const { data: parentPerms } = await supabase
    .from('folder_permissions')
    .select('role, group_id, profile_id')
    .eq('folder_id', parentFolderId)

  if (!parentPerms || parentPerms.length === 0) return

  // Get all direct subfolders
  const { data: subfolders } = await supabase
    .from('folders')
    .select('id')
    .eq('parent_id', parentFolderId)

  if (!subfolders || subfolders.length === 0) return

  for (const subfolder of subfolders) {
    // Delete existing inherited permissions
    await supabase
      .from('folder_permissions')
      .delete()
      .eq('folder_id', subfolder.id)
      .eq('is_inherited', true)

    // Insert new inherited permissions
    const permissionsToInsert = parentPerms.map(perm => ({
      folder_id: subfolder.id,
      role: perm.role,
      group_id: perm.group_id,
      profile_id: perm.profile_id,
      is_inherited: true,
    }))

    await supabase
      .from('folder_permissions')
      .insert(permissionsToInsert)

    // Recurse for nested subfolders
    await updateSubfolderPermissions(supabase, subfolder.id)
  }
}
