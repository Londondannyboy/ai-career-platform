import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, data } = await request.json();
    
    const supabase = await createClient();
    
    // Update the surface_repo field in user_profiles
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        surface_repo: data,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Save error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Surface Repo saved successfully'
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 });
  }
}