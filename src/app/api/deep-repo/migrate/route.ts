import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DeepRepoService } from '@/lib/profile/deepRepoService';
import { sql } from '@/lib/db';

// POST /api/deep-repo/migrate - Migrate Trinity data to Deep Repo
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you might want to add proper admin check)
    // For now, we'll allow any authenticated user to migrate their own data
    
    const body = await request.json();
    const { migrateAll = false } = body;

    if (migrateAll) {
      // Admin-only: Migrate all Trinity data
      const migratedCount = await DeepRepoService.migrateTrinityData();
      
      return NextResponse.json({
        success: true,
        message: `Successfully migrated ${migratedCount} Trinity records to Deep Repo`,
        migratedCount
      });
    } else {
      // Migrate current user's Trinity data only
      const result = await sql`
        SELECT 
          ts.quest,
          ts.service,
          ts.pledge,
          ts.trinity_type,
          ts.trinity_type_description,
          ts.quest_seal,
          ts.created_at as trinity_created_at,
          ts.updated_at as trinity_updated_at,
          tcp.quest_focus,
          tcp.service_focus,
          tcp.pledge_focus,
          tcp.coaching_methodology,
          tcp.coaching_tone
        FROM trinity_statements ts
        LEFT JOIN trinity_coaching_preferences tcp ON tcp.trinity_statement_id = ts.id
        WHERE ts.user_id = ${userId} AND ts.is_active = true
        LIMIT 1
      `;

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No active Trinity found to migrate'
        });
      }

      const trinityData = result.rows[0];
      
      // Create Trinity object for Deep Repo
      const trinity = {
        quest: trinityData.quest,
        service: trinityData.service,
        pledge: trinityData.pledge,
        type: trinityData.trinity_type,
        typeDescription: trinityData.trinity_type_description,
        questSeal: trinityData.quest_seal,
        createdAt: trinityData.trinity_created_at,
        updatedAt: trinityData.trinity_updated_at,
        focus: trinityData.quest_focus ? {
          quest: trinityData.quest_focus,
          service: trinityData.service_focus,
          pledge: trinityData.pledge_focus
        } : undefined,
        coachingPreferences: trinityData.coaching_methodology ? {
          methodology: trinityData.coaching_methodology,
          tone: trinityData.coaching_tone
        } : undefined
      };

      // Save to Deep Repo
      const success = await DeepRepoService.saveTrinity(userId, trinity);

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to migrate Trinity to Deep Repo' },
          { status: 500 }
        );
      }

      // Also migrate any existing profile data
      const profileData = await sql`
        SELECT 
          up.id,
          up.user_id,
          u.name,
          u.full_name,
          u.current_role,
          u.company,
          u.professional_goals,
          u.skills,
          u.industry,
          u.linkedin_url
        FROM users u
        LEFT JOIN user_profiles up ON up.user_id = u.id
        WHERE u.id = ${userId}
        LIMIT 1
      `;

      if (profileData.rows.length > 0) {
        const userData = profileData.rows[0];
        
        // Create surface repo data from existing user data
        const surfaceData = {
          professional_headline: userData.current_role ? `${userData.current_role} at ${userData.company}` : '',
          summary: userData.professional_goals,
          current_role: userData.current_role,
          current_company: userData.company,
          core_skills: userData.skills || [],
          social_links: userData.linkedin_url ? { linkedin: userData.linkedin_url } : {},
          is_public: true,
          is_searchable: true,
          show_contact_info: false
        };

        await DeepRepoService.mergeRepoLayer(userId, 'surface', surfaceData);
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully migrated Trinity and profile data to Deep Repo',
        trinity
      });
    }
  } catch (error) {
    console.error('Error migrating Trinity data:', error);
    return NextResponse.json(
      { error: 'Failed to migrate Trinity data' },
      { status: 500 }
    );
  }
}