import { createBrowserClient } from "@supabase/ssr"

// Module singleton. Hooks call createClient() in their render body, so a fresh
// client on every render churned the auth listener and wasted allocations.
// createBrowserClient is safe to share for the lifetime of the tab.
let browserClient: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}
