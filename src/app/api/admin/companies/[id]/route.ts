/**
 * Individual Company API - Get detailed company data by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;

    if (!companyId) {
      return NextResponse.json({
        success: false,
        error: 'Company ID is required'
      }, { status: 400 });
    }

    console.log(`🔍 Fetching company data for ID: ${companyId}`);

    // Get company data with cache status
    const { rows } = await sql`
      SELECT 
        id,
        company_name,
        normalized_name,
        canonical_identifier,
        employee_count,
        last_enriched,
        enrichment_type,
        enrichment_data,
        CASE 
          WHEN last_enriched > NOW() - INTERVAL '1 month' THEN 'fresh'
          WHEN last_enriched > NOW() - INTERVAL '3 months' THEN 'stale'
          ELSE 'expired'
        END as cache_status,
        EXTRACT(DAYS FROM NOW() - last_enriched)::integer as days_since_enriched
      FROM company_enrichments 
      WHERE id = ${companyId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Company not found'
      }, { status: 404 });
    }

    const company = rows[0];
    console.log(`✅ Found company: ${company.company_name}`);

    // Parse enrichment data if it's a string
    if (typeof company.enrichment_data === 'string') {
      try {
        company.enrichment_data = JSON.parse(company.enrichment_data);
      } catch (parseError) {
        console.warn('Failed to parse enrichment_data:', parseError);
        company.enrichment_data = null;
      }
    }

    return NextResponse.json({
      success: true,
      company: company
    });

  } catch (error) {
    console.error('Failed to fetch company:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch company',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}