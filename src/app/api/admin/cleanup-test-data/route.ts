import { auth } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

/**
 * POST /api/admin/cleanup-test-data
 * Remove orphaned test data with test-user-123 owner
 */
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log(`🧹 Starting cleanup of test data for user: ${userId}`);

    // Get counts before cleanup
    const workspaceCount = await sql`
      SELECT COUNT(*) as count FROM workspaces WHERE owner_id = 'test-user-123'
    `;
    
    const documentCount = await sql`
      SELECT COUNT(*) as count FROM documents WHERE workspace_id IN 
      (SELECT id FROM workspaces WHERE owner_id = 'test-user-123')
    `;

    // Clean up documents first (foreign key constraint)
    const documentsDeleted = await sql`
      DELETE FROM documents 
      WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = 'test-user-123'
      )
    `;

    // Clean up workspaces
    const workspacesDeleted = await sql`
      DELETE FROM workspaces WHERE owner_id = 'test-user-123'
    `;

    // Clean up any other test data
    const enrichmentsDeleted = await sql`
      DELETE FROM company_enrichments WHERE created_by = 'test-user-123'
    `;

    console.log(`✅ Cleanup completed:
      - ${workspacesDeleted.length} workspaces deleted
      - ${documentsDeleted.length} documents deleted  
      - ${enrichmentsDeleted.length} enrichments deleted`);

    return Response.json({
      success: true,
      message: 'Test data cleanup completed',
      stats: {
        workspacesDeleted: workspacesDeleted.length,
        documentsDeleted: documentsDeleted.length,
        enrichmentsDeleted: enrichmentsDeleted.length,
        originalCounts: {
          workspaces: workspaceCount[0].count,
          documents: documentCount[0].count
        }
      }
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}