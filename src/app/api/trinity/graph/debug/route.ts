import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import neo4j from 'neo4j-driver';

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // 1. Check if we can import and use SQL
  try {
    diagnostics.checks.sqlImport = 'success';
    diagnostics.checks.sqlType = typeof sql;
  } catch (error) {
    diagnostics.checks.sqlImport = 'failed';
    diagnostics.checks.sqlError = error instanceof Error ? error.message : 'Unknown error';
  }

  // 2. Check database connection
  try {
    const result = await sql`SELECT NOW() as current_time`;
    diagnostics.checks.database = 'connected';
    diagnostics.checks.dbTime = result.rows[0]?.current_time;
  } catch (error) {
    diagnostics.checks.database = 'failed';
    diagnostics.checks.dbError = error instanceof Error ? error.message : 'Unknown error';
    diagnostics.checks.dbCode = (error as any)?.code;
  }

  // 3. Check if trinity_statements table exists
  try {
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'trinity_statements'
      ) as exists
    `;
    diagnostics.checks.trinityTable = tableCheck.rows[0]?.exists ? 'exists' : 'missing';
  } catch (error) {
    diagnostics.checks.trinityTable = 'error';
    diagnostics.checks.trinityTableError = error instanceof Error ? error.message : 'Unknown error';
  }

  // 4. Check Neo4j connection
  try {
    const driver = neo4j.driver(
      process.env.NEO4J_URI || 'neo4j+s://20b2ddda.databases.neo4j.io',
      neo4j.auth.basic(
        process.env.NEO4J_USERNAME || 'neo4j',
        process.env.NEO4J_PASSWORD || 'MPfTn0be2NxKxrnM7EZ5bUGrzVb_ZxM4CGnXUWp1ylw'
      )
    );
    
    const session = driver.session();
    const result = await session.run('RETURN 1 as test');
    await session.close();
    await driver.close();
    
    diagnostics.checks.neo4j = 'connected';
    diagnostics.checks.neo4jTest = result.records[0]?.get('test');
  } catch (error) {
    diagnostics.checks.neo4j = 'failed';
    diagnostics.checks.neo4jError = error instanceof Error ? error.message : 'Unknown error';
  }

  // 5. Environment variables check
  diagnostics.environment = {
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasNeo4jUri: !!process.env.NEO4J_URI,
    hasNeo4jUsername: !!process.env.NEO4J_USERNAME,
    hasNeo4jPassword: !!process.env.NEO4J_PASSWORD,
    nodeEnv: process.env.NODE_ENV
  };

  // 6. Try a simple Trinity query
  try {
    const testUserId = 'test-user-123';
    const result = await sql`
      SELECT COUNT(*) as count
      FROM trinity_statements
      WHERE user_id = ${testUserId}
    `;
    diagnostics.checks.trinityQuery = 'success';
    diagnostics.checks.trinityCount = result.rows[0]?.count;
  } catch (error) {
    diagnostics.checks.trinityQuery = 'failed';
    diagnostics.checks.trinityQueryError = error instanceof Error ? error.message : 'Unknown error';
    diagnostics.checks.trinityQueryCode = (error as any)?.code;
  }

  return NextResponse.json(diagnostics);
}