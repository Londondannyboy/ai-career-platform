import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, website } = await request.json();
    
    if (!name || !website) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name and website required' 
      });
    }

    // Extract domain
    const url = website.startsWith('http') ? website : `https://${website}`;
    const domain = new URL(url).hostname;

    // Check if exists
    const existing = await sql`
      SELECT * FROM company_enrichments 
      WHERE domain = ${domain}
      LIMIT 1
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Company already exists',
        company: existing.rows[0]
      });
    }

    // Create new company
    const result = await sql`
      INSERT INTO company_enrichments (
        name, 
        domain, 
        website, 
        logo_url,
        created_at
      ) VALUES (
        ${name},
        ${domain},
        ${url},
        ${'https://www.google.com/s2/favicons?domain=' + domain + '&sz=128'},
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json({ 
      success: true,
      message: 'Company created',
      company: result.rows[0]
    });

  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}