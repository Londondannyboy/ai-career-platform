import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get data from request
    const { type, data } = await request.json();
    
    // Get Supabase client
    const supabase = await createClient();
    
    if (type === 'surface-repo') {
      // Check if user profile exists
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('user_profiles')
          .update({ 
            surface_repo: data,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            surface_repo: data,
            working_repo: {},
            personal_repo: {},
            deep_repo: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      return NextResponse.json({ success: true, message: 'Saved successfully' });
    }
    
    if (type === 'company') {
      // Save company
      const { name, website, country } = data;
      const domain = new URL(website.startsWith('http') ? website : `https://${website}`).hostname;
      
      // Check if exists
      const { data: existing } = await supabase
        .from('company_enrichments')
        .select('*')
        .eq('domain', domain)
        .single();

      if (existing) {
        return NextResponse.json({ 
          success: true, 
          company: {
            id: existing.id,
            name: existing.name,
            domain: existing.domain,
            isValidated: true
          }
        });
      }

      // Create new company
      const { data: newCompany, error } = await supabase
        .from('company_enrichments')
        .insert({
          name,
          domain,
          website: website.startsWith('http') ? website : `https://${website}`,
          logo_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
          headquarters: country,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ 
        success: true, 
        company: {
          id: newCompany.id,
          name: newCompany.name,
          domain: newCompany.domain,
          isValidated: true
        }
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}