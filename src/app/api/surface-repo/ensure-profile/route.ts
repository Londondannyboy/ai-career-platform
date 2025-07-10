import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID required' 
      }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Check if profile exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (!existing) {
      // Create profile if it doesn't exist
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          surface_repo: {},
          working_repo: {},
          personal_repo: {},
          deep_repo: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Create profile error:', error);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create profile' 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Profile ready'
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 });
  }
}