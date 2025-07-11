import { sql } from '@/lib/db';
import type { 
  SurfaceRepo, 
  MidRepo as WorkingRepo, 
  DeepRepo as PersonalRepo, 
  FullRepo 
} from '@/types/tiered-repo';

export interface DeepRepoTrinity {
  quest: string;
  service: string;
  pledge: string;
  type: 'F' | 'L' | 'M'; // Foundation, Living, Mixed
  typeDescription?: string;
  questSeal?: string;
  createdAt: Date;
  updatedAt: Date;
  focus?: {
    quest: number;
    service: number;
    pledge: number;
  };
  coachingPreferences?: {
    methodology?: string;
    tone?: string;
  };
}

export interface DeepRepoData extends Partial<FullRepo> {
  trinity?: DeepRepoTrinity;
  // Additional deep repo fields that might not be in FullRepo
  deepReflections?: string[];
}

export interface UserProfile {
  id: string;
  userId: string;
  surfaceRepo: Partial<SurfaceRepo>;
  surfacePrivateRepo: Partial<WorkingRepo>; // Using working_repo column
  personalRepo: Partial<PersonalRepo>;
  deepRepo: DeepRepoData;
  profileCompleteness: number;
  createdAt: Date;
  updatedAt: Date;
}

export type RepoLayer = 'surface' | 'surfacePrivate' | 'personal' | 'deep';

export interface RepoAccessLevel {
  surface: boolean;
  surfacePrivate: boolean;
  personal: boolean;
  deep: boolean;
}

export class DeepRepoService {
  // Get or create user profile
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // First try to get existing profile
      let result = await sql`
        SELECT * FROM user_profiles
        WHERE user_id = ${userId}
        LIMIT 1
      `;
      
      // If no profile exists, create one
      if (result.rows.length === 0) {
        result = await sql`
          INSERT INTO user_profiles (user_id)
          VALUES (${userId})
          RETURNING *
        `;
      }
      
      const row = result.rows[0];
      if (!row) return null;
      
      return {
        id: row.id,
        userId: row.user_id,
        surfaceRepo: row.surface_repo || {},
        surfacePrivateRepo: row.working_repo || {}, // Map working_repo to surfacePrivateRepo
        personalRepo: row.personal_repo || {},
        deepRepo: row.deep_repo || {},
        profileCompleteness: row.profile_completeness || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
  
  // Get specific repo layer
  static async getRepoLayer(userId: string, layer: RepoLayer): Promise<any> {
    try {
      const columnMap = {
        surface: 'surface_repo',
        surfacePrivate: 'working_repo', // Reuse working_repo column
        personal: 'personal_repo',
        deep: 'deep_repo'
      };
      
      // Vercel SQL doesn't support dynamic column names, so we need to use specific queries
      let result;
      switch (layer) {
        case 'surface':
          result = await sql`SELECT surface_repo FROM user_profiles WHERE user_id = ${userId} LIMIT 1`;
          break;
        case 'surfacePrivate':
          result = await sql`SELECT working_repo FROM user_profiles WHERE user_id = ${userId} LIMIT 1`;
          break;
        case 'personal':
          result = await sql`SELECT personal_repo FROM user_profiles WHERE user_id = ${userId} LIMIT 1`;
          break;
        case 'deep':
          result = await sql`SELECT deep_repo FROM user_profiles WHERE user_id = ${userId} LIMIT 1`;
          break;
        default:
          throw new Error(`Invalid layer: ${layer}`);
      }
      
      if (result.rows.length === 0) return null;
      
      // Get the column value based on the layer
      const columnName = columnMap[layer];
      return result.rows[0][columnName] || {};
    } catch (error) {
      console.error(`Error getting ${layer} repo:`, error);
      return null;
    }
  }
  
  // Update specific repo layer
  static async updateRepoLayer(userId: string, layer: RepoLayer, data: any): Promise<boolean> {
    try {
      const columnMap = {
        surface: 'surface_repo',
        surfacePrivate: 'working_repo', // Reuse working_repo column
        personal: 'personal_repo',
        deep: 'deep_repo'
      };
      
      // First ensure profile exists
      await this.getUserProfile(userId);
      
      // Vercel SQL doesn't support dynamic column names, so we need to use specific queries
      let result;
      switch (layer) {
        case 'surface':
          result = await sql`
            UPDATE user_profiles
            SET surface_repo = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
            WHERE user_id = ${userId}
            RETURNING id
          `;
          break;
        case 'surfacePrivate':
          result = await sql`
            UPDATE user_profiles
            SET working_repo = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
            WHERE user_id = ${userId}
            RETURNING id
          `;
          break;
        case 'personal':
          result = await sql`
            UPDATE user_profiles
            SET personal_repo = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
            WHERE user_id = ${userId}
            RETURNING id
          `;
          break;
        case 'deep':
          result = await sql`
            UPDATE user_profiles
            SET deep_repo = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
            WHERE user_id = ${userId}
            RETURNING id
          `;
          break;
        default:
          throw new Error(`Invalid layer: ${layer}`);
      }
      
      // Update profile completeness
      await sql`
        SELECT calculate_profile_completeness(${userId})
      `;
      
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error updating ${layer} repo:`, error);
      return false;
    }
  }
  
  // Merge update specific repo layer (preserves existing data)
  static async mergeRepoLayer(userId: string, layer: RepoLayer, updates: any): Promise<boolean> {
    try {
      const columnMap = {
        surface: 'surface_repo',
        surfacePrivate: 'working_repo', // Reuse working_repo column
        personal: 'personal_repo',
        deep: 'deep_repo'
      };
      
      // First ensure profile exists
      await this.getUserProfile(userId);
      
      // Vercel SQL doesn't support dynamic column names, so we need to use specific queries
      let result;
      switch (layer) {
        case 'surface':
          result = await sql`
            UPDATE user_profiles
            SET surface_repo = surface_repo || ${JSON.stringify(updates)}::jsonb, updated_at = NOW()
            WHERE user_id = ${userId}
            RETURNING id
          `;
          break;
        case 'surfacePrivate':
          result = await sql`
            UPDATE user_profiles
            SET working_repo = working_repo || ${JSON.stringify(updates)}::jsonb, updated_at = NOW()
            WHERE user_id = ${userId}
            RETURNING id
          `;
          break;
        case 'personal':
          result = await sql`
            UPDATE user_profiles
            SET personal_repo = personal_repo || ${JSON.stringify(updates)}::jsonb, updated_at = NOW()
            WHERE user_id = ${userId}
            RETURNING id
          `;
          break;
        case 'deep':
          result = await sql`
            UPDATE user_profiles
            SET deep_repo = deep_repo || ${JSON.stringify(updates)}::jsonb, updated_at = NOW()
            WHERE user_id = ${userId}
            RETURNING id
          `;
          break;
        default:
          throw new Error(`Invalid layer: ${layer}`);
      }
      
      // Update profile completeness
      await sql`
        SELECT calculate_profile_completeness(${userId})
      `;
      
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error merging ${layer} repo:`, error);
      return false;
    }
  }
  
  // Get Trinity from Deep Repo
  static async getTrinity(userId: string): Promise<DeepRepoTrinity | null> {
    try {
      const deepRepo = await this.getRepoLayer(userId, 'deep');
      return deepRepo?.trinity || null;
    } catch (error) {
      console.error('Error getting Trinity:', error);
      return null;
    }
  }
  
  // Save Trinity to Deep Repo
  static async saveTrinity(userId: string, trinity: DeepRepoTrinity): Promise<boolean> {
    try {
      const result = await sql`
        UPDATE user_profiles
        SET 
          deep_repo = jsonb_set(
            COALESCE(deep_repo, '{}'),
            '{trinity}',
            ${JSON.stringify(trinity)}::jsonb
          ),
          updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING id
      `;
      
      // If no profile exists yet, create it with Trinity
      if (result.rows.length === 0) {
        await sql`
          INSERT INTO user_profiles (user_id, deep_repo)
          VALUES (
            ${userId},
            ${JSON.stringify({ trinity })}::jsonb
          )
        `;
      }
      
      // Update profile completeness
      await sql`
        SELECT calculate_profile_completeness(${userId})
      `;
      
      return true;
    } catch (error) {
      console.error('Error saving Trinity:', error);
      return false;
    }
  }
  
  // Update specific Deep Repo field
  static async updateDeepRepo(userId: string, field: string, value: any): Promise<boolean> {
    try {
      const result = await sql`
        UPDATE user_profiles
        SET 
          deep_repo = jsonb_set(
            COALESCE(deep_repo, '{}'),
            ${`{${field}}`},
            ${JSON.stringify(value)}::jsonb
          ),
          updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING id
      `;
      
      // Update profile completeness
      await sql`
        SELECT calculate_profile_completeness(${userId})
      `;
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error updating Deep Repo:', error);
      return false;
    }
  }
  
  // Get entire Deep Repo
  static async getDeepRepo(userId: string): Promise<DeepRepoData | null> {
    try {
      return await this.getRepoLayer(userId, 'deep');
    } catch (error) {
      console.error('Error getting Deep Repo:', error);
      return null;
    }
  }
  
  // Check user access to another user's repo layers
  static async checkRepoAccess(ownerId: string, viewerId: string): Promise<RepoAccessLevel> {
    try {
      // Owner always has full access to their own data
      if (ownerId === viewerId) {
        return {
          surface: true,
          surfacePrivate: true,
          personal: true,
          deep: true
        };
      }
      
      const result = await sql`
        SELECT 
          surface_access,
          working_access,
          personal_access,
          deep_access
        FROM repo_access_permissions
        WHERE owner_id = ${ownerId} 
          AND granted_to_id = ${viewerId}
          AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1
      `;
      
      if (result.rows.length === 0) {
        // Default to surface-only access
        return {
          surface: true,
          surfacePrivate: false,
          personal: false,
          deep: false
        };
      }
      
      const access = result.rows[0];
      return {
        surface: access.surface_access || true,
        surfacePrivate: access.working_access || false, // Map working_access to surfacePrivate
        personal: access.personal_access || false,
        deep: access.deep_access || false
      };
    } catch (error) {
      console.error('Error checking repo access:', error);
      // Default to surface-only on error
      return {
        surface: true,
        surfacePrivate: false,
        personal: false,
        deep: false
      };
    }
  }
  
  // Grant access to repo layers
  static async grantRepoAccess(
    ownerId: string, 
    grantedToId: string, 
    level: 'surface' | 'surfacePrivate' | 'personal' | 'deep',
    relationshipType: string = 'connection',
    reason?: string,
    expiresDays?: number
  ): Promise<boolean> {
    try {
      await sql`
        SELECT grant_repo_access(
          ${ownerId},
          ${grantedToId},
          ${level},
          ${relationshipType},
          ${reason},
          ${expiresDays}
        )
      `;
      
      return true;
    } catch (error) {
      console.error('Error granting repo access:', error);
      return false;
    }
  }
  
  // Migrate Trinity data from old tables to Deep Repo
  static async migrateTrinityData(): Promise<number> {
    try {
      const result = await sql`
        SELECT migrate_trinity_to_deep_repo()
      `;
      
      return result.rows[0]?.migrate_trinity_to_deep_repo || 0;
    } catch (error) {
      console.error('Error migrating Trinity data:', error);
      return 0;
    }
  }
  
  // Get user's profile with access-controlled data
  static async getProfileWithAccess(ownerId: string, viewerId: string): Promise<Partial<UserProfile> | null> {
    try {
      const profile = await this.getUserProfile(ownerId);
      if (!profile) return null;
      
      const access = await this.checkRepoAccess(ownerId, viewerId);
      
      const accessControlledProfile: Partial<UserProfile> = {
        id: profile.id,
        userId: profile.userId,
        profileCompleteness: profile.profileCompleteness,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      };
      
      // Add layers based on access
      if (access.surface) {
        accessControlledProfile.surfaceRepo = profile.surfaceRepo;
      }
      if (access.surfacePrivate) {
        accessControlledProfile.surfacePrivateRepo = profile.surfacePrivateRepo;
      }
      if (access.personal) {
        accessControlledProfile.personalRepo = profile.personalRepo;
      }
      if (access.deep) {
        accessControlledProfile.deepRepo = profile.deepRepo;
      }
      
      // Track access
      if (ownerId !== viewerId) {
        await sql`
          UPDATE repo_access_permissions
          SET 
            last_accessed_at = NOW(),
            access_count = access_count + 1
          WHERE owner_id = ${ownerId} AND granted_to_id = ${viewerId}
        `;
      }
      
      return accessControlledProfile;
    } catch (error) {
      console.error('Error getting profile with access control:', error);
      return null;
    }
  }
}