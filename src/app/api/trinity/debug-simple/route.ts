import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Simple Trinity Debug - No Auth Required');

    const body = await req.json();
    const { quest, service, pledge, trinity_type, trinity_type_description } = body;

    // Mock user ID for testing - use unique ID each time
    const testUserId = `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    console.log('🔍 Debug Trinity Creation:', {
      userId: testUserId,
      quest: quest?.substring(0, 50) + '...',
      service: service?.substring(0, 50) + '...',
      pledge: pledge?.substring(0, 50) + '...',
      trinity_type,
      trinity_type_description
    });

    // Step 1: Check if users table exists
    try {
      const usersTableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        ) as exists;
      `;
      
      console.log('✅ Users table exists:', usersTableCheck.rows[0]?.exists);
      
      if (!usersTableCheck.rows[0]?.exists) {
        return NextResponse.json({ 
          error: 'Users table does not exist',
          step: 'users_table_check',
          success: false
        });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to check users table',
        step: 'users_table_check',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }

    // Step 2: Check if Trinity tables exist
    try {
      const trinityTableCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'trinity_%'
        ORDER BY table_name
      `;
      
      const trinityTables = trinityTableCheck.rows.map(row => row.table_name);
      console.log('✅ Trinity tables found:', trinityTables);
      
      if (trinityTables.length === 0) {
        return NextResponse.json({ 
          error: 'Trinity tables do not exist',
          step: 'trinity_table_check',
          action: 'Please visit /trinity/init to initialize the database',
          success: false
        });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to check Trinity tables',
        step: 'trinity_table_check',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }

    // Step 3: Test inserting a user
    try {
      await sql`
        INSERT INTO users (id, email, name) 
        VALUES (
          ${testUserId}, 
          ${testUserId + '@quest.app'}, 
          ${'Test User'}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      console.log('✅ Test user inserted/updated');
    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to insert test user',
        step: 'user_creation',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }

    // Step 4: Test Trinity creation
    try {
      // Try to generate Quest Seal with function first, fallback to simple generation
      let questSeal;
      try {
        const questSealResult = await sql`
          SELECT generate_quest_seal(${quest}, ${service}, ${pledge}, ${trinity_type}, ${testUserId}) as quest_seal
        `;
        questSeal = questSealResult.rows[0]?.quest_seal;
        console.log('✅ Generated Quest Seal with function:', questSeal?.substring(0, 16) + '...');
      } catch (sealError) {
        // Fallback to simple seal generation
        questSeal = `${testUserId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        console.log('⚠️ Using fallback Quest Seal:', questSeal);
      }

      const trinityResult = await sql`
        INSERT INTO trinity_statements (
          user_id, quest, service, pledge, trinity_type, trinity_type_description,
          quest_seal, ritual_session_id
        ) VALUES (
          ${testUserId}, ${quest}, ${service}, ${pledge}, ${trinity_type}, ${trinity_type_description},
          ${questSeal}, ${null}
        ) RETURNING *
      `;

      const trinityStatement = trinityResult.rows[0];
      console.log('✅ Trinity statement created:', trinityStatement.id);

      return NextResponse.json({
        success: true,
        message: 'Trinity creation test successful!',
        trinity_statement: trinityStatement,
        quest_seal: questSeal,
        debug: {
          userId: testUserId,
          tablesExist: true,
          testMode: true
        }
      });

    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to create Trinity statement',
        step: 'trinity_creation',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }

  } catch (error) {
    console.error('Trinity debug error:', error);
    return NextResponse.json(
      { 
        error: 'Trinity creation failed',
        step: 'unknown',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}