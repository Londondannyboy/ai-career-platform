import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, website, country } = await request.json();

    if (!name || !website) {
      return NextResponse.json(
        { error: 'Company name and website are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Normalize website URL
    let normalizedUrl = website;
    if (!website.startsWith('http')) {
      normalizedUrl = `https://${website}`;
    }
    
    // Extract domain
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
          validatedBy: 'enrichment',
          location: existingCompany.headquarters,
          domain: existingCompany.domain,
          description: existingCompany.description,
          logo: existingCompany.logo_url
        },
        message: 'Company already exists in our database'
      });
    }

    // Get basic logo from Google favicon service
    const logo = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    // Get country name if code provided
    let headquarters = undefined;
    if (country) {
      const { getCountryByCode } = await import('@/lib/constants/countries');
      headquarters = getCountryByCode(country)?.name;
    }

    // Create basic company entry
    const companyData = {
      name,
      domain,
      website: normalizedUrl,
      logo_url: logo,
      headquarters,
      description: `${name} company profile`,
      enrichment_sources: ['manual'],
      created_by_user_id: userId,
      created_at: new Date().toISOString()
    };

    const { data: newCompany, error: insertError } = await supabase
      .from('company_enrichments')
      .insert(companyData)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save company:', insertError);
      return NextResponse.json(
        { error: 'Failed to save company data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      company: {
        id: newCompany.id,
        name: newCompany.name,
        isValidated: true,
        validatedBy: 'manual',
        location: newCompany.headquarters,
        domain: newCompany.domain,
        description: newCompany.description,
        logo: newCompany.logo_url
      },
      message: 'Company profile created successfully'
    });
  } catch (error) {
    console.error('Company creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}