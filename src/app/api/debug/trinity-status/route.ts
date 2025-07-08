import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking Trinity database status...');

    // Check if Trinity tables exist
    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'trinity_%'
      ORDER BY table_name
    `;

    const trinityTables = tablesCheck.rows.map(row => row.table_name);

    // Check if users table exists (required for Trinity foreign keys)
    const usersCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;

    const usersTableExists = usersCheck.rows[0]?.exists;

    // Check if validation function exists
    let validationFunctionExists = false;
    try {
      await sql`SELECT validate_trinity_statement('test', 'test', 'test')`;
      validationFunctionExists = true;
    } catch (error) {
      console.log('Validation function does not exist');
    }

    // Check if Quest Seal function exists
    let questSealFunctionExists = false;
    try {
      await sql`SELECT generate_quest_seal('test', 'test', 'test', 'F', 'test')`;
      questSealFunctionExists = true;
    } catch (error) {
      console.log('Quest Seal function does not exist');
    }

    return NextResponse.json({
      success: true,
      trinityTables: trinityTables,
      trinityTablesCount: trinityTables.length,
      usersTableExists: usersTableExists,
      validationFunctionExists: validationFunctionExists,
      questSealFunctionExists: questSealFunctionExists,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      postgresUrl: process.env.POSTGRES_URL ? 'Set' : 'Not set',
      recommendation: trinityTables.length === 0 ? 'Visit /trinity/init to initialize Trinity database' : 'Trinity database appears ready'
    });

  } catch (error) {
    console.error('Trinity status check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Trinity status check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}