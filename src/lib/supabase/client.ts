import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use your actual Supabase credentials here, or environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kdlkjslkdjs.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMAs5qHuBk'

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}