import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { CompanyProfile } from '@/types/company';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    
    // Fetch company by ID
    const result = await sql`
      SELECT 
        id,
        company_name as name,
        normalized_name,
        canonical_identifier,
        enrichment_data,
        created_at,
        updated_at
      FROM company_enrichments 
      WHERE id = ${companyId}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Company not found' 
      }, { status: 404 });
    }

    const row = result.rows[0];
    const enrichmentData = row.enrichment_data || {};
    
    // Transform database row to CompanyProfile
    const company: CompanyProfile = {
      id: row.id,
      name: row.name,
      normalizedName: row.normalized_name,
      canonicalIdentifier: row.canonical_identifier,
      logo: enrichmentData.logo,
      website: enrichmentData.website,
      industry: enrichmentData.industry,
      size: enrichmentData.size,
      founded: enrichmentData.founded,
      headquarters: {
        country: enrichmentData.country,
        city: enrichmentData.city,
        address: enrichmentData.address
      },
      description: enrichmentData.description,
      mission: enrichmentData.mission,
      values: enrichmentData.values || [],
      culture: enrichmentData.culture,
      social: enrichmentData.social,
      enrichmentData: enrichmentData,
      stats: {
        employeeCount: enrichmentData.employeeCount,
        activeJobPostings: 0, // TODO: Implement job counting
        questMembers: 0 // TODO: Implement member counting
      },
      isVerified: enrichmentData.source === 'clearbit' || enrichmentData.source === 'crunchbase',
      verifiedDate: enrichmentData.verifiedDate,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    // Count Quest members who work at this company
    const memberCount = await sql`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_profiles
      WHERE surface_repo::jsonb @> ${JSON.stringify([{ 
        experience: [{ company: { id: companyId } }] 
      }])}
    `;
    
    if (memberCount.rows[0]?.count) {
      company.stats!.questMembers = parseInt(memberCount.rows[0].count);
    }

    return NextResponse.json({ 
      success: true, 
      company 
    });
  } catch (error) {
    console.error('Company fetch error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch company' 
    }, { status: 500 });
  }
}