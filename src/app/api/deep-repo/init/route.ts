import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'check'; // check, init, clean
    
    if (mode === 'check') {
      // Just check current status
      const tableCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('user_profiles', 'repo_access_permissions')
      `;
      
      const profileCount = tableCheck.rows.some(r => r.table_name === 'user_profiles') 
        ? (await sql`SELECT COUNT(*) as count FROM user_profiles`).rows[0].count
        : 0;
      
      return NextResponse.json({
        status: 'check',
        tablesExist: tableCheck.rows.map(r => r.table_name),
        profileCount,
        ready: tableCheck.rows.length === 2
      });
    }
    
    if (mode === 'clean') {
      // Drop existing tables and start fresh
      await sql`DROP TABLE IF EXISTS repo_access_permissions CASCADE`;
      await sql`DROP TABLE IF EXISTS user_profiles CASCADE`;
      await sql`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`;
      await sql`DROP FUNCTION IF EXISTS calculate_profile_completeness(VARCHAR) CASCADE`;
      await sql`DROP FUNCTION IF EXISTS grant_repo_access(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, INTEGER) CASCADE`;
      await sql`DROP FUNCTION IF EXISTS migrate_trinity_to_deep_repo() CASCADE`;
      
      return NextResponse.json({
        status: 'cleaned',
        message: 'All Deep Repo tables and functions dropped'
      });
    }
    
    if (mode === 'init') {
      // Read and execute the migration
      const migrationPath = path.join(process.cwd(), 'src/lib/db/migrations/create_user_profiles_deep_repo.sql');
      const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
      
      // Execute the migration statements
      // Split complex SQL into individual statements
      const statements = migrationSQL
        .split(/;(?=\s*(?:CREATE|DROP|ALTER|INSERT|UPDATE|DELETE|GRANT|REVOKE|$))/i)
        .filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          // Execute raw SQL using template literal
          await sql.query(statement + ';');
        }
      }
      
      // Verify creation
      const tableCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('user_profiles', 'repo_access_permissions')
      `;
      
      // Check for existing Trinity data
      let trinityCount = 0;
      try {
        const result = await sql`SELECT COUNT(*) as count FROM trinity_statements WHERE is_active = true`;
        trinityCount = result.rows[0]?.count || 0;
      } catch (e) {
        // Trinity table might not exist
      }
      
      return NextResponse.json({
        status: 'initialized',
        message: 'Deep Repo structure created successfully',
        tablesCreated: tableCheck.rows.map(r => r.table_name),
        existingTrinityData: trinityCount,
        nextSteps: trinityCount > 0 
          ? 'Run /api/deep-repo/migrate to move Trinity data' 
          : 'Ready to use Deep Repo'
      });
    }
    
    return NextResponse.json({
      error: 'Invalid mode',
      validModes: ['check', 'init', 'clean'],
      usage: '/api/deep-repo/init?mode=check|init|clean'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Deep Repo operation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}