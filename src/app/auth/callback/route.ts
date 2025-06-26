import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Auth callback - Code:', code)
    console.log('Auth callback - Data:', data)
    console.log('Auth callback - Error:', error)
    
    if (!error && data.user) {
      // Check if user profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        // Create user profile from auth data
        const userMetadata = data.user.user_metadata
        await supabase.from('users').insert([
          {
            id: data.user.id,
            email: data.user.email!,
            name: userMetadata.full_name || userMetadata.name || 'User',
            linkedin_id: userMetadata.provider_id,
            linkedin_data: userMetadata
          }
        ])
      }

      // Always redirect to the production URL for consistency
      const redirectUrl = process.env.NODE_ENV === 'development' 
        ? `${origin}${next}`
        : `https://ai-career-platform.vercel.app${next}`
      
      console.log('Redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}