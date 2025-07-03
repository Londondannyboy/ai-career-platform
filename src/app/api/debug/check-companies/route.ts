/**
 * Simple check for companies in Neon database
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking Neon database for companies...');
    console.log('📊 DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    // Simple query to check if we can connect and if there's data
    const result = await sql`
      SELECT COUNT(*) as count FROM company_enrichments
    `;
    
    const count = result.rows[0]?.count || 0;
    console.log(`📊 Found ${count} companies in Neon database`);
    
    // If we have companies, get a sample
    let sampleCompany = null;
    if (count > 0) {
      const sampleResult = await sql`
        SELECT company_name, employee_count, last_enriched 
        FROM company_enrichments 
        LIMIT 1
      `;
      sampleCompany = sampleResult.rows[0];
    }
    
    return NextResponse.json({
      success: true,
      database: 'Neon',
      companiesCount: parseInt(count),
      sampleCompany,
      message: count > 0 ? 'Companies found in Neon database' : 'No companies in database yet'
    });
    
  } catch (error) {
    console.error('Database check failed:', error);
    return NextResponse.json({
      success: false,
      database: 'Neon',
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Make sure DATABASE_URL is set in environment variables'
    }, { status: 500 });
  }
}