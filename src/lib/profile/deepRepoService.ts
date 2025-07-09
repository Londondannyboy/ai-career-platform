import { sql } from '@/lib/db';

export interface DeepRepoTrinity {
  quest: string;
  service: string;
  pledge: string;
  type: 'F' | 'L' | 'M'; // Foundation, Living, Mixed
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  surfaceRepo: any; // Public data
  workingRepo: any; // Shared selectively
  personalRepo: any; // Private connections
  deepRepo: {
    trinity?: DeepRepoTrinity;
    coreValues?: string[];
    deepReflections?: string[];
    personalMission?: string;
  };
  createdAt: Date;
  updatedAt: Date;
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
        workingRepo: row.working_repo || {},
        personalRepo: row.personal_repo || {},
        deepRepo: row.deep_repo || { trinity: null },
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
  
  // Get Trinity from Deep Repo
  static async getTrinity(userId: string): Promise<DeepRepoTrinity | null> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) return null;
      
      return profile.deepRepo.trinity || null;
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
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error updating Deep Repo:', error);
      return false;
    }
  }
  
  // Get entire Deep Repo
  static async getDeepRepo(userId: string): Promise<any> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.deepRepo || null;
    } catch (error) {
      console.error('Error getting Deep Repo:', error);
      return null;
    }
  }
}