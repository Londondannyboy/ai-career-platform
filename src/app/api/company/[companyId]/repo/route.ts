import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { CompanyRepo } from '@/types/company';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { userId } = await auth();
    const { companyId } = await params;
    
    // Fetch company repo data
    const result = await sql`
      SELECT 
        surface_repo,
        working_repo,
        personal_repo,
        deep_repo
      FROM company_repos 
      WHERE company_id = ${companyId}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      // Return empty repo structure
      return NextResponse.json({ 
        success: true, 
        repo: {
          surface: { profile: {}, jobPostings: [], news: [], employees: [] },
          working: { projects: [], culture: {}, growth: {} },
          personal: { internalNotes: [], interviewExperiences: [], employeeReviews: [] },
          deep: { values: [], mission: '', vision: '', impact: {} }
        }
      });
    }

    const row = result.rows[0];
    const repo: CompanyRepo = {
      surface: row.surface_repo || { profile: {}, jobPostings: [], news: [], employees: [] },
      working: row.working_repo || { projects: [], culture: {}, growth: {} },
      personal: row.personal_repo || { internalNotes: [], interviewExperiences: [], employeeReviews: [] },
      deep: row.deep_repo || { values: [], mission: '', vision: '', impact: {} }
    };

    // Filter based on user access level
    // For now, everyone can see surface and working layers
    // Personal and deep layers require authentication and specific permissions
    if (!userId) {
      delete repo.personal;
      delete repo.deep;
    }

    return NextResponse.json({ 
      success: true, 
      repo 
    });
  } catch (error) {
    console.error('Company repo fetch error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch company repo' 
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { companyId } = await params;
    const { layer, data } = await request.json();

    if (!['surface', 'working', 'personal', 'deep'].includes(layer)) {
      return NextResponse.json({ error: 'Invalid layer' }, { status: 400 });
    }

    // Check if company repo exists
    const existing = await sql`
      SELECT id FROM company_repos 
      WHERE company_id = ${companyId}
      LIMIT 1
    `;

    const columnName = `${layer}_repo`;

    if (existing.rows.length > 0) {
      // Update existing
      await sql`
        UPDATE company_repos 
        SET ${sql(columnName)} = ${JSON.stringify(data)},
            updated_at = NOW(),
            updated_by = ${userId}
        WHERE company_id = ${companyId}
      `;
    } else {
      // Create new
      const repoData = {
        surface_repo: layer === 'surface' ? data : {},
        working_repo: layer === 'working' ? data : {},
        personal_repo: layer === 'personal' ? data : {},
        deep_repo: layer === 'deep' ? data : {}
      };

      await sql`
        INSERT INTO company_repos (
          company_id,
          surface_repo,
          working_repo,
          personal_repo,
          deep_repo,
          created_at,
          created_by,
          updated_at,
          updated_by
        ) VALUES (
          ${companyId},
          ${JSON.stringify(repoData.surface_repo)},
          ${JSON.stringify(repoData.working_repo)},
          ${JSON.stringify(repoData.personal_repo)},
          ${JSON.stringify(repoData.deep_repo)},
          NOW(),
          ${userId},
          NOW(),
          ${userId}
        )
      `;
    }

    return NextResponse.json({ 
      success: true, 
      message: `${layer} repo updated successfully` 
    });
  } catch (error) {
    console.error('Company repo save error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to save company repo' 
    }, { status: 500 });
  }
}