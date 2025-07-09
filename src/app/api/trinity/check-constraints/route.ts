import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Check what's preventing Trinity deletion
export async function GET(request: NextRequest) {
  try {
    // Check foreign key constraints
    const foreignKeys = await sql`
      SELECT
        tc.table_name AS referencing_table, 
        kcu.column_name AS referencing_column,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column,
        tc.constraint_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'trinity_statements'
    `;
    
    // Check if any tables reference trinity_statements
    const dependencies = [];
    for (const fk of foreignKeys.rows) {
      // Build query dynamically since we can't use identifiers with template literals
      let countResult;
      try {
        // Use a safe table name check
        const tableName = fk.referencing_table;
        if (tableName === 'trinity_evolution_history') {
          countResult = await sql`SELECT COUNT(*) as count FROM trinity_evolution_history`;
        } else if (tableName === 'trinity_coaching_preferences') {
          countResult = await sql`SELECT COUNT(*) as count FROM trinity_coaching_preferences`;
        } else if (tableName === 'trinity_compatibility') {
          countResult = await sql`SELECT COUNT(*) as count FROM trinity_compatibility`;
        } else {
          // For unknown tables, we'll just note them
          countResult = { rows: [{ count: 'unknown' }] };
        }
      } catch (e) {
        countResult = { rows: [{ count: 'error' }] };
      }
      
      dependencies.push({
        table: fk.referencing_table,
        column: fk.referencing_column,
        constraint: fk.constraint_name,
        rowCount: countResult.rows[0]?.count || 0
      });
    }
    
    // Check Dan's Trinity
    const dansTrinity = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = 'user_2z5UB58sfZFnapkymfEkFzGIlzK'
    `;
    
    // Check all Trinity statements
    const allTrinities = await sql`
      SELECT user_id, is_active, created_at
      FROM trinity_statements
      ORDER BY created_at DESC
    `;
    
    return NextResponse.json({
      foreignKeys: foreignKeys.rows,
      dependencies,
      dansTrinity: {
        count: dansTrinity.rows.length,
        data: dansTrinity.rows
      },
      allTrinities: {
        count: allTrinities.rows.length,
        data: allTrinities.rows
      },
      recommendation: dependencies.length > 0 
        ? 'Other tables depend on trinity_statements. Need to handle these first.'
        : 'No dependencies found. Safe to migrate.'
    });
  } catch (error) {
    console.error('Check constraints error:', error);
    return NextResponse.json({
      error: 'Failed to check constraints',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}