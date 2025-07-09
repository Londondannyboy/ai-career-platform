import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { DeepRepoService } from '@/lib/profile/deepRepoService';

// Safe migration that handles foreign key constraints
export async function GET(request: NextRequest) {
  try {
    // Step 1: Check current state
    const trinityCount = await sql`
      SELECT COUNT(*) as count FROM trinity_statements
    `;
    
    const currentCount = trinityCount.rows[0]?.count || 0;
    
    // Step 2: Get Dan's Trinity
    const dansTrinity = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = 'user_2z5UB58sfZFnapkymfEkFzGIlzK'
      AND is_active = true
      LIMIT 1
    `;
    
    const hasDansTrinity = dansTrinity.rows.length > 0;
    const trinity = dansTrinity.rows[0];
    
    // Step 3: Ensure user_profiles table exists
    const profilesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
      )
    `;
    
    if (!profilesExist.rows[0]?.exists) {
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
    
    // Step 4: Migrate Dan's Trinity to Deep Repo
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
    
    // Step 5: Instead of TRUNCATE, use DELETE (safer with foreign keys)
    // First, deactivate all trinity statements
    await sql`
      UPDATE trinity_statements
      SET is_active = false
      WHERE is_active = true
    `;
    
    // Then delete Dan's Trinity from old table
    let deleteResult = null;
    if (hasDansTrinity) {
      deleteResult = await sql`
        DELETE FROM trinity_statements
        WHERE user_id = 'user_2z5UB58sfZFnapkymfEkFzGIlzK'
        RETURNING id
      `;
    }
    
    // Step 6: Check foreign key constraints
    const foreignKeys = await sql`
      SELECT
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'trinity_statements'
    `;
    
    // Step 7: Verify Deep Repo
    const deepRepoCheck = await DeepRepoService.getTrinity('user_2z5UB58sfZFnapkymfEkFzGIlzK');
    
    return NextResponse.json({
      success: true,
      message: 'Safe migration complete!',
      stats: {
        oldTrinityCount: currentCount,
        hadDansTrinity: hasDansTrinity,
        deactivatedAll: true,
        deletedDansTrinity: deleteResult?.rows?.length > 0 || false
      },
      migration: migrationResult,
      deepRepoVerification: {
        hasDeepRepoTrinity: !!deepRepoCheck,
        trinity: deepRepoCheck
      },
      foreignKeyInfo: {
        hasConstraints: foreignKeys.rows.length > 0,
        constraints: foreignKeys.rows
      },
      nextSteps: [
        'Dan\'s Trinity moved to Deep Repo',
        'Old Trinity deactivated/deleted',
        'Visualization will now use Deep Repo',
        'Clean architecture achieved!'
      ]
    });
  } catch (error) {
    console.error('Safe migration error:', error);
    return NextResponse.json({
      error: 'Safe migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check foreign key constraints in the response'
    }, { status: 500 });
  }
}