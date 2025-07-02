/**
 * Admin API for managing company enrichments
 * Lists all companies with cache status and stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    // Get all company enrichments with employee counts and cache status
    const { rows } = await sql`
      SELECT 
        id,
        company_name,
        normalized_name,
        canonical_identifier as linkedin_url,
        employee_count,
        last_enriched,
        enrichment_type,
        CASE 
          WHEN last_enriched > NOW() - INTERVAL '7 days' THEN 'fresh'
          WHEN last_enriched > NOW() - INTERVAL '30 days' THEN 'stale'
          ELSE 'expired'
        END as cache_status,
        EXTRACT(DAYS FROM NOW() - last_enriched)::integer as days_since_enriched
      FROM company_enrichments 
      ORDER BY last_enriched DESC
    `;

    // Calculate stats
    const stats = {
      totalCompanies: rows.length,
      totalEmployees: rows.reduce((sum, company) => sum + (company.employee_count || 0), 0),
      averageEmployeesPerCompany: rows.length > 0 ? 
        rows.reduce((sum, company) => sum + (company.employee_count || 0), 0) / rows.length : 0,
      recentEnrichments: rows.filter(company => 
        new Date(company.last_enriched) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    };

    return NextResponse.json({
      success: true,
      companies: rows,
      stats
    });

  } catch (error) {
    console.error('Failed to fetch companies:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch companies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}