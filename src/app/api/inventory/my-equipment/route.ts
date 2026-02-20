import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/inventory/my-equipment - Get items loaned to the current user
export async function GET() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's profile ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Fetch items loaned to this user
  const { data: items, error } = await supabase
    .from('inventory_items')
    .select(`
      id,
      name,
      description,
      inventory_number,
      status,
      size_info,
      loaned_at,
      category:inventory_categories(id, name, icon),
      images:inventory_item_images(id, storage_path, sort_order)
    `)
    .eq('current_holder_id', profile.id)
    .eq('status', 'loaned')
    .eq('is_archived', false)
    .order('loaned_at', { ascending: false })

  if (error) {
    console.error('Error fetching my equipment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add public URLs for images and sort them
  const itemsWithUrls = items.map((item) => {
    const sortedImages = item.images
      ? [...item.images].sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      : []

    const imagesWithUrls = sortedImages.map((img: { storage_path: string }) => {
      const { data: publicUrl } = supabase.storage
        .from('inventory-images')
        .getPublicUrl(img.storage_path)
      return {
        ...img,
        public_url: publicUrl.publicUrl,
      }
    })

    return {
      ...item,
      images: imagesWithUrls,
    }
  })

  return NextResponse.json({ items: itemsWithUrls })
}
