/**
 * Database connection wrapper
 * Handles environment variable mapping for Vercel Postgres
 */

import { sql as vercelSql } from '@vercel/postgres';

// Clean up DATABASE_URL (remove any line breaks or extra whitespace)
let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  databaseUrl = databaseUrl.replace(/\s+/g, '').trim();
  console.log('🔗 Cleaned DATABASE_URL length:', databaseUrl.length);
}

// Set POSTGRES_URL from cleaned DATABASE_URL if not already set
if (!process.env.POSTGRES_URL && databaseUrl) {
  process.env.POSTGRES_URL = databaseUrl;
  console.log('✅ Set POSTGRES_URL from cleaned DATABASE_URL');
}

// Export the sql function
export const sql = vercelSql;

// Export a helper to check if database is configured
export const isDatabaseConfigured = () => {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
};