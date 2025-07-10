import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { companyId, enrichmentData } = await request.json();
    
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Update company enrichment data
    const result = await sql`
      UPDATE company_enrichments 
      SET 
        enrichment_data = ${JSON.stringify(enrichmentData)},
        updated_at = NOW()
      WHERE id = ${companyId}
      RETURNING id, company_name
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Company updated successfully',
      company: {
        id: result.rows[0].id,
        name: result.rows[0].company_name
      }
    });
  } catch (error) {
    console.error('Company update error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update company' 
    }, { status: 500 });
  }
}