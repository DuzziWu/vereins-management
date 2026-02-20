import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { folderCreateSchema } from '@/lib/validations/folders'

// =============================================
// PROJ-26: Folders API Routes
// GET /api/folders - List folders (tree structure)
// POST /api/folders - Create a new folder (Vorstand only)
// =============================================

// GET /api/folders - List all folders the user has access to
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Check authentication
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

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams
  const parentId = searchParams.get('parent_id') // null = root level
  const includeChildren = searchParams.get('include_children') === 'true'
  const search = searchParams.get('search') || ''

  // Build query
  let query = supabase
    .from('folders')
    .select(`
      *,
      created_by_profile:profiles!created_by(id, first_name, last_name)
    `)
    .order('name', { ascending: true })

  // Filter by parent
  if (parentId === 'null' || parentId === '') {
    query = query.is('parent_id', null)
  } else if (parentId) {
    query = query.eq('parent_id', parentId)
  }

  // Search filter
  if (search && search.length >= 2) {
    const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&')
    query = query.ilike('name', `%${sanitizedSearch}%`)
  }

  const { data: folders, error } = await query

  if (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If include_children is true, fetch child counts
  let enrichedFolders = folders || []
  if (folders && folders.length > 0) {
    const folderIds = folders.map(f => f.id)

    // Get child folder counts
    const { data: childCounts } = await supabase
      .from('folders')
      .select('parent_id')
      .in('parent_id', folderIds)

    const childCountMap = new Map<string, number>()
    for (const child of (childCounts || [])) {
      if (child.parent_id) {
        childCountMap.set(child.parent_id, (childCountMap.get(child.parent_id) || 0) + 1)
      }
    }

    enrichedFolders = folders.map(folder => ({
      ...folder,
      child_count: childCountMap.get(folder.id) || 0,
    }))
  }

  return NextResponse.json({ folders: enrichedFolders })
}

// POST /api/folders - Create a new folder (Vorstand only)
export async function POST(request: NextRequest) {
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

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = folderCreateSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Check parent folder exists and get its depth
  if (data.parent_id) {
    const { data: parentFolder, error: parentError } = await supabase
      .from('folders')
      .select('id, depth')
      .eq('id', data.parent_id)
      .single()

    if (parentError || !parentFolder) {
      return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 })
    }

    // Check max depth (parent depth + 1 must be <= 5)
    if (parentFolder.depth >= 5) {
      return NextResponse.json({
        error: 'Maximale Ordner-Tiefe erreicht. Bitte einen Ordner weiter oben wählen.'
      }, { status: 400 })
    }
  }

  // Check for duplicate name in same parent
  let duplicateQuery = supabase
    .from('folders')
    .select('id')
    .eq('name', data.name)

  if (data.parent_id) {
    duplicateQuery = duplicateQuery.eq('parent_id', data.parent_id)
  } else {
    duplicateQuery = duplicateQuery.is('parent_id', null)
  }

  const { data: existingFolder } = await duplicateQuery.maybeSingle()

  if (existingFolder) {
    return NextResponse.json({
      error: 'Ein Ordner mit diesem Namen existiert bereits in diesem Verzeichnis.'
    }, { status: 409 })
  }

  // Insert folder
  const { data: folder, error: insertError } = await supabase
    .from('folders')
    .insert({
      name: data.name,
      description: data.description || null,
      parent_id: data.parent_id || null,
      created_by: profile.id,
    })
    .select(`
      *,
      created_by_profile:profiles!created_by(id, first_name, last_name)
    `)
    .single()

  if (insertError) {
    console.error('Error creating folder:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Insert permissions for the selected roles
  const roles = data.roles || ['vorstand']
  const permissionsToInsert = roles.map(role => ({
    folder_id: folder.id,
    role: role,
    is_inherited: false,
  }))

  const { error: permError } = await supabase
    .from('folder_permissions')
    .insert(permissionsToInsert)

  if (permError) {
    console.error('Error creating folder permissions:', permError)
    // Rollback folder creation
    await supabase.from('folders').delete().eq('id', folder.id)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Berechtigungen' }, { status: 500 })
  }

  return NextResponse.json({ folder }, { status: 201 })
}
