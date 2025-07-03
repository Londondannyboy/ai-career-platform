/**
 * Script to enrich CK Delta with HarvestAPI
 * Run with: npx tsx scripts/enrich-ckdelta.ts
 */

import dotenv from 'dotenv';
import { sql } from '@vercel/postgres';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function enrichCKDelta() {
  try {
    console.log('🚀 Starting CK Delta enrichment...');
    
    // Check if we have the necessary environment variables
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment');
    }
    
    if (!process.env.APIFY_API_TOKEN) {
      throw new Error('APIFY_API_TOKEN not found in environment');
    }
    
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    console.log(`📡 Using API at: ${baseUrl}`);
    
    // Call the enrichment API
    const response = await fetch(`${baseUrl}/api/enrichment/company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyIdentifier: 'CK Delta',
        options: {
          forceRefresh: true,
          maxEmployees: 10
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ CK Delta enriched successfully!');
      console.log(`📊 Found ${data.data.employeeCount} employees`);
      console.log(`🔗 ${data.data.relationshipCount} relationships mapped`);
      console.log(`💡 ${data.data.intelligenceScore} intelligence score`);
      
      // Check database directly
      const result = await sql`
        SELECT company_name, employee_count, last_enriched 
        FROM company_enrichments 
        WHERE LOWER(company_name) = 'ck delta'
      `;
      
      if (result.rows.length > 0) {
        console.log('\n📋 Database verification:');
        console.log(`Company: ${result.rows[0].company_name}`);
        console.log(`Employees: ${result.rows[0].employee_count}`);
        console.log(`Last enriched: ${result.rows[0].last_enriched}`);
      }
    } else {
      console.error('❌ Enrichment failed:', data.error);
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Run the enrichment
enrichCKDelta();