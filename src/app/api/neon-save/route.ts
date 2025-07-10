import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { type, data } = await request.json();
    
    if (type === 'surface-repo') {
      // Check if user profile exists
      const existing = await sql`
        SELECT id FROM user_profiles 
        WHERE user_id = ${userId}
        LIMIT 1
      `;

      if (existing.rows.length > 0) {
        // Update existing
        await sql`
          UPDATE user_profiles 
          SET surface_repo = ${JSON.stringify(data)},
              updated_at = NOW()
          WHERE user_id = ${userId}
        `;
      } else {
        // Create new
        await sql`
          INSERT INTO user_profiles (
            user_id, 
            surface_repo, 
            working_repo, 
            personal_repo, 
            deep_repo,
            created_at,
            updated_at
          ) VALUES (
            ${userId},
            ${JSON.stringify(data)},
            '{}',
            '{}',
            '{}',
            NOW(),
            NOW()
          )
        `;
      }

      return NextResponse.json({ success: true, message: 'Saved successfully' });
    }
    
    if (type === 'company') {
      const { name, website, country } = data;
      const url = website.startsWith('http') ? website : `https://${website}`;
      
      // Use canonical_identifier (not domain!)
      const canonical = url.toLowerCase();
      
      // Check if exists
      const existing = await sql`
        SELECT id, company_name as name, canonical_identifier, enrichment_data
        FROM company_enrichments 
        WHERE LOWER(canonical_identifier) = ${canonical}
        LIMIT 1
      `;

      if (existing.rows.length > 0) {
        return NextResponse.json({ 
          success: true, 
          company: {
            id: existing.rows[0].id,
            name: existing.rows[0].name,
            isValidated: true
          }
        });
      }

      // Create new company with proper schema
      const result = await sql`
        INSERT INTO company_enrichments (
          company_name,
          normalized_name,
          canonical_identifier,
          enrichment_data,
          created_at,
          updated_at
        ) VALUES (
          ${name},
          ${name.toLowerCase()},
          ${canonical},
          ${JSON.stringify({
            website: url,
            logo: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`,
            country: country,
            source: 'manual_entry'
          })},
          NOW(),
          NOW()
        )
        RETURNING id, company_name as name
      `;

      return NextResponse.json({ 
        success: true, 
        company: {
          id: result.rows[0].id,
          name: result.rows[0].name,
          isValidated: true
        }
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to save' 
    }, { status: 500 });
  }
}