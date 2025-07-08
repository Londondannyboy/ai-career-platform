import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// Trinity API endpoint for creating and managing Trinity statements
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { quest, service, pledge, trinity_type, trinity_type_description, ritual_session_id } = body;

    // Validate Trinity statements
    const validation = await sql`
      SELECT * FROM validate_trinity_statement(${quest}, ${service}, ${pledge})
    `;

    if (!validation.rows[0]?.is_valid) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        validation_errors: validation.rows[0]?.validation_errors 
      }, { status: 400 });
    }

    // Check if user already has an active Trinity
    const existingTrinity = await sql`
      SELECT id FROM trinity_statements 
      WHERE user_id = ${userId} AND is_active = TRUE
    `;

    if (existingTrinity.rows.length > 0) {
      return NextResponse.json({ 
        error: 'User already has an active Trinity statement' 
      }, { status: 409 });
    }

    // Generate Quest Seal
    const questSealResult = await sql`
      SELECT generate_quest_seal(${quest}, ${service}, ${pledge}, ${trinity_type}, ${userId}) as quest_seal
    `;
    const questSeal = questSealResult.rows[0]?.quest_seal;

    // Create Trinity statement
    const trinityResult = await sql`
      INSERT INTO trinity_statements (
        user_id, quest, service, pledge, trinity_type, trinity_type_description,
        quest_seal, ritual_session_id
      ) VALUES (
        ${userId}, ${quest}, ${service}, ${pledge}, ${trinity_type}, ${trinity_type_description},
        ${questSeal}, ${ritual_session_id}
      ) RETURNING *
    `;

    const trinityStatement = trinityResult.rows[0];

    // Create default Trinity coaching preferences
    await sql`
      INSERT INTO trinity_coaching_preferences (
        user_id, trinity_statement_id, quest_focus, service_focus, pledge_focus
      ) VALUES (
        ${userId}, ${trinityStatement.id}, 34, 33, 33
      )
    `;

    // Log evolution history
    await sql`
      INSERT INTO trinity_evolution_history (
        user_id, trinity_statement_id, change_type, new_value, triggered_by
      ) VALUES (
        ${userId}, ${trinityStatement.id}, 'created', 
        ${'Quest: ' + quest + ' | Service: ' + service + ' | Pledge: ' + pledge}, 'user'
      )
    `;

    // Create content moderation entry
    await sql`
      INSERT INTO trinity_content_moderation (
        trinity_statement_id, status, ai_toxicity_score
      ) VALUES (
        ${trinityStatement.id}, 'approved', 0.00
      )
    `;

    return NextResponse.json({
      success: true,
      trinity_statement: trinityStatement,
      quest_seal: questSeal
    });

  } catch (error) {
    console.error('Trinity creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create Trinity statement' },
      { status: 500 }
    );
  }
}

// Get user's Trinity statement and preferences
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active Trinity statement
    const trinityResult = await sql`
      SELECT 
        ts.*,
        tcp.quest_focus,
        tcp.service_focus,
        tcp.pledge_focus,
        tcp.coaching_methodology,
        tcp.coaching_tone,
        tcp.context_awareness_level,
        tcp.voice_enabled
      FROM trinity_statements ts
      LEFT JOIN trinity_coaching_preferences tcp ON ts.id = tcp.trinity_statement_id
      WHERE ts.user_id = ${userId} AND ts.is_active = TRUE
    `;

    if (trinityResult.rows.length === 0) {
      return NextResponse.json({ 
        has_trinity: false,
        message: 'No active Trinity statement found' 
      });
    }

    const trinity = trinityResult.rows[0];

    return NextResponse.json({
      has_trinity: true,
      trinity_statement: {
        id: trinity.id,
        quest: trinity.quest,
        service: trinity.service,
        pledge: trinity.pledge,
        trinity_type: trinity.trinity_type,
        trinity_type_description: trinity.trinity_type_description,
        quest_seal: trinity.quest_seal,
        created_at: trinity.created_at,
        ritual_completed_at: trinity.ritual_completed_at
      },
      coaching_preferences: {
        quest_focus: trinity.quest_focus || 34,
        service_focus: trinity.service_focus || 33,
        pledge_focus: trinity.pledge_focus || 33,
        coaching_methodology: trinity.coaching_methodology || 'balanced',
        coaching_tone: trinity.coaching_tone || 'supportive',
        context_awareness_level: trinity.context_awareness_level || 'high',
        voice_enabled: trinity.voice_enabled ?? true
      }
    });

  } catch (error) {
    console.error('Trinity fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Trinity statement' },
      { status: 500 }
    );
  }
}

// Update Trinity coaching preferences
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      quest_focus, 
      service_focus, 
      pledge_focus,
      coaching_methodology,
      coaching_tone,
      context_awareness_level,
      voice_enabled 
    } = body;

    // Validate focus percentages sum to 100
    if (quest_focus + service_focus + pledge_focus !== 100) {
      return NextResponse.json({ 
        error: 'Trinity focus percentages must sum to 100' 
      }, { status: 400 });
    }

    // Update coaching preferences
    const updateResult = await sql`
      UPDATE trinity_coaching_preferences 
      SET 
        quest_focus = ${quest_focus},
        service_focus = ${service_focus},
        pledge_focus = ${pledge_focus},
        coaching_methodology = ${coaching_methodology},
        coaching_tone = ${coaching_tone},
        context_awareness_level = ${context_awareness_level},
        voice_enabled = ${voice_enabled},
        updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING *
    `;

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'No Trinity preferences found to update' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      coaching_preferences: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Trinity preferences update error:', error);
    return NextResponse.json(
      { error: 'Failed to update Trinity preferences' },
      { status: 500 }
    );
  }
}