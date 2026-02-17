import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { folderPermissionsUpdateSchema } from '@/lib/validations/folders'

// =============================================
// PROJ-26: Folder Permissions API Routes
// GET /api/folders/[id]/permissions - Get folder permissions
// POST /api/folders/[id]/permissions - Add permissions (Vorstand only)
// DELETE /api/folders/[id]/permissions - Remove permission (Vorstand only)
// =============================================

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET /api/folders/[id]/permissions - Get permissions for a folder
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is Vorstand (only Vorstand can see permissions)
  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Check folder exists
  const { data: folder, error: folderError } = await supabase
    .from('folders')
    .select('id, name, parent_id')
    .eq('id', id)
    .single()

  if (folderError || !folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
  }

  // Fetch permissions with related data
  const { data: permissions, error: permError } = await supabase
    .from('folder_permissions')
    .select(`
      id,
      role,
      group_id,
      profile_id,
      is_inherited,
      created_at,
      group:groups(id, name),
      profile:profiles(id, first_name, last_name)
    `)
    .eq('folder_id', id)
    .order('is_inherited', { ascending: true })
    .order('role', { ascending: true })

  if (permError) {
    console.error('Error fetching permissions:', permError)
    return NextResponse.json({ error: permError.message }, { status: 500 })
  }

  // Get parent folder's permissions for reference
  let parentPermissions: typeof permissions = []
  if (folder.parent_id) {
    const { data: parentPerms } = await supabase
      .from('folder_permissions')
      .select(`
        id,
        role,
        group_id,
        profile_id,
        is_inherited,
        created_at,
        group:groups(id, name),
        profile:profiles(id, first_name, last_name)
      `)
      .eq('folder_id', folder.parent_id)

    parentPermissions = parentPerms || []
  }

  return NextResponse.json({
    folder_id: id,
    permissions: permissions || [],
    parent_permissions: parentPermissions,
  })
}

// POST /api/folders/[id]/permissions - Add permissions to a folder
export async function POST(request: NextRequest, { params }: RouteParams) {
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

  // Add folder_id to body for validation
  body.folder_id = id

  const validation = folderPermissionsUpdateSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Check folder exists
  const { data: folder, error: folderError } = await supabase
    .from('folders')
    .select('id')
    .eq('id', id)
    .single()

  if (folderError || !folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
  }

  // Insert permissions
  const permissionsToInsert = data.permissions.map(perm => ({
    folder_id: id,
    role: perm.role || null,
    group_id: perm.group_id || null,
    profile_id: perm.profile_id || null,
    is_inherited: false,
  }))

  const { data: newPermissions, error: insertError } = await supabase
    .from('folder_permissions')
    .upsert(permissionsToInsert, {
      onConflict: 'folder_id,role',
      ignoreDuplicates: true,
    })
    .select(`
      id,
      role,
      group_id,
      profile_id,
      is_inherited,
      group:groups(id, name),
      profile:profiles(id, first_name, last_name)
    `)

  if (insertError) {
    console.error('Error adding permissions:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ permissions: newPermissions }, { status: 201 })
}

// DELETE /api/folders/[id]/permissions - Remove a permission
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

  // Get permission_id from query params
  const searchParams = request.nextUrl.searchParams
  const permissionId = searchParams.get('permission_id')

  if (!permissionId) {
    return NextResponse.json({ error: 'permission_id is required' }, { status: 400 })
  }

  // Check permission exists and get its details
  const { data: permission, error: permError } = await supabase
    .from('folder_permissions')
    .select('id, folder_id, is_inherited, role')
    .eq('id', permissionId)
    .eq('folder_id', id)
    .single()

  if (permError || !permission) {
    return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
  }

  // Cannot delete inherited permissions
  if (permission.is_inherited) {
    return NextResponse.json({
      error: 'Vererbte Berechtigungen können nicht gelöscht werden. Ändern Sie die Berechtigung im übergeordneten Ordner.'
    }, { status: 403 })
  }

  // Cannot delete the last Vorstand permission (security measure)
  if (permission.role === 'vorstand') {
    const { count } = await supabase
      .from('folder_permissions')
      .select('*', { count: 'exact', head: true })
      .eq('folder_id', id)
      .eq('role', 'vorstand')

    if (count && count <= 1) {
      return NextResponse.json({
        error: 'Die letzte Vorstand-Berechtigung kann nicht entfernt werden.'
      }, { status: 403 })
    }
  }

  // Delete permission
  const { error: deleteError } = await supabase
    .from('folder_permissions')
    .delete()
    .eq('id', permissionId)

  if (deleteError) {
    console.error('Error deleting permission:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
