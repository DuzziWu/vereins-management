import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { locationPatchSchema } from '@/lib/validations/inventory'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/inventory/locations/[id] - Get a single location with items
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch location
  const { data: location, error } = await supabase
    .from('inventory_locations')
    .select(`
      *,
      parent:inventory_locations!inventory_locations_parent_id_fkey(id, name, path),
      created_by_profile:profiles!inventory_locations_created_by_fkey(id, first_name, last_name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Lagerort nicht gefunden' }, { status: 404 })
    }
    console.error('Error fetching location:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch items at this location
  const { data: items } = await supabase
    .from('inventory_items')
    .select(`
      id, name, inventory_number, status, condition,
      category:inventory_categories(id, name, icon),
      current_holder:profiles!inventory_items_current_holder_id_fkey(id, first_name, last_name),
      images:inventory_item_images(id, storage_path, sort_order)
    `)
    .eq('location_id', id)
    .eq('is_archived', false)
    .order('name')
    .limit(100)

  // Add public URLs to images
  const itemsWithUrls = items?.map(item => {
    const sortedImages = item.images
      ?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      ?.map((img: { storage_path: string; id: string; sort_order: number }) => {
        const { data: publicUrl } = supabase.storage
          .from('inventory-images')
          .getPublicUrl(img.storage_path)
        return {
          ...img,
          public_url: publicUrl.publicUrl,
        }
      }) ?? []
    return { ...item, images: sortedImages }
  })

  // Fetch child locations
  const { data: children } = await supabase
    .from('inventory_locations')
    .select('id, name, depth')
    .eq('parent_id', id)
    .order('name')

  // Build breadcrumb from path
  const pathIds = location.path.split('/').filter(Boolean)
  let breadcrumb: { id: string; name: string }[] = []

  if (pathIds.length > 1) {
    const { data: ancestors } = await supabase
      .from('inventory_locations')
      .select('id, name')
      .in('id', pathIds.slice(0, -1)) // Exclude current location

    // Sort ancestors by path order
    type Ancestor = { id: string; name: string }
    breadcrumb = pathIds
      .slice(0, -1)
      .map((pid: string) => ancestors?.find((a: Ancestor) => a.id === pid))
      .filter((a: Ancestor | undefined): a is Ancestor => a !== undefined)
  }

  return NextResponse.json({
    location: {
      ...location,
      item_count: items?.length || 0,
      items: itemsWithUrls,
      children,
      breadcrumb,
    },
  })
}

// PATCH /api/inventory/locations/[id] - Update a location (Vorstand only)
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

  // Check if location exists
  const { data: existingLocation, error: fetchError } = await supabase
    .from('inventory_locations')
    .select('id, parent_id')
    .eq('id', id)
    .single()

  if (fetchError || !existingLocation) {
    return NextResponse.json({ error: 'Lagerort nicht gefunden' }, { status: 404 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = locationPatchSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const data = validation.data

  // Check if changing parent would create a cycle or exceed depth
  if (data.parent_id !== undefined && data.parent_id !== existingLocation.parent_id) {
    if (data.parent_id === id) {
      return NextResponse.json({ error: 'Lagerort kann nicht sein eigener Parent sein' }, { status: 400 })
    }

    if (data.parent_id) {
      // Check if new parent is a descendant of this location (would create cycle)
      const { data: potentialParent } = await supabase
        .from('inventory_locations')
        .select('path, depth')
        .eq('id', data.parent_id)
        .single()

      if (potentialParent?.path.includes(id)) {
        return NextResponse.json({
          error: 'Kann nicht in einen Unterlagerort verschoben werden'
        }, { status: 400 })
      }

      // Check depth limit
      if (potentialParent && potentialParent.depth >= 4) {
        return NextResponse.json({
          error: 'Maximale Lagerort-Tiefe erreicht (5 Ebenen)'
        }, { status: 400 })
      }
    }
  }

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.parent_id !== undefined) updateData.parent_id = data.parent_id

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Update location
  const { data: location, error: updateError } = await supabase
    .from('inventory_locations')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      parent:inventory_locations!inventory_locations_parent_id_fkey(id, name)
    `)
    .single()

  if (updateError) {
    console.error('Error updating location:', updateError)
    if (updateError.code === '23505') {
      return NextResponse.json({
        error: 'Ein Lagerort mit diesem Namen existiert bereits an dieser Position'
      }, { status: 409 })
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ location })
}

// DELETE /api/inventory/locations/[id] - Delete a location (Vorstand only)
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

  // Check if location exists
  const { data: location, error: fetchError } = await supabase
    .from('inventory_locations')
    .select('id, name')
    .eq('id', id)
    .single()

  if (fetchError || !location) {
    return NextResponse.json({ error: 'Lagerort nicht gefunden' }, { status: 404 })
  }

  // Check if location has items
  const { data: hasItems } = await supabase.rpc('location_has_items', { location_uuid: id })
  if (hasItems) {
    return NextResponse.json({
      error: 'Dieser Lagerort enthält Items. Bitte zuerst alle Items einem anderen Lagerort zuweisen.'
    }, { status: 400 })
  }

  // Check if location has children
  const { data: hasChildren } = await supabase.rpc('location_has_children', { location_uuid: id })
  if (hasChildren) {
    return NextResponse.json({
      error: 'Dieser Lagerort enthält Unterlagerorte. Bitte zuerst alle Unterlagerorte löschen.'
    }, { status: 400 })
  }

  // Delete location
  const { error: deleteError } = await supabase
    .from('inventory_locations')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Error deleting location:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
