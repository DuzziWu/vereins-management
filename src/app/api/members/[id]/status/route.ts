import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const statusSchema = z.object({
  status: z.enum(['active', 'inactive', 'pending'])
})

// PATCH /api/members/[id]/status - Update member status (activate/deactivate)
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
    return NextResponse.json({ error: 'Invalid member ID format' }, { status: 400 })
  }

  // Check if member exists
  const { data: existingMember, error: fetchError } = await supabase
    .from('profiles')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchError || !existingMember) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = statusSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }

  const { status } = validation.data

  // Update status (and sync with is_active for backwards compatibility)
  const { data: member, error } = await supabase
    .from('profiles')
    .update({
      status,
      is_active: status === 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      families!profiles_family_id_fkey (
        id,
        name,
        primary_member_id
      )
    `)
    .single()

  if (error) {
    console.error('Error updating member status:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ member })
}
