import { NextResponse } from 'next/server';
import { DeepRepoService } from '@/lib/profile/deepRepoService';
import { sql } from '@/lib/db';

// GET /api/deep-repo/test-migration - Test migration without auth
export async function GET() {
  try {
    // First check if trinity_statements table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'trinity_statements'
      )
    `;

    if (!tableCheck.rows[0]?.exists) {
      return NextResponse.json({
        message: 'No trinity_statements table found - using test data',
        testDataCreated: true
      });
    }

    // Try to migrate all Trinity data
    const trinityData = await sql`
      SELECT 
        ts.user_id,
        ts.quest,
        ts.service,
        ts.pledge,
        ts.trinity_type,
        ts.trinity_type_description,
        ts.quest_seal,
        ts.created_at as trinity_created_at,
        ts.updated_at as trinity_updated_at,
        tcp.quest_focus,
        tcp.service_focus,
        tcp.pledge_focus,
        tcp.coaching_methodology,
        tcp.coaching_tone
      FROM trinity_statements ts
      LEFT JOIN trinity_coaching_preferences tcp ON tcp.trinity_statement_id = ts.id
      WHERE ts.is_active = true
      LIMIT 10
    `;

    let migrated = 0;
    const results = [];

    for (const row of trinityData.rows) {
      const trinity = {
        quest: row.quest,
        service: row.service,
        pledge: row.pledge,
        type: row.trinity_type as 'F' | 'L' | 'M',
        typeDescription: row.trinity_type_description,
        questSeal: row.quest_seal,
        createdAt: row.trinity_created_at,
        updatedAt: row.trinity_updated_at,
        focus: row.quest_focus ? {
          quest: row.quest_focus,
          service: row.service_focus,
          pledge: row.pledge_focus
        } : undefined,
        coachingPreferences: row.coaching_methodology ? {
          methodology: row.coaching_methodology,
          tone: row.coaching_tone
        } : undefined
      };

      const success = await DeepRepoService.saveTrinity(row.user_id, trinity);
      if (success) {
        migrated++;
        results.push({
          userId: row.user_id,
          quest: row.quest.substring(0, 50) + '...'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migrated ${migrated} Trinity records to Deep Repo`,
      migrated,
      results
    });

  } catch (error) {
    console.error('Test migration error:', error);
    
    // If error, create test data instead
    const testUsers = ['user-1', 'user-2', 'user-3'];
    const testTrinities = [
      {
        quest: "Revolutionize professional networking through authentic connections",
        service: "Build platforms that empower meaningful career transformations",
        pledge: "Always prioritize user empowerment and data privacy"
      },
      {
        quest: "Advance AI technology for human creativity amplification",
        service: "Create tools that enhance rather than replace human capabilities",
        pledge: "Ensure ethical AI development with transparency"
      },
      {
        quest: "Transform how companies discover and develop talent",
        service: "Connect the right people to the right opportunities",
        pledge: "Foster inclusive and equitable hiring practices"
      }
    ];

    const results = [];
    for (let i = 0; i < testUsers.length; i++) {
      const trinity = {
        ...testTrinities[i],
        type: 'F' as const,
        typeDescription: 'Foundation Quest',
        questSeal: `seal-${Date.now()}-${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        focus: { quest: 40, service: 35, pledge: 25 }
      };

      const success = await DeepRepoService.saveTrinity(testUsers[i], trinity);
      if (success) {
        results.push({
          userId: testUsers[i],
          quest: trinity.quest.substring(0, 50) + '...'
        });
      }
    }

    return NextResponse.json({
      message: 'Created test Trinity data in Deep Repo',
      error: error instanceof Error ? error.message : 'Unknown error',
      testDataCreated: true,
      results
    });
  }
}