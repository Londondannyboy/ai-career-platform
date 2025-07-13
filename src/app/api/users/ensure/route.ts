import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/neon';

export async function POST(request: NextRequest) {
  try {
    const { userId, name, email } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    console.log('📝 Ensuring user exists in Neon PostgreSQL:', userId);

    // Check if user already exists
    const existingResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (existingResult.rows.length > 0) {
      console.log('✅ User already exists in Neon PostgreSQL:', userId);
      return NextResponse.json({ exists: true, created: false });
    }

    // Create user if doesn't exist
    console.log('📝 Creating user in Neon PostgreSQL:', userId);
    const insertResult = await query(
      `INSERT INTO users (
        id, 
        name, 
        email, 
        created_at, 
        updated_at
      ) VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *`,
      [
        userId,
        name || 'Quest User',
        email || ''
      ]
    );

    const createdUser = insertResult.rows[0];
    console.log('✅ User created successfully in Neon PostgreSQL:', createdUser);

    return NextResponse.json({ 
      exists: true, 
      created: true, 
      user: createdUser 
    });

  } catch (error) {
    console.error('❌ Error ensuring user exists:', error);
    return NextResponse.json({ error: 'Failed to ensure user exists' }, { status: 500 });
  }
}