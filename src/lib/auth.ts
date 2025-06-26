import { createClient } from './supabase/client'

export async function signIn() {
  const supabase = createClient()
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('signIn can only be called on the client side')
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'openid profile email'
    }
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw error
  }
}