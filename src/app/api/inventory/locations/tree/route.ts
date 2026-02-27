import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface LocationNode {
  id: string
  name: string
  description: string | null
  depth: number
  path: string
  item_count: number
  children: LocationNode[]
}

// GET /api/inventory/locations/tree - Get locations as a hierarchical tree
export async function GET() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all locations
  const { data: locations, error } = await supabase
    .from('inventory_locations')
    .select('id, name, description, parent_id, depth, path')
    .order('name')

  if (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get item counts for each location
  const { data: itemCounts } = await supabase
    .from('inventory_items')
    .select('location_id')
    .not('location_id', 'is', null)
    .eq('is_archived', false)

  const countMap = new Map<string, number>()
  itemCounts?.forEach(item => {
    if (item.location_id) {
      countMap.set(item.location_id, (countMap.get(item.location_id) || 0) + 1)
    }
  })

  // Build tree structure
  const buildTree = (parentId: string | null = null): LocationNode[] => {
    return locations
      ?.filter(loc => loc.parent_id === parentId)
      .map(loc => ({
        id: loc.id,
        name: loc.name,
        description: loc.description,
        depth: loc.depth,
        path: loc.path,
        item_count: countMap.get(loc.id) || 0,
        children: buildTree(loc.id),
      })) || []
  }

  const tree = buildTree()

  // Also return flat list for dropdowns
  const flatList = locations?.map(loc => ({
    id: loc.id,
    name: loc.name,
    depth: loc.depth,
    path: loc.path,
    item_count: countMap.get(loc.id) || 0,
    // Generate full path name for display
    display_name: generateDisplayName(loc, locations || []),
  })) || []

  return NextResponse.json({
    tree,
    flat: flatList,
  })
}

// Generate display name with parent path
function generateDisplayName(
  location: { id: string; name: string; path: string },
  allLocations: Array<{ id: string; name: string; path: string }>
): string {
  const pathIds = location.path.split('/').filter(Boolean)
  if (pathIds.length <= 1) {
    return location.name
  }

  const names: string[] = []
  for (const id of pathIds) {
    const loc = allLocations.find(l => l.id === id)
    if (loc) {
      names.push(loc.name)
    }
  }

  return names.join(' > ')
}
