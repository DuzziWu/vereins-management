import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { workgroupCategoryPatchSchema } from '@/lib/validations/workgroups'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/workgroup-categories/[id] - Get a single category
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 })
  }

  const { data: category, error } = await supabase
    .from('workgroup_categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    console.error('Error fetching workgroup category:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ category })
}

// PATCH /api/workgroup-categories/[id] - Update a category (Vorstand only)
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

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = workgroupCategoryPatchSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Check for duplicate name if name is being updated (case-insensitive)
  if (data.name) {
    const escapedName = data.name.replace(/[%_\\]/g, '\\$&')
    const { data: existingCategory } = await supabase
      .from('workgroup_categories')
      .select('id')
      .ilike('name', escapedName)
      .neq('id', id)
      .maybeSingle()

    if (existingCategory) {
      return NextResponse.json({ error: 'Eine Kategorie mit diesem Namen existiert bereits' }, { status: 409 })
    }
  }

  // Update category
  const { data: category, error: updateError } = await supabase
    .from('workgroup_categories')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    if (updateError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    console.error('Error updating workgroup category:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ category })
}

// DELETE /api/workgroup-categories/[id] - Delete a category (Vorstand only, non-system-default)
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

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 })
  }

  // Check if category exists and is not a system default
  const { data: category, error: fetchError } = await supabase
    .from('workgroup_categories')
    .select('id, is_system_default')
    .eq('id', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    console.error('Error fetching workgroup category:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (category.is_system_default) {
    return NextResponse.json({ error: 'System-Kategorien können nicht gelöscht werden' }, { status: 403 })
  }

  // Check if category is still in use
  const { data: workgroupsUsingCategory, error: usageError } = await supabase
    .from('workgroups')
    .select('id')
    .eq('category_id', id)
    .limit(1)

  if (usageError) {
    console.error('Error checking category usage:', usageError)
    return NextResponse.json({ error: usageError.message }, { status: 500 })
  }

  if (workgroupsUsingCategory && workgroupsUsingCategory.length > 0) {
    return NextResponse.json({
      error: 'Diese Kategorie wird noch von Workgroups verwendet und kann nicht gelöscht werden'
    }, { status: 409 })
  }

  // Delete category
  const { error: deleteError } = await supabase
    .from('workgroup_categories')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Error deleting workgroup category:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
