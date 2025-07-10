import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, website, country } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Create canonical identifier
    const url = website ? (website.startsWith('http') ? website : `https://${website}`) : '';
    const canonical = url ? url.toLowerCase() : name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Check if exists
    const existing = await sql`
      SELECT id, company_name as name, canonical_identifier
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

    // Create new company
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
          website: url || null,
          logo: url ? `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128` : null,
          country: country || null,
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
  } catch (error: any) {
    console.error('Create company error:', error);
    
    if (error.message?.includes('duplicate key')) {
      return NextResponse.json({ 
        error: 'Company already exists' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to create company' 
    }, { status: 500 });
  }
}