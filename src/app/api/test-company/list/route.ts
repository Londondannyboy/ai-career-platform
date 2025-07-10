import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, name, domain, logo_url, created_at 
      FROM company_enrichments 
      ORDER BY created_at DESC 
      LIMIT 20
    `;

    return NextResponse.json({ 
      success: true,
      companies: result.rows
    });

  } catch (error) {
    console.error('List companies error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      companies: []
    });
  }
}