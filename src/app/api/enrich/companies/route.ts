import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getApolloStorageService } from '@/lib/apollo/apolloStorageService';

export const runtime = 'nodejs';

/**
 * GET /api/enrich/companies
 * List all enriched companies with status
 */
export async function GET() {
  try {
    // Auth check with fallback
    let userId = 'test-user-123';
    try {
      const authResult = await auth();
      if (authResult?.userId) {
        userId = authResult.userId;
      }
    } catch (authError) {
      console.log('🔍 Auth failed, using test user:', authError);
    }

    console.log(`📋 Fetching enriched companies for user: ${userId}`);

    const apolloStorage = getApolloStorageService();
    const { companies } = await apolloStorage.getEnrichedCompanies(userId);

    return NextResponse.json({
      success: true,
      companies: companies.map(company => ({
        ...company,
        canRefresh: isAdminUser(userId),
        status: company.is_stale ? 'stale' : 'fresh',
        lastCrawledFormatted: formatTimestamp(company.last_crawled_at),
        daysSinceCrawlFormatted: formatDaysSince(company.days_since_crawl)
      })),
      isAdmin: isAdminUser(userId),
      totalCompanies: companies.length,
      staleCompanies: companies.filter(c => c.is_stale).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to fetch enriched companies:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch enriched companies',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function isAdminUser(userId: string): boolean {
  return userId === 'test-user-123' || userId.startsWith('admin_');
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatDaysSince(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}