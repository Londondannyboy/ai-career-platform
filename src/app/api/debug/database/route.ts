/**
 * Database Debug Endpoint
 * Helps diagnose database issues and missing data
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting database debug check...');

    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'company_enrichments'
      );
    `;

    const tableExists = tableCheck.rows[0]?.exists;
    console.log('📋 Table exists:', tableExists);

    let companies: any[] = [];
    let tableSchema: any[] = [];
    let sampleData: any = null;

    if (tableExists) {
      // Get table schema
      const schemaResult = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'company_enrichments'
        ORDER BY ordinal_position;
      `;
      tableSchema = schemaResult.rows;

      // Get all companies
      const companiesResult = await sql`
        SELECT 
          id,
          company_name,
          normalized_name,
          canonical_identifier,
          employee_count,
          last_enriched,
          enrichment_type,
          CASE 
            WHEN enrichment_data IS NULL THEN 'null'
            WHEN enrichment_data::text = '{}' THEN 'empty_object'
            WHEN enrichment_data::text = '' THEN 'empty_string'
            ELSE 'has_data'
          END as data_status
        FROM company_enrichments 
        ORDER BY last_enriched DESC NULLS LAST
      `;
      companies = companiesResult.rows;

      // Get sample enrichment data
      if (companies.length > 0) {
        const sampleResult = await sql`
          SELECT 
            company_name,
            enrichment_data
          FROM company_enrichments 
          WHERE enrichment_data IS NOT NULL
          LIMIT 1
        `;
        if (sampleResult.rows.length > 0) {
          sampleData = sampleResult.rows[0];
        }
      }
    }

    return NextResponse.json({
      success: true,
      debug: {
        tableExists,
        tableSchema,
        totalCompanies: companies.length,
        companies: companies.map(c => ({
          id: c.id,
          name: c.company_name,
          employeeCount: c.employee_count,
          lastEnriched: c.last_enriched,
          dataStatus: c.data_status,
          enrichmentType: c.enrichment_type
        })),
        sampleData: sampleData ? {
          companyName: sampleData.company_name,
          hasEnrichmentData: !!sampleData.enrichment_data,
          enrichmentDataType: typeof sampleData.enrichment_data,
          enrichmentDataSample: typeof sampleData.enrichment_data === 'string' 
            ? sampleData.enrichment_data.substring(0, 200) + '...'
            : JSON.stringify(sampleData.enrichment_data).substring(0, 200) + '...'
        } : null
      }
    });

  } catch (error) {
    console.error('Database debug failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Database debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}