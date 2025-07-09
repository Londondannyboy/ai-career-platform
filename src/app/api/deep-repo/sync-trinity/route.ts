import { NextResponse } from 'next/server';
import { DeepRepoService } from '@/lib/profile/deepRepoService';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

// GET /api/deep-repo/sync-trinity - Sync existing Trinity to Deep Repo
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // First check if user already has Trinity in Deep Repo
    const existingTrinity = await DeepRepoService.getTrinity(userId);
    
    if (existingTrinity) {
      return NextResponse.json({
        message: 'Trinity already exists in Deep Repo',
        trinity: existingTrinity,
        source: 'deep_repo'
      });
    }

    // Check if user has Trinity in old trinity_statements table
    try {
      const oldTrinity = await sql`
        SELECT 
          ts.quest,
          ts.service,
          ts.pledge,
          ts.trinity_type,
          ts.trinity_type_description,
          ts.quest_seal,
          ts.created_at,
          ts.updated_at,
          tcp.quest_focus,
          tcp.service_focus,
          tcp.pledge_focus,
          tcp.coaching_methodology,
          tcp.coaching_tone
        FROM trinity_statements ts
        LEFT JOIN trinity_coaching_preferences tcp ON tcp.trinity_statement_id = ts.id
        WHERE ts.user_id = ${userId} AND ts.is_active = true
        LIMIT 1
      `;

      if (oldTrinity.rows.length > 0) {
        // Migrate to Deep Repo
        const trinityData = oldTrinity.rows[0];
        const deepRepoTrinity = {
          quest: trinityData.quest,
          service: trinityData.service,
          pledge: trinityData.pledge,
          type: trinityData.trinity_type as 'F' | 'L' | 'M',
          typeDescription: trinityData.trinity_type_description,
          questSeal: trinityData.quest_seal,
          createdAt: trinityData.created_at,
          updatedAt: trinityData.updated_at,
          focus: trinityData.quest_focus ? {
            quest: trinityData.quest_focus,
            service: trinityData.service_focus,
            pledge: trinityData.pledge_focus
          } : undefined,
          coachingPreferences: trinityData.coaching_methodology ? {
            methodology: trinityData.coaching_methodology,
            tone: trinityData.coaching_tone
          } : undefined
        };

        const saved = await DeepRepoService.saveTrinity(userId, deepRepoTrinity);
        
        if (saved) {
          return NextResponse.json({
            message: 'Successfully migrated Trinity from old table to Deep Repo',
            trinity: deepRepoTrinity,
            source: 'migrated_from_trinity_statements'
          });
        }
      }
    } catch (error) {
      console.log('Trinity statements table might not exist, continuing...');
    }

    // No Trinity found anywhere
    return NextResponse.json({
      message: 'No Trinity found - please create one',
      trinity: null,
      source: 'none'
    });

  } catch (error) {
    console.error('Sync Trinity error:', error);
    return NextResponse.json({ 
      error: 'Failed to sync Trinity data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}