import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get('type');
    
    // Get Supabase client
    const supabase = await createClient();
    
    if (type === 'surface-repo') {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('surface_repo')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return NextResponse.json({ 
        success: true, 
        data: data?.surface_repo || {} 
      });
    }
    
    if (type === 'companies') {
      const query = request.nextUrl.searchParams.get('q') || '';
      
      const { data, error } = await supabase
        .from('company_enrichments')
        .select('id, name, domain, logo_url')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (error) throw error;

      return NextResponse.json({ 
        success: true, 
        companies: (data || []).map(c => ({
          id: c.id,
          name: c.name,
          domain: c.domain,
          logo: c.logo_url,
          isValidated: true
        }))
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Load error:', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}