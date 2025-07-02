import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedIntelligenceService } from '@/lib/intelligence/unifiedIntelligenceService';
import { CompanySearchService } from '@/lib/search/companySearch';

export const runtime = 'nodejs';

/**
 * GET /api/intelligence/search-suggestions?q=query
 * Get company search suggestions with fuzzy matching
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'Query too short for suggestions'
      });
    }

    console.log(`🔍 Getting search suggestions for: "${query}"`);

    const intelligenceService = getUnifiedIntelligenceService();
    const suggestions = await intelligenceService.getSearchSuggestions(query);

    // Also get search result analysis
    const searchResult = CompanySearchService.searchCompany(query);

    return NextResponse.json({
      success: true,
      query,
      suggestions,
      searchAnalysis: {
        normalizedQuery: searchResult.normalizedName,
        matchType: searchResult.matchType,
        confidence: searchResult.confidence,
        alternatives: searchResult.suggestions
      },
      metadata: {
        timestamp: new Date().toISOString(),
        resultCount: suggestions.length
      }
    });

  } catch (error) {
    console.error('❌ Search suggestions failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Search suggestions failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}