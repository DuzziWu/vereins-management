import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// =============================================
// PROJ-26: Folder Tree API Route
// GET /api/folders/tree - Get complete folder tree structure
// =============================================

interface FolderNode {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  depth: number
  is_system_default: boolean
  created_at: string | null
  child_count: number
  children: FolderNode[]
}

// GET /api/folders/tree - Get complete folder tree
export async function GET() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all folders user has access to (RLS handles filtering)
  const { data: folders, error } = await supabase
    .from('folders')
    .select('id, name, description, parent_id, depth, is_system_default, created_at')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Build tree structure
  const folderMap = new Map<string, FolderNode>()
  const rootFolders: FolderNode[] = []

  // First pass: create all nodes
  for (const folder of (folders || [])) {
    folderMap.set(folder.id, {
      ...folder,
      child_count: 0,
      children: [],
    })
  }

  // Second pass: build tree
  for (const folder of (folders || [])) {
    const node = folderMap.get(folder.id)!

    if (folder.parent_id && folderMap.has(folder.parent_id)) {
      const parent = folderMap.get(folder.parent_id)!
      parent.children.push(node)
      parent.child_count++
    } else {
      rootFolders.push(node)
    }
  }

  // Sort children recursively
  const sortChildren = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name))
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortChildren(node.children)
      }
    }
  }
  sortChildren(rootFolders)

  return NextResponse.json({ tree: rootFolders })
}
