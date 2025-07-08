import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE id = ${userId}
    `;

    if (existingUser.rows.length > 0) {
      // Update existing user
      await sql`
        UPDATE users 
        SET 
          email = ${user.emailAddresses[0]?.emailAddress || 'noemail@quest.app'},
          name = ${user.firstName || 'Quest User'} || ' ' || ${user.lastName || ''},
          first_name = ${user.firstName},
          last_name = ${user.lastName},
          full_name = ${user.fullName},
          profile_image_url = ${user.imageUrl},
          last_active_at = NOW(),
          updated_at = NOW()
        WHERE id = ${userId}
      `;
      
      return NextResponse.json({ 
        success: true, 
        message: 'User updated',
        userId 
      });
    } else {
      // Create new user
      await sql`
        INSERT INTO users (
          id, 
          email, 
          name,
          first_name,
          last_name,
          full_name,
          profile_image_url,
          created_at,
          updated_at
        ) VALUES (
          ${userId},
          ${user.emailAddresses[0]?.emailAddress || 'noemail@quest.app'},
          ${user.firstName || 'Quest User'} || ' ' || ${user.lastName || ''},
          ${user.firstName},
          ${user.lastName},
          ${user.fullName},
          ${user.imageUrl},
          NOW(),
          NOW()
        )
      `;
      
      return NextResponse.json({ 
        success: true, 
        message: 'User created',
        userId 
      });
    }

  } catch (error) {
    console.error('User sync error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return NextResponse.json({
        error: 'Users table not found',
        details: errorMessage,
        action: 'Please visit /trinity/init to initialize the database first'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      error: 'Failed to sync user',
      details: errorMessage
    }, { status: 500 });
  }
}

// GET endpoint to check if user exists
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userResult = await sql`
      SELECT id, email, name, created_at 
      FROM users 
      WHERE id = ${userId}
    `;

    if (userResult.rows.length === 0) {
      return NextResponse.json({ 
        exists: false,
        userId 
      });
    }

    return NextResponse.json({
      exists: true,
      user: userResult.rows[0]
    });

  } catch (error) {
    console.error('User check error:', error);
    return NextResponse.json({
      error: 'Failed to check user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}