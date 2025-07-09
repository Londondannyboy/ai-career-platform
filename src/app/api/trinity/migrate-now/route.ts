import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { DeepRepoService } from '@/lib/profile/deepRepoService';

// One-click migration to Deep Repo system
export async function GET(request: NextRequest) {
  try {
    // Step 1: Check current state
    const trinityCount = await sql`
      SELECT COUNT(*) as count FROM trinity_statements
    `;
    
    const currentCount = trinityCount.rows[0]?.count || 0;
    
    // Step 2: Get Dan's Trinity before migration
    const dansTrinity = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = 'user_2z5UB58sfZFnapkymfEkFzGIlzK'
      AND is_active = true
      LIMIT 1
    `;
    
    const hasDansTrinity = dansTrinity.rows.length > 0;
    const trinity = dansTrinity.rows[0];
    
    // Step 3: Check if user_profiles exists
    const profilesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
      )
    `;
    
    if (!profilesExist.rows[0]?.exists) {
      // Create the table
      await sql`
        CREATE TABLE user_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT UNIQUE NOT NULL,
          surface_repo JSONB DEFAULT '{}',
          working_repo JSONB DEFAULT '{}',
          personal_repo JSONB DEFAULT '{}',
          deep_repo JSONB DEFAULT '{"trinity": null}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
    }
    
    // Step 4: Migrate Dan's Trinity to Deep Repo if it exists
    let migrationResult = null;
    if (hasDansTrinity && trinity) {
      const deepRepoTrinity = {
        quest: trinity.quest,
        service: trinity.service,
        pledge: trinity.pledge,
        type: trinity.trinity_type || 'F',
        createdAt: trinity.created_at,
        updatedAt: new Date()
      };
      
      const saved = await DeepRepoService.saveTrinity('user_2z5UB58sfZFnapkymfEkFzGIlzK', deepRepoTrinity);
      if (saved) {
        migrationResult = {
          success: true,
          userId: 'user_2z5UB58sfZFnapkymfEkFzGIlzK',
          trinity: deepRepoTrinity
        };
      }
    }
    
    // Step 5: Clear old trinity_statements table
    await sql`
      TRUNCATE TABLE trinity_statements
    `;
    
    // Step 6: Verify Deep Repo
    const deepRepoCheck = await DeepRepoService.getTrinity('user_2z5UB58sfZFnapkymfEkFzGIlzK');
    
    return NextResponse.json({
      success: true,
      message: 'Migration complete!',
      stats: {
        oldTrinityCount: currentCount,
        hadDansTrinity: hasDansTrinity,
        clearedOldTable: true,
        migratedToDeepRepo: !!migrationResult
      },
      migration: migrationResult,
      deepRepoVerification: {
        hasDeepRepoTrinity: !!deepRepoCheck,
        trinity: deepRepoCheck
      },
      nextSteps: [
        'Old trinity_statements table is now empty',
        'Trinity data moved to Deep Repo',
        'Visualization will now use Deep Repo',
        'No more phantom goals/tasks!'
      ]
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}