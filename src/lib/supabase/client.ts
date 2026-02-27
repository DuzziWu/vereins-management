import { createBrowserClient } from '@supabase/ssr'

// Note: Using `any` for database types until proper types are generated
// Run `npx supabase gen types typescript --project-id your-project-id` to generate full types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient() {
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
