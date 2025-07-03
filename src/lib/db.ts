/**
 * Database connection wrapper
 * Handles environment variable mapping for Vercel Postgres
 */

import { sql as vercelSql } from '@vercel/postgres';

// Set POSTGRES_URL from DATABASE_URL if not already set
if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}

// Export the sql function
export const sql = vercelSql;

// Export a helper to check if database is configured
export const isDatabaseConfigured = () => {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
};