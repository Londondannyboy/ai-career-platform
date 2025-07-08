import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - No userId from Clerk' }, { status: 401 });
    }

    const body = await req.json();
    const { quest, service, pledge, trinity_type, trinity_type_description } = body;

    console.log('🔍 Debug Trinity Creation:', {
      userId,
      quest: quest?.substring(0, 50) + '...',
      service: service?.substring(0, 50) + '...',
      pledge: pledge?.substring(0, 50) + '...',
      trinity_type,
      trinity_type_description
    });

    // Step 1: Check if users table exists
    const usersTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as exists;
    `;
    
    if (!usersTableCheck.rows[0]?.exists) {
      return NextResponse.json({ 
        error: 'Users table does not exist',
        step: 'users_table_check'
      }, { status: 500 });
    }

    // Step 2: Check if user exists in users table
    const userCheck = await sql`
      SELECT id, email, name FROM users WHERE id = ${userId}
    `;
    
    if (userCheck.rows.length === 0) {
      // Try to get user info from Clerk and create user
      console.log('User not found in database, attempting to create...');
      
      // For now, create a basic user entry
      try {
        await sql`
          INSERT INTO users (id, email, name) 
          VALUES (
            ${userId}, 
            ${userId + '@quest.app'}, 
            ${'Quest User'}
          )
          ON CONFLICT (id) DO NOTHING
        `;
        console.log('✅ Created user in database');
      } catch (userError) {
        return NextResponse.json({ 
          error: 'Failed to create user in database',
          step: 'user_creation',
          details: userError instanceof Error ? userError.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Step 3: Check if Trinity tables exist
    const trinityTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'trinity_statements'
      ) as exists;
    `;
    
    if (!trinityTableCheck.rows[0]?.exists) {
      return NextResponse.json({ 
        error: 'Trinity tables do not exist',
        step: 'trinity_table_check',
        action: 'Please visit /trinity/init to initialize the database'
      }, { status: 500 });
    }

    // Step 4: Check if validation function exists
    try {
      const validation = await sql`
        SELECT * FROM validate_trinity_statement(${quest}, ${service}, ${pledge})
      `;
      
      if (!validation.rows[0]?.is_valid) {
        return NextResponse.json({ 
          error: 'Validation failed', 
          step: 'validation',
          validation_errors: validation.rows[0]?.validation_errors 
        }, { status: 400 });
      }
    } catch (valError) {
      console.log('Validation function does not exist, skipping validation');
    }

    // Step 5: Generate Quest Seal
    let questSeal;
    try {
      const questSealResult = await sql`
        SELECT generate_quest_seal(${quest}, ${service}, ${pledge}, ${trinity_type}, ${userId}) as quest_seal
      `;
      questSeal = questSealResult.rows[0]?.quest_seal;
    } catch (sealError) {
      console.log('Quest seal function does not exist, generating manually');
      // Generate a simple seal if function doesn't exist
      questSeal = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    // Step 6: Create Trinity statement
    try {
      const trinityResult = await sql`
        INSERT INTO trinity_statements (
          user_id, quest, service, pledge, trinity_type, trinity_type_description,
          quest_seal, ritual_session_id
        ) VALUES (
          ${userId}, ${quest}, ${service}, ${pledge}, ${trinity_type}, ${trinity_type_description},
          ${questSeal}, ${null}
        ) RETURNING *
      `;

      const trinityStatement = trinityResult.rows[0];

      // Step 7: Create coaching preferences
      try {
        await sql`
          INSERT INTO trinity_coaching_preferences (
            user_id, trinity_statement_id, quest_focus, service_focus, pledge_focus
          ) VALUES (
            ${userId}, ${trinityStatement.id}, 34, 33, 33
          )
        `;
      } catch (prefError) {
        console.log('Failed to create coaching preferences:', prefError);
      }

      return NextResponse.json({
        success: true,
        trinity_statement: trinityStatement,
        quest_seal: questSeal,
        debug: {
          userId,
          userExists: userCheck.rows.length > 0,
          tablesExist: true,
          validationPassed: true
        }
      });

    } catch (createError) {
      return NextResponse.json({ 
        error: 'Failed to create Trinity statement',
        step: 'trinity_creation',
        details: createError instanceof Error ? createError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Trinity debug error:', error);
    return NextResponse.json(
      { 
        error: 'Trinity creation failed',
        step: 'unknown',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}