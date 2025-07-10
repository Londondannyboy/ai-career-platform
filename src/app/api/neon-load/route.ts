import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get('type');
    
    if (type === 'surface-repo') {
      const result = await sql`
        SELECT surface_repo 
        FROM user_profiles 
        WHERE user_id = ${userId}
        LIMIT 1
      `;

      return NextResponse.json({ 
        success: true, 
        data: result.rows[0]?.surface_repo || {} 
      });
    }
    
    if (type === 'companies') {
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
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Load error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to load' 
    }, { status: 500 });
  }
}