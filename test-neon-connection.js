const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Testing Neon.tech connection...\n');
  
  const connectionString = process.env.NEON_DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ NEON_DATABASE_URL not found in .env.local');
    console.log('\nPlease add your Neon.tech connection string to .env.local:');
    console.log('NEON_DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require\n');
    return;
  }
  
  console.log('✅ Connection string found');
  console.log(`📍 Connecting to: ${connectionString.split('@')[1]?.split('/')[0] || 'unknown'}\n`);
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to Neon.tech!\n');
    
    // Test basic query
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', result.rows[0].version.split(',')[0]);
    
    // Check for pgvector
    const vectorCheck = await client.query(`
      SELECT * FROM pg_extension WHERE extname = 'vector'
    `);
    
    if (vectorCheck.rows.length > 0) {
      console.log('✅ pgvector extension is installed');
    } else {
      console.log('⚠️  pgvector extension not found - you may need to enable it');
      console.log('   Run this in Neon SQL editor: CREATE EXTENSION vector;');
    }
    
    client.release();
    console.log('\n✨ Connection test successful!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check your connection string is correct');
    console.log('2. Ensure your Neon project is active');
    console.log('3. Verify your IP is not blocked (Neon allows all IPs by default)');
  } finally {
    await pool.end();
  }
}

testConnection();