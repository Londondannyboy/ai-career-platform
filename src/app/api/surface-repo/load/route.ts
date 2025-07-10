import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID required' 
      }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Get the surface_repo field from user_profiles
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('surface_repo')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore "not found" error
      console.error('Load error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to load' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      data: profile?.surface_repo || {}
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 });
  }
}