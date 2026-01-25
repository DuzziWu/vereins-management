import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateFamilySchema = z.object({
  name: z.string().min(2, 'Mindestens 2 Zeichen').optional(),
  primary_member_id: z.string().uuid().optional(),
  member_ids: z.array(z.string().uuid()).optional()
})

// GET /api/families/[id] - Get a single family with members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid family ID format' }, { status: 400 })
  }

  const { data: family, error } = await supabase
    .from('families')
    .select(`
      *,
      primary_member:profiles!families_primary_member_id_fkey (
        id,
        first_name,
        last_name
      ),
      members:profiles!profiles_family_id_fkey (
        id,
        first_name,
        last_name,
        role,
        status,
        date_of_birth,
        phone
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }
    console.error('Error fetching family:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    family: {
      ...family,
      member_count: family.members?.length || 0
    }
  })
}

// PATCH /api/families/[id] - Update a family
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid family ID format' }, { status: 400 })
  }

  // Check if family exists
  const { data: existingFamily, error: fetchError } = await supabase
    .from('families')
    .select('id, primary_member_id')
    .eq('id', id)
    .single()

  if (fetchError || !existingFamily) {
    return NextResponse.json({ error: 'Family not found' }, { status: 404 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = updateFamilySchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { name, primary_member_id, member_ids } = validation.data

  // If member_ids is provided, update member assignments
  if (member_ids !== undefined) {
    // Get current members
    const { data: currentMembers } = await supabase
      .from('profiles')
      .select('id')
      .eq('family_id', id)

    const currentMemberIds = currentMembers?.map(m => m.id) || []

    // Members to remove from family
    const membersToRemove = currentMemberIds.filter(mId => !member_ids.includes(mId))

    // Members to add to family
    const membersToAdd = member_ids.filter(mId => !currentMemberIds.includes(mId))

    // Remove old members (set family_id to null)
    if (membersToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('profiles')
        .update({ family_id: null, updated_at: new Date().toISOString() })
        .in('id', membersToRemove)

      if (removeError) {
        console.error('Error removing members from family:', removeError)
        return NextResponse.json({ error: removeError.message }, { status: 500 })
      }
    }

    // Add new members
    if (membersToAdd.length > 0) {
      const { error: addError } = await supabase
        .from('profiles')
        .update({ family_id: id, updated_at: new Date().toISOString() })
        .in('id', membersToAdd)

      if (addError) {
        console.error('Error adding members to family:', addError)
        return NextResponse.json({ error: addError.message }, { status: 500 })
      }
    }
  }

  // Build update object for family
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }

  if (name !== undefined) updateData.name = name
  if (primary_member_id !== undefined) {
    // Verify primary_member belongs to this family
    if (member_ids) {
      if (!member_ids.includes(primary_member_id)) {
        return NextResponse.json({
          error: 'Primary member must be one of the family members'
        }, { status: 400 })
      }
    } else {
      // Check against existing members
      const { data: members } = await supabase
        .from('profiles')
        .select('id')
        .eq('family_id', id)

      const memberIdList = members?.map(m => m.id) || []
      if (!memberIdList.includes(primary_member_id)) {
        return NextResponse.json({
          error: 'Primary member must be one of the family members'
        }, { status: 400 })
      }
    }
    updateData.primary_member_id = primary_member_id
  }

  // Update family
  const { error: updateError } = await supabase
    .from('families')
    .update(updateData)
    .eq('id', id)

  if (updateError) {
    console.error('Error updating family:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Fetch updated family
  const { data: family, error: refetchError } = await supabase
    .from('families')
    .select(`
      *,
      primary_member:profiles!families_primary_member_id_fkey (
        id,
        first_name,
        last_name
      ),
      members:profiles!profiles_family_id_fkey (
        id,
        first_name,
        last_name,
        role,
        status
      )
    `)
    .eq('id', id)
    .single()

  if (refetchError) {
    console.error('Error fetching updated family:', refetchError)
    return NextResponse.json({ error: refetchError.message }, { status: 500 })
  }

  return NextResponse.json({
    family: {
      ...family,
      member_count: family.members?.length || 0
    }
  })
}

// DELETE /api/families/[id] - Dissolve a family
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid family ID format' }, { status: 400 })
  }

  // Check if family exists
  const { data: existingFamily, error: fetchError } = await supabase
    .from('families')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError || !existingFamily) {
    return NextResponse.json({ error: 'Family not found' }, { status: 404 })
  }

  // Remove family reference from all members (dissolve the family)
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ family_id: null, updated_at: new Date().toISOString() })
    .eq('family_id', id)

  if (updateError) {
    console.error('Error removing family from members:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Delete the family
  const { error: deleteError } = await supabase
    .from('families')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Error deleting family:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Family dissolved successfully' })
}
