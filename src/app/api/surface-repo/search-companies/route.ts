import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q') || '';
    
    const result = await sql`
      SELECT 
        id, 
        company_name as name,
        canonical_identifier,
        enrichment_data
      FROM company_enrichments 
      WHERE company_name ILIKE ${`%${query}%`}
      LIMIT 10
    `;

    const companies = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      isValidated: true,
      logo: row.enrichment_data?.logo
    }));

    return NextResponse.json({ 
      success: true, 
      companies
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to search' 
    }, { status: 500 });
  }
}