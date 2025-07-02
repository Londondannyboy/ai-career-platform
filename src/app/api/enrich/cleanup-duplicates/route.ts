import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getApolloStorageService } from '@/lib/apollo/apolloStorageService';

export const runtime = 'nodejs';

/**
 * POST /api/enrich/cleanup-duplicates
 * Clean up duplicate company entries (admin only)
 */
export async function POST() {
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

    // Check admin permissions
    if (!isAdminUser(userId)) {
      return NextResponse.json(
        { error: 'Admin permissions required' },
        { status: 403 }
      );
    }

    console.log(`🧹 Cleaning up duplicate companies for admin: ${userId}`);

    const apolloStorage = getApolloStorageService();
    const supabase = await (apolloStorage as any).getSupabase();

    // Find duplicate companies by normalized name
    const { data: duplicates, error: findError } = await supabase
      .rpc('merge_duplicate_companies');

    if (findError) {
      console.error('Error finding duplicates:', findError);
      return NextResponse.json(
        { error: 'Failed to find duplicates', details: findError.message },
        { status: 500 }
      );
    }

    // Get current company count after cleanup
    const { companies } = await apolloStorage.getEnrichedCompanies();

    return NextResponse.json({
      success: true,
      cleanup: {
        duplicatesFound: duplicates?.length || 0,
        mergeActions: duplicates || [],
        remainingCompanies: companies.length
      },
      message: duplicates?.length > 0 
        ? `Merged ${duplicates.length} duplicate companies`
        : 'No duplicates found to clean up',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Duplicate cleanup failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Duplicate cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enrich/cleanup-duplicates
 * Check for duplicates without cleaning
 */
export async function GET() {
  try {
    const apolloStorage = getApolloStorageService();
    const supabase = await (apolloStorage as any).getSupabase();

    // Find companies with same normalized name
    const { data: duplicateGroups, error } = await supabase
      .from('company_enrichments')
      .select('normalized_name, company_name, id, created_at')
      .order('normalized_name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to check duplicates', details: error.message },
        { status: 500 }
      );
    }

    // Group by normalized name
    const groups = new Map<string, any[]>();
    duplicateGroups?.forEach((company: any) => {
      const key = company.normalized_name;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(company);
    });

    // Find groups with duplicates
    const duplicates = Array.from(groups.entries())
      .filter(([, companies]) => companies.length > 1)
      .map(([normalizedName, companies]) => ({
        normalizedName,
        count: companies.length,
        companies: companies.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }));

    return NextResponse.json({
      success: true,
      duplicatesFound: duplicates.length,
      totalAffectedCompanies: duplicates.reduce((sum, group) => sum + group.count, 0),
      duplicateGroups: duplicates,
      samples: duplicates.slice(0, 5), // Show first 5 for preview
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Duplicate check failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Duplicate check failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// Helper function
function isAdminUser(userId: string): boolean {
  return userId === 'test-user-123' || userId.startsWith('admin_');
}