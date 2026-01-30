import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { groupPatchSchema } from '@/lib/validations/group'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/groups/[id] - Get a single group with full details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  // BUG-2/SEC-2: Validate UUID format
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid group ID format' }, { status: 400 })
  }

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // BUG-2: Get user profile for authorization check
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Fetch group with trainer
  const { data: group, error } = await supabase
    .from('groups')
    .select(`
      *,
      trainer:profiles!groups_trainer_id_fkey(id, first_name, last_name)
    `)
    .eq('id', id)
    .single()

  if (error || !group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  // BUG-2: Authorization check - enforce role-based access control
  if (profile.role !== 'vorstand') {
    if (profile.role === 'trainer') {
      // Trainer can only see groups where they are trainer or co-trainer
      const isMainTrainer = group.trainer_id === profile.id
      if (!isMainTrainer) {
        const { data: coTrainerEntry } = await supabase
          .from('group_trainers')
          .select('id')
          .eq('group_id', id)
          .eq('profile_id', profile.id)
          .maybeSingle()

        if (!coTrainerEntry) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
    } else {
      // Mitglied can only see groups they are a member of
      const { data: memberEntry } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', id)
        .eq('profile_id', profile.id)
        .maybeSingle()

      if (!memberEntry) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  }

  // Fetch co-trainers, members, member count, and age range in parallel
  const [coTrainersResult, membersResult, countResult, ageResult] = await Promise.all([
    supabase
      .from('group_trainers')
      .select('profile:profiles!group_trainers_profile_id_fkey(id, first_name, last_name)')
      .eq('group_id', id),
    supabase
      .from('group_members')
      .select('profile:profiles!group_members_profile_id_fkey(id, first_name, last_name, date_of_birth, functional_tags)')
      .eq('group_id', id),
    supabase.rpc('get_group_member_count', { p_group_id: id }),
    supabase.rpc('get_group_age_range', { p_group_id: id }),
  ])

  const co_trainers = (coTrainersResult.data || [])
    .map((ct: { profile: unknown }) => ct.profile)
    .filter(Boolean)

  const members = (membersResult.data || [])
    .map((m: { profile: unknown }) => m.profile)
    .filter(Boolean)

  return NextResponse.json({
    group: {
      ...group,
      co_trainers,
      members,
      member_count: countResult.data ?? 0,
      age_range: ageResult.data ?? 'Keine Mitglieder',
    }
  })
}

// PATCH /api/groups/[id] - Update a group
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  // BUG-14: Validate UUID format (consistency with GET handler)
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid group ID format' }, { status: 400 })
  }

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

  const isVorstand = profile.role === 'vorstand'

  // Fetch existing group (needed for access check, BUG-5 auto-promotion, BUG-9 validation)
  const { data: existingGroup } = await supabase
    .from('groups')
    .select('trainer_id')
    .eq('id', id)
    .single()

  if (!existingGroup) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  // If not Vorstand, check if the user is a trainer or co-trainer of this group
  if (!isVorstand) {
    const isMainTrainer = existingGroup.trainer_id === profile.id

    const { data: coTrainerEntry } = await supabase
      .from('group_trainers')
      .select('id')
      .eq('group_id', id)
      .eq('profile_id', profile.id)
      .maybeSingle()

    const isCoTrainer = !!coTrainerEntry

    if (!isMainTrainer && !isCoTrainer) {
      return NextResponse.json({ error: 'Forbidden: Only Vorstand or the assigned trainer can edit this group' }, { status: 403 })
    }
  }

  // Parse and validate request body with Zod (SEC-5)
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // SEC-5: Validate input with Zod schema
  const parsed = groupPatchSchema.safeParse(body)
  if (!parsed.success) {
    const errors = parsed.error.issues.map(i => i.message).join(', ')
    return NextResponse.json({ error: `Ungültige Eingabe: ${errors}` }, { status: 400 })
  }
  // Use validated data as body (cast to Record for dynamic field iteration below)
  body = parsed.data as Record<string, unknown>

  // BUG-9: Server-side validation - trainer cannot be co-trainer
  if (body.co_trainer_ids && Array.isArray(body.co_trainer_ids)) {
    const effectiveTrainerId = body.trainer_id || existingGroup.trainer_id
    if (effectiveTrainerId && body.co_trainer_ids.includes(effectiveTrainerId)) {
      return NextResponse.json({ error: 'Diese Person ist bereits als Trainer zugewiesen' }, { status: 400 })
    }
  }

  // BUG-5: Auto-promotion of co-trainer when trainer is removed
  if (isVorstand && 'trainer_id' in body && (!body.trainer_id || body.trainer_id === '')) {
    const { data: coTrainers } = await supabase
      .from('group_trainers')
      .select('profile_id')
      .eq('group_id', id)
      .order('created_at', { ascending: true })
      .limit(1)

    if (coTrainers && coTrainers.length > 0) {
      // Promote first co-trainer to trainer
      body.trainer_id = coTrainers[0].profile_id
      // Remove promoted co-trainer from group_trainers
      await supabase
        .from('group_trainers')
        .delete()
        .eq('group_id', id)
        .eq('profile_id', coTrainers[0].profile_id)
      // Also filter from co_trainer_ids if provided in body
      if (body.co_trainer_ids && Array.isArray(body.co_trainer_ids)) {
        body.co_trainer_ids = body.co_trainer_ids.filter((ctId: string) => ctId !== coTrainers[0].profile_id)
      }
    } else {
      return NextResponse.json(
        { error: 'Gruppe hat keinen Trainer. Bitte neuen Trainer zuweisen oder einen Co-Trainer hinzufügen.' },
        { status: 400 }
      )
    }
  }

  // Build update object based on role
  // BUG-4: Removed chat_enabled (only settable at creation)
  // BUG-7: Added is_active to vorstand allowed fields
  const trainerAllowedFields = ['description', 'training_day', 'training_start_time', 'training_end_time', 'training_location']
  const vorstandAllowedFields = [
    ...trainerAllowedFields,
    'name', 'max_members', 'trainer_id', 'is_active',
  ]

  const allowedFields = isVorstand ? vorstandAllowedFields : trainerAllowedFields

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {}
  for (const field of allowedFields) {
    if (field in body) {
      const value = body[field]
      // Handle boolean fields (is_active) properly
      if (typeof value === 'boolean') {
        updateData[field] = value
      } else if (value === '' || value === undefined) {
        updateData[field] = null
      } else {
        updateData[field] = value
      }
    }
  }

  // BUG-1: Case-insensitive check for duplicate name
  if (updateData.name) {
    const escapedName = updateData.name.replace(/[%_\\]/g, '\\$&')
    const { data: duplicateGroup } = await supabase
      .from('groups')
      .select('id')
      .ilike('name', escapedName)
      .eq('is_active', true)
      .neq('id', id)
      .maybeSingle()

    if (duplicateGroup) {
      return NextResponse.json({ error: 'Eine Gruppe mit diesem Namen existiert bereits' }, { status: 409 })
    }
  }

  // Validate time range if both times provided
  const startTime = updateData.training_start_time || body.training_start_time
  const endTime = updateData.training_end_time || body.training_end_time
  if (startTime && endTime && endTime <= startTime) {
    return NextResponse.json({ error: 'Endzeit muss nach der Startzeit liegen' }, { status: 400 })
  }

  // Update the group
  if (Object.keys(updateData).length > 0) {
    const { error: updateError } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating group:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  }

  // Handle co-trainer updates (Vorstand only)
  if (isVorstand && 'co_trainer_ids' in body) {
    let coTrainerIds: string[] = (body.co_trainer_ids as string[] | undefined) || []

    // BUG-9: Ensure trainer is not in co-trainer list (server-side)
    const currentTrainerId = updateData.trainer_id || existingGroup.trainer_id
    if (currentTrainerId) {
      coTrainerIds = coTrainerIds.filter(ctId => ctId !== currentTrainerId)
    }

    // Delete existing co-trainers
    const { error: deleteError } = await supabase
      .from('group_trainers')
      .delete()
      .eq('group_id', id)

    if (deleteError) {
      console.error('Error removing co-trainers:', deleteError)
    }

    // Insert new co-trainers
    if (coTrainerIds.length > 0) {
      const coTrainerRows = coTrainerIds.map((profileId) => ({
        group_id: id,
        profile_id: profileId,
        role: 'co_trainer',
      }))

      const { error: insertError } = await supabase
        .from('group_trainers')
        .insert(coTrainerRows)

      if (insertError) {
        console.error('Error adding co-trainers:', insertError)
      }
    }
  } else if (isVorstand && updateData.trainer_id && !('co_trainer_ids' in body)) {
    // If trainer changed but co_trainer_ids not explicitly sent,
    // remove the new trainer from existing co-trainers to prevent conflict
    await supabase
      .from('group_trainers')
      .delete()
      .eq('group_id', id)
      .eq('profile_id', updateData.trainer_id)
  }

  // Handle member updates (Vorstand or trainer/co-trainer of this group)
  if ('member_ids' in body) {
    const memberIds: string[] = (body.member_ids as string[] | undefined) || []

    // Delete existing members
    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', id)

    if (deleteError) {
      console.error('Error removing members:', deleteError)
    }

    // Insert new members
    if (memberIds.length > 0) {
      const memberRows = memberIds.map((profileId) => ({
        group_id: id,
        profile_id: profileId,
      }))

      const { error: insertError } = await supabase
        .from('group_members')
        .insert(memberRows)

      if (insertError) {
        console.error('Error adding members:', insertError)
      }
    }
  }

  // Fetch and return the updated group
  const { data: updatedGroup } = await supabase
    .from('groups')
    .select(`
      *,
      trainer:profiles!groups_trainer_id_fkey(id, first_name, last_name)
    `)
    .eq('id', id)
    .single()

  return NextResponse.json({ group: updatedGroup })
}

// DELETE /api/groups/[id] - Soft delete a group (Vorstand only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  // BUG-14: Validate UUID format (consistency with GET handler)
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid group ID format' }, { status: 400 })
  }

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

  // Check group exists
  const { data: existingGroup } = await supabase
    .from('groups')
    .select('id, is_active')
    .eq('id', id)
    .single()

  if (!existingGroup) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  // Toggle is_active or set to false based on request body
  let setActive = false
  try {
    const body = await request.json()
    if (typeof body.is_active === 'boolean') {
      setActive = body.is_active
    }
  } catch {
    // No body provided, default to deactivating
    setActive = false
  }

  const { error: updateError } = await supabase
    .from('groups')
    .update({ is_active: setActive })
    .eq('id', id)

  if (updateError) {
    console.error('Error deactivating group:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    message: setActive ? 'Gruppe aktiviert' : 'Gruppe deaktiviert',
    is_active: setActive
  })
}
