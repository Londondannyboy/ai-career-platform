import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CompanySearchService } from '@/lib/search/companySearch';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query');
    const location = request.nextUrl.searchParams.get('location');
    
    if (!query || query.length < 2) {
      return NextResponse.json({ companies: [] });
    }

    const supabase = await createClient();
    
    // First, check our company_enrichments table for validated companies
    let dbQuery = supabase
      .from('company_enrichments')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(10);
    
    if (location) {
      dbQuery = dbQuery.or(`headquarters.ilike.%${location}%,locations.cs.{${location}}`);
    }
    
    const { data: validatedCompanies, error } = await dbQuery;
    
    if (error) {
      console.error('Database query error:', error);
    }
    
    // Transform validated companies to our format
    const companies: Array<{
      id?: string;
      name: string;
      isValidated: boolean;
      validatedBy?: 'enrichment' | 'email' | 'manual' | 'community';
      location?: string;
      linkedInUrl?: string;
      domain?: string;
      description?: string;
      industry?: string;
      employeeCount?: string;
    }> = (validatedCompanies || []).map(company => ({
      id: company.id,
      name: company.name,
      isValidated: true,
      validatedBy: 'enrichment' as const,
      location: company.headquarters,
      linkedInUrl: company.linkedin_url,
      domain: company.domain,
      description: company.description,
      industry: company.industry,
      employeeCount: company.employee_count_text
    }));
    
    // If we have less than 5 results, add normalized suggestions
    if (companies.length < 5) {
      // Use the CompanySearchService to generate suggestions based on the query
      const suggestions = CompanySearchService.getAutocompleteSuggestions(query, 10);
      const existingNames = new Set(companies.map(c => c.name.toLowerCase()));
      
      suggestions.forEach(suggestion => {
        if (!existingNames.has(suggestion.toLowerCase()) && companies.length < 10) {
          companies.push({
            name: suggestion,
            isValidated: false,
            location: undefined,
            description: `Suggested: ${suggestion}`
          });
        }
      });
    }
    
    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Company search error:', error);
    return NextResponse.json(
      { error: 'Failed to search companies' },
      { status: 500 }
    );
  }
}