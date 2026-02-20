import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ id: string }> }

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_IMAGES_PER_ITEM = 5

// POST /api/inventory/items/[id]/images - Upload an image for an item
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

  // Validate UUID format
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid item ID format' }, { status: 400 })
  }

  // Check if item exists
  const { data: item, error: itemError } = await supabase
    .from('inventory_items')
    .select('id')
    .eq('id', id)
    .single()

  if (itemError || !item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  // Check current image count
  const { count: imageCount } = await supabase
    .from('inventory_item_images')
    .select('*', { count: 'exact', head: true })
    .eq('item_id', id)

  if (imageCount !== null && imageCount >= MAX_IMAGES_PER_ITEM) {
    return NextResponse.json({ error: `Maximal ${MAX_IMAGES_PER_ITEM} Bilder pro Item erlaubt` }, { status: 400 })
  }

  // Parse form data
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Nur JPG, PNG oder WebP erlaubt' }, { status: 400 })
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Maximal 5 MB pro Bild' }, { status: 400 })
  }

  // Generate unique filename
  const extension = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
  const imageId = crypto.randomUUID()
  const storagePath = `${id}/${imageId}.${extension}`

  // Upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('inventory-images')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading image:', uploadError)
    return NextResponse.json({ error: 'Fehler beim Hochladen des Bildes' }, { status: 500 })
  }

  // Get current max sort order
  const { data: maxSortOrder } = await supabase
    .from('inventory_item_images')
    .select('sort_order')
    .eq('item_id', id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSortOrder = (maxSortOrder?.sort_order ?? -1) + 1

  // Create database record
  const { data: imageRecord, error: dbError } = await supabase
    .from('inventory_item_images')
    .insert({
      item_id: id,
      storage_path: storagePath,
      sort_order: nextSortOrder,
    })
    .select()
    .single()

  if (dbError) {
    console.error('Error creating image record:', dbError)
    // Clean up uploaded file
    await supabase.storage.from('inventory-images').remove([storagePath])
    return NextResponse.json({ error: 'Fehler beim Speichern des Bildes' }, { status: 500 })
  }

  // Get public URL
  const { data: publicUrl } = supabase.storage
    .from('inventory-images')
    .getPublicUrl(storagePath)

  return NextResponse.json({
    image: {
      ...imageRecord,
      public_url: publicUrl.publicUrl,
    },
  })
}

// DELETE /api/inventory/items/[id]/images?image_id=xxx - Delete an image
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

  // Get image_id from query params
  const imageId = request.nextUrl.searchParams.get('image_id')
  if (!imageId || !UUID_REGEX.test(imageId)) {
    return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 })
  }

  // Get image record
  const { data: image, error: fetchError } = await supabase
    .from('inventory_item_images')
    .select('*')
    .eq('id', imageId)
    .eq('item_id', id)
    .single()

  if (fetchError || !image) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('inventory-images')
    .remove([image.storage_path])

  if (storageError) {
    console.error('Error deleting image from storage:', storageError)
  }

  // Delete database record
  const { error: dbError } = await supabase
    .from('inventory_item_images')
    .delete()
    .eq('id', imageId)

  if (dbError) {
    console.error('Error deleting image record:', dbError)
    return NextResponse.json({ error: 'Fehler beim Löschen des Bildes' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
