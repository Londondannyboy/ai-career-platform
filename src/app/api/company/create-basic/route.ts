import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { name, website, country } = await request.json();

    if (!name || !website) {
      return NextResponse.json(
        { error: 'Company name and website are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Normalize website
    const normalizedUrl = website.startsWith('http') ? website : `https://${website}`;
    const domain = new URL(normalizedUrl).hostname;

    // Check if company already exists
    const { data: existingCompany } = await supabase
      .from('company_enrichments')
      .select('*')
      .eq('domain', domain)
      .single();

    if (existingCompany) {
      return NextResponse.json({
        company: {
          id: existingCompany.id,
          name: existingCompany.name,
          isValidated: true,
          validatedBy: 'enrichment' as const,
          location: existingCompany.headquarters,
          domain: existingCompany.domain,
          logo: existingCompany.logo_url
        },
        message: 'Company already exists'
      });
    }

    // Create company in database
    const companyData = {
      name: name.trim(),
      domain,
      website: normalizedUrl,
      logo_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      headquarters: country,
      description: `${name} company profile`,
      enrichment_sources: ['manual'],
      created_at: new Date().toISOString()
    };

    const { data: newCompany, error } = await supabase
      .from('company_enrichments')
      .insert(companyData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save company' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      company: {
        id: newCompany.id,
        name: newCompany.name,
        isValidated: true,
        validatedBy: 'manual' as const,
        location: newCompany.headquarters,
        domain: newCompany.domain,
        logo: newCompany.logo_url
      },
      message: 'Company created successfully'
    });
  } catch (error) {
    console.error('Company creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}