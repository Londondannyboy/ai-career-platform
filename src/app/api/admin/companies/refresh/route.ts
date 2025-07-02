/**
 * Admin refresh endpoint for company enrichments
 * Forces a fresh HarvestAPI call regardless of cache status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApifyService } from '@/lib/apify/apifyService';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { companyId, companyName } = await request.json();

    if (!companyId || !companyName) {
      return NextResponse.json({
        success: false,
        error: 'Company ID and name are required'
      }, { status: 400 });
    }

    console.log(`🔄 Admin refresh requested for company: ${companyName} (ID: ${companyId})`);

    // Create Apify service
    const apifyService = createApifyService();
    if (!apifyService) {
      return NextResponse.json({
        success: false,
        error: 'Apify service not configured'
      }, { status: 500 });
    }

    // Get company details from database
    const { rows } = await sql`
      SELECT canonical_identifier, company_name 
      FROM company_enrichments 
      WHERE id = ${companyId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Company not found'
      }, { status: 404 });
    }

    const companyUrl = rows[0].canonical_identifier || `https://www.linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}/`;

    // Force fresh HarvestAPI enrichment
    console.log(`🚀 Running fresh HarvestAPI enrichment for: ${companyUrl}`);
    const networkData = await apifyService.enrichWithHarvestAPI(companyUrl, {
      maxEmployees: 50 // Higher limit for admin refreshes
    });

    // Transform data for frontend (same as main enrichment API)
    const employees = networkData.employees.map((emp: any, index: number) => ({
      name: emp.name || 'Unknown',
      title: emp.headline || '',
      headline: emp.headline || '',
      linkedin_url: emp.profileUrl || '',
      linkedinUrl: emp.profileUrl || '',
      profileImage: null,
      photo_url: null,
      summary: emp.summary || '',
      experience: emp.experience || [],
      education: emp.education || [],
      skills: emp.skills || [],
      recommendations: emp.recommendations || [],
      connections: emp.connections || [],
      departments: [],
      department: 'Other',
      seniority: 'entry',
      currentPosition: emp.headline || '',
      relationships: emp.recommendations?.map((rec: any) => ({
        targetName: rec.recommenderName || '',
        relationshipType: 'recommendation',
        strength: 0.8,
        context: rec.recommendationText || ''
      })) || [],
      socialIntelligence: {
        recentActivity: 0,
        buyingSignals: [],
        sentiment: 'neutral',
        influenceScore: 0.5
      }
    }));

    // Update database with fresh data
    await sql`
      UPDATE company_enrichments 
      SET 
        employee_count = ${employees.length},
        last_enriched = NOW(),
        enrichment_type = 'harvestapi',
        enrichment_data = ${JSON.stringify({
          employees,
          networkAnalysis: {
            totalRelationships: employees.reduce((total: number, emp: any) => total + (emp.relationships?.length || 0), 0),
            internalConnections: networkData.internalConnections?.length || 0,
            externalInfluencers: networkData.externalInfluencers?.length || 0,
            averageInfluenceScore: 0.5,
            networkDensity: 0.3
          }
        })}
      WHERE id = ${companyId}
    `;

    console.log(`✅ Successfully refreshed ${companyName}: ${employees.length} employees`);

    return NextResponse.json({
      success: true,
      message: `Successfully refreshed ${companyName}`,
      employeeCount: employees.length,
      lastEnriched: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin refresh failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Refresh failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}