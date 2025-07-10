import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, website } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Create canonical identifier from website or name
    const canonical = website 
      ? website.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
      : name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Create company directly in database
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
          website: website || null,
          source: 'manual_test',
          created_via: 'test_page'
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
        name: result.rows[0].name
      }
    });
  } catch (error: any) {
    console.error('Create company error:', error);
    
    // Check for duplicate
    if (error.message?.includes('duplicate key')) {
      return NextResponse.json({ 
        error: 'Company with this identifier already exists' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to create company' 
    }, { status: 500 });
  }
}