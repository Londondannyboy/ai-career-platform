import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { repoUpdateAgent } from '@/lib/ai/repoUpdateAgent';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    // Get user ID
    let userId = null;
    try {
      const authResult = await auth();
      userId = authResult?.userId;
    } catch (e) {
      console.log('Auth failed, checking headers');
    }
    
    if (!userId) {
      userId = request.headers.get('X-User-Id');
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { messages, testMode = false } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    // Get current repos
    const repoResult = await sql`
      SELECT 
        surface_repo_data,
        surface_private_repo_data,
        personal_repo_data,
        deep_repo_data
      FROM user_profiles
      WHERE user_id = ${userId}
    `;

    const currentRepos = repoResult.rows[0] ? {
      surface: repoResult.rows[0].surface_repo_data,
      surfacePrivate: repoResult.rows[0].surface_private_repo_data,
      personal: repoResult.rows[0].personal_repo_data,
      deep: repoResult.rows[0].deep_repo_data
    } : {};

    // Analyze conversation
    const analysis = await repoUpdateAgent.analyzeConversation({
      userId,
      messages,
      currentRepos
    });

    if (!analysis) {
      return NextResponse.json({ 
        error: 'Failed to analyze conversation' 
      }, { status: 500 });
    }

    // In test mode, just return the analysis
    if (testMode) {
      return NextResponse.json({
        analysis,
        currentRepos,
        wouldUpdate: analysis.shouldUpdate
      });
    }

    // Apply updates if needed
    if (analysis.shouldUpdate) {
      const updateResult = await repoUpdateAgent.applyUpdates(
        userId,
        analysis.layer,
        analysis.updates
      );

      return NextResponse.json({
        analysis,
        updateResult,
        message: updateResult.success ? 
          'Repository updated successfully' : 
          'Failed to update repository'
      });
    }

    return NextResponse.json({
      analysis,
      message: 'No updates needed'
    });

  } catch (error) {
    console.error('Repo update test error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}