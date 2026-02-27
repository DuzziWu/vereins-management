import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/members/[id]/loans - Get loan history for a member (Vorstand only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: memberId } = await params
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

  // Parse query parameters
  const { searchParams } = new URL(request.url)
  const active_only = searchParams.get('active_only') === 'true'
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  // Check if member exists
  const { data: member, error: memberError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('id', memberId)
    .single()

  if (memberError || !member) {
    return NextResponse.json({ error: 'Mitglied nicht gefunden' }, { status: 404 })
  }

  // Build query
  let query = supabase
    .from('inventory_loans')
    .select(`
      *,
      item:inventory_items!inventory_loans_item_id_fkey(
        id, name, inventory_number, status,
        category:inventory_categories(id, name, icon),
        images:inventory_item_images(id, storage_path, sort_order)
      ),
      loaned_by_profile:profiles!inventory_loans_loaned_by_fkey(id, first_name, last_name),
      returned_by_profile:profiles!inventory_loans_returned_by_fkey(id, first_name, last_name),
      return_location:inventory_locations!inventory_loans_return_location_id_fkey(id, name)
    `, { count: 'exact' })
    .eq('borrower_id', memberId)
    .order('loaned_at', { ascending: false })

  if (active_only) {
    query = query.is('returned_at', null)
  }

  const { data: loans, error, count } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching member loans:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add public URLs to item images
  const loansWithUrls = loans?.map(loan => {
    if (loan.item?.images) {
      const sortedImages = loan.item.images
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((img: { storage_path: string; id: string; sort_order: number }) => {
          const { data: publicUrl } = supabase.storage
            .from('inventory-images')
            .getPublicUrl(img.storage_path)
          return {
            ...img,
            public_url: publicUrl.publicUrl,
          }
        })
      return {
        ...loan,
        item: {
          ...loan.item,
          images: sortedImages,
        },
      }
    }
    return loan
  })

  // Get active loans count
  const { data: activeLoansCount } = await supabase
    .from('inventory_loans')
    .select('id', { count: 'exact', head: true })
    .eq('borrower_id', memberId)
    .is('returned_at', null)

  return NextResponse.json({
    member: {
      id: member.id,
      first_name: member.first_name,
      last_name: member.last_name,
    },
    loans: loansWithUrls,
    stats: {
      total_loans: count || 0,
      active_loans: activeLoansCount || 0,
    },
    pagination: {
      total: count ?? 0,
      limit,
      offset,
    },
  })
}
