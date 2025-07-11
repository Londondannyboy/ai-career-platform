import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // Handle auth failures gracefully
    let userId = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (e) {
      console.log('Auth failed during company creation');
    }

    const { name, website, country } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Create canonical identifier from company name
    const canonical = name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if company already exists using canonical_identifier
    const existing = await sql`
      SELECT id, company_name, canonical_identifier, website_url, headquarters, description, logo_url
      FROM company_enrichments 
      WHERE canonical_identifier = ${canonical}
      LIMIT 1
    `;

    if (existing.rows.length > 0) {
      const existingCompany = existing.rows[0];
      return NextResponse.json({
        company: {
          id: existingCompany.id,
          name: existingCompany.company_name,
          isValidated: true,
          validatedBy: 'enrichment',
          location: existingCompany.headquarters,
          domain: existingCompany.website_url,
          description: existingCompany.description,
          logo: existingCompany.logo_url
        },
        message: 'Company already exists in our database'
      });
    }

    // Normalize website URL if provided
    let normalizedUrl = website || '';
    if (website && !website.startsWith('http')) {
      normalizedUrl = `https://${website}`;
    }
    
    // Extract domain for logo
    let domain = '';
    if (normalizedUrl) {
      try {
        domain = new URL(normalizedUrl).hostname;
      } catch (e) {
        domain = canonical;
      }
    }

    // Get basic logo from Google favicon service
    const logo = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : '';

    // Get country name if code provided
    let headquarters = country || null;

    // Create basic company entry
    const result = await sql`
      INSERT INTO company_enrichments (
        company_name,
        canonical_identifier,
        website_url,
        logo_url,
        headquarters,
        description,
        created_by_user_id,
        created_at
      ) VALUES (
        ${name},
        ${canonical},
        ${normalizedUrl},
        ${logo},
        ${headquarters},
        ${`${name} company profile`},
        ${userId || 'anonymous'},
        NOW()
      )
      RETURNING id, company_name, canonical_identifier, website_url, headquarters, description, logo_url
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to save company data' },
        { status: 500 }
      );
    }

    const newCompany = result.rows[0];
    
    return NextResponse.json({
      company: {
        id: newCompany.id,
        name: newCompany.company_name,
        isValidated: true,
        validatedBy: 'manual',
        location: newCompany.headquarters,
        domain: newCompany.website_url,
        description: newCompany.description,
        logo: newCompany.logo_url
      },
      message: 'Company profile created successfully'
    });
  } catch (error: any) {
    console.error('Company creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create company' },
      { status: 500 }
    );
  }
}