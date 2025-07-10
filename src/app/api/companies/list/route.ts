import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { COUNTRIES } from '@/lib/constants/countries';

export async function GET(request: NextRequest) {
  try {
    // Fetch all companies
    const result = await sql`
      SELECT 
        id,
        company_name as name,
        canonical_identifier,
        enrichment_data,
        created_at
      FROM company_enrichments 
      ORDER BY company_name ASC
      LIMIT 100
    `;

    const companies = await Promise.all(result.rows.map(async (row) => {
      const enrichmentData = row.enrichment_data || {};
      
      // Count Quest members for this company
      const memberCount = await sql`
        SELECT COUNT(DISTINCT user_id) as count
        FROM user_profiles
        WHERE surface_repo::text LIKE ${'%"company":{"id":"' + row.id + '"%'}
      `;
      
      const countryName = enrichmentData.country 
        ? COUNTRIES.find(c => c.code === enrichmentData.country)?.name 
        : undefined;

      return {
        id: row.id,
        name: row.name,
        logo: enrichmentData.logo,
        industry: enrichmentData.industry,
        location: countryName || enrichmentData.city,
        size: enrichmentData.size,
        isVerified: enrichmentData.source === 'clearbit' || enrichmentData.source === 'crunchbase',
        questMembers: parseInt(memberCount.rows[0]?.count || '0')
      };
    }));

    return NextResponse.json({ 
      success: true, 
      companies 
    });
  } catch (error) {
    console.error('Companies list error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to list companies' 
    }, { status: 500 });
  }
}