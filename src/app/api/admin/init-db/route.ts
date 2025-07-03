/**
 * Initialize Database Tables
 * Creates company_enrichments table if it doesn't exist
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔨 Initializing database...');

    // Enable UUID extension first
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    console.log('✅ UUID extension enabled');

    // Create the company_enrichments table
    await sql`
      CREATE TABLE IF NOT EXISTS company_enrichments (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        company_name TEXT NOT NULL UNIQUE,
        normalized_name TEXT NOT NULL,
        canonical_identifier TEXT,
        employee_count INTEGER DEFAULT 0,
        last_enriched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        enrichment_type TEXT DEFAULT 'harvestapi',
        enrichment_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Company enrichments table created');

    // Add indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_company_enrichments_normalized_name ON company_enrichments(normalized_name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_company_enrichments_canonical_identifier ON company_enrichments(canonical_identifier)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_company_enrichments_last_enriched ON company_enrichments(last_enriched)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_company_enrichments_company_name_lower ON company_enrichments(LOWER(company_name))`;
    console.log('✅ Indexes created');

    // Check if table was created successfully
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'company_enrichments'
      );
    `;

    // Get count of companies
    const countResult = await sql`SELECT COUNT(*) as count FROM company_enrichments`;
    const count = countResult.rows[0]?.count || 0;

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      tableExists: tableCheck.rows[0]?.exists,
      companiesCount: parseInt(count),
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      postgresUrl: process.env.POSTGRES_URL ? 'Set' : 'Not set'
    });

  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Database initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}