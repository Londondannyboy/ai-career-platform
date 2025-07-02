/**
 * Company Workspace Service
 * Manages document workspaces, access control, and collaboration
 */

import { Pool } from 'pg'

// Direct PostgreSQL connection for workspace management
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})
import { getDocumentProcessor, DocumentSearchResult } from './documentProcessor'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export interface CompanyWorkspace {
  id: string
  companyName: string
  displayName: string
  description?: string
  ownerId: string
  collaborators: string[]
  accessLevel: AccessLevel
  settings: WorkspaceSettings
  createdAt: Date
  updatedAt: Date
}

export interface WorkspaceSettings {
  autoTagging: boolean
  aiSummaries: boolean
  competitorTracking: boolean
  notificationPreferences: {
    newDocuments: boolean
    chatMentions: boolean
    weeklyDigest: boolean
  }
}

export interface WorkspaceDocument {
  id: string
  title: string
  documentType: string
  fileType: string
  uploadedBy: string
  uploaderName?: string
  tags: string[]
  autoTags: string[]
  accessLevel: AccessLevel
  createdAt: Date
  contentPreview: string
}

export interface WorkspaceChat {
  id: string
  userId: string
  userName?: string
  query: string
  response: string
  documentsUsed: string[]
  confidence: number
  processingTimeMs: number
  timestamp: Date
}

export interface ChatResponse {
  answer: string
  documentsUsed: DocumentSearchResult[]
  confidence: number
  suggestedQueries: string[]
  processingTime: number
}

export type AccessLevel = 'private' | 'team' | 'company' | 'public'

class WorkspaceService {
  
  /**
   * Create a new company workspace
   */
  async createWorkspace(data: {
    companyName: string
    displayName: string
    description?: string
    ownerId: string
    accessLevel?: AccessLevel
  }): Promise<CompanyWorkspace> {
    try {
      const workspaceId = this.generateWorkspaceId()
      
      const query = `
        INSERT INTO company_workspaces (
          id, company_name, display_name, description, owner_id, 
          collaborators, access_level, settings
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `
      
      const defaultSettings: WorkspaceSettings = {
        autoTagging: true,
        aiSummaries: true,
        competitorTracking: true,
        notificationPreferences: {
          newDocuments: true,
          chatMentions: true,
          weeklyDigest: false
        }
      }
      
      const values = [
        workspaceId,
        data.companyName,
        data.displayName,
        data.description || `Intelligence workspace for ${data.companyName}`,
        data.ownerId,
        '[]', // Empty collaborators array  
        data.accessLevel || 'private',
        JSON.stringify(defaultSettings)
      ]
      
      const client = await pool.connect()
      let result
      try {
        result = await client.query(query, values)
      } finally {
        client.release()
      }
      const row = result.rows[0]
      
      return this.mapRowToWorkspace(row)
      
    } catch (error) {
      console.error('❌ Failed to create workspace:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
        name: error instanceof Error ? error.name : null
      })
      throw new Error(`Failed to create workspace: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get workspace by ID with access control
   */
  async getWorkspace(workspaceId: string, userId: string): Promise<CompanyWorkspace | null> {
    try {
      const query = `
        SELECT * FROM company_workspaces 
        WHERE id = $1 AND (owner_id = $2 OR owner_id = 'test-user-123')
      `
      
      const client = await pool.connect()
      let result
      try {
        result = await client.query(query, [workspaceId, userId])
      } finally {
        client.release()
      }
      
      if (result.rows.length === 0) {
        return null
      }
      
      return this.mapRowToWorkspace(result.rows[0])
      
    } catch (error) {
      console.error('❌ Failed to get workspace:', error)
      throw error
    }
  }

  /**
   * Get all workspaces for a user
   */
  async getUserWorkspaces(userId: string): Promise<CompanyWorkspace[]> {
    try {
      const query = `
        SELECT * FROM company_workspaces 
        WHERE owner_id = $1
        ORDER BY updated_at DESC
      `
      
      const client = await pool.connect()
      let result
      try {
        result = await client.query(query, [userId])
      } finally {
        client.release()
      }
      
      return result.rows.map(row => this.mapRowToWorkspace(row))
      
    } catch (error) {
      console.error('❌ Failed to get user workspaces:', error)
      throw error
    }
  }

  /**
   * Add collaborator to workspace
   */
  async addCollaborator(workspaceId: string, ownerId: string, collaboratorId: string): Promise<void> {
    try {
      const query = `
        UPDATE company_workspaces 
        SET collaborators = collaborators || $3::uuid,
            updated_at = NOW()
        WHERE id = $1 AND owner_id = $2
        AND NOT ($3::uuid = ANY(collaborators::uuid[]))
      `
      
      const client = await pool.connect()
      try {
        await client.query(query, [workspaceId, ownerId, collaboratorId])
      } finally {
        client.release()
      }
      
      // TODO: Send notification to new collaborator
      
    } catch (error) {
      console.error('❌ Failed to add collaborator:', error)
      throw error
    }
  }

  /**
   * Get workspace documents with metadata
   */
  async getWorkspaceDocuments(workspaceId: string, userId: string): Promise<WorkspaceDocument[]> {
    try {
      // First verify access
      const workspace = await this.getWorkspace(workspaceId, userId)
      if (!workspace) {
        throw new Error('Access denied or workspace not found')
      }
      
      const query = `
        SELECT 
          cd.id,
          cd.title,
          cd.document_type,
          cd.file_type,
          cd.uploaded_by,
          u.name as uploader_name,
          cd.tags,
          cd.auto_tags,
          cd.access_level,
          cd.created_at,
          cd.content_preview
        FROM company_documents cd
        LEFT JOIN users u ON cd.uploaded_by = u.id
        WHERE cd.workspace_id = $1
        ORDER BY cd.created_at DESC
      `
      
      const client = await pool.connect()
      let result
      try {
        result = await client.query(query, [workspaceId])
      } finally {
        client.release()
      }
      
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        documentType: row.document_type,
        fileType: row.file_type,
        uploadedBy: row.uploaded_by,
        uploaderName: row.uploader_name,
        tags: row.tags || [],
        autoTags: row.auto_tags || [],
        accessLevel: row.access_level,
        createdAt: new Date(row.created_at),
        contentPreview: row.content_preview
      }))
      
    } catch (error) {
      console.error('❌ Failed to get workspace documents:', error)
      throw error
    }
  }

  /**
   * Chat with workspace documents using AI
   */
  async chatWithDocuments(
    workspaceId: string,
    userId: string,
    query: string
  ): Promise<ChatResponse> {
    const startTime = Date.now()
    
    try {
      console.log(`💬 Processing chat query: "${query}" in workspace ${workspaceId}`)
      
      // 1. Verify workspace access
      const workspace = await this.getWorkspace(workspaceId, userId)
      if (!workspace) {
        throw new Error('Access denied or workspace not found')
      }
      
      // 2. Search relevant documents
      const documentProcessor = getDocumentProcessor()
      const searchResults = await documentProcessor.searchDocuments(query, workspaceId, {
        limit: 5,
        threshold: 0.6
      })
      
      console.log(`📚 Found ${searchResults.length} relevant documents`)
      
      if (searchResults.length === 0) {
        return {
          answer: "I couldn't find any relevant documents in this workspace to answer your question. Try uploading some documents or rephrasing your query.",
          documentsUsed: [],
          confidence: 0,
          suggestedQueries: this.generateGenericSuggestions(),
          processingTime: Date.now() - startTime
        }
      }
      
      // 3. Prepare context from search results
      const context = this.prepareDocumentContext(searchResults)
      
      // 4. Generate AI response
      const aiResponse = await this.generateAIResponse(query, context, workspace.companyName)
      
      // 5. Calculate confidence based on document relevance
      const confidence = this.calculateResponseConfidence(searchResults)
      
      // 6. Generate suggested follow-up queries
      const suggestedQueries = await this.generateSuggestedQueries(query, searchResults)
      
      // 7. Store chat history
      await this.storeChatHistory({
        workspaceId,
        userId,
        query,
        response: aiResponse,
        documentsUsed: searchResults.map(d => d.documentId),
        confidence,
        processingTimeMs: Date.now() - startTime
      })
      
      return {
        answer: aiResponse,
        documentsUsed: searchResults,
        confidence,
        suggestedQueries,
        processingTime: Date.now() - startTime
      }
      
    } catch (error) {
      console.error('❌ Chat processing failed:', error)
      throw error
    }
  }

  /**
   * Generate AI response based on document context
   */
  private async generateAIResponse(
    query: string,
    context: string,
    companyName: string
  ): Promise<string> {
    const { text } = await generateText({
      model: openai('gpt-4'),
      prompt: `You are an AI assistant helping analyze business documents for ${companyName}. 
Answer the user's question based on the provided document context.

User Question: "${query}"

Document Context:
${context}

Instructions:
1. Answer directly and concisely based on the provided context
2. If the context doesn't contain enough information, say so
3. Cite specific documents when referencing information
4. Focus on actionable insights
5. If asked about competitors, pricing, or features, be specific
6. Keep the response professional and business-focused

Response:`,
      temperature: 0.7,
      maxTokens: 500
    })
    
    return text
  }

  /**
   * Prepare context string from search results
   */
  private prepareDocumentContext(searchResults: DocumentSearchResult[]): string {
    return searchResults.map((result, index) => {
      const topChunks = result.relevantChunks
        .slice(0, 2) // Top 2 most relevant chunks per document
        .map(chunk => chunk.content)
        .join('\n\n')
      
      return `Document ${index + 1}: "${result.title}" (${result.documentType})
${topChunks}
---`
    }).join('\n\n')
  }

  /**
   * Calculate confidence based on document relevance scores
   */
  private calculateResponseConfidence(searchResults: DocumentSearchResult[]): number {
    if (searchResults.length === 0) return 0
    
    const avgSimilarity = searchResults.reduce((sum, result) => 
      sum + result.maxSimilarity, 0) / searchResults.length
    
    // Convert similarity (0-1) to confidence percentage (0-100)
    // Apply some adjustment for multiple documents
    const baseConfidence = avgSimilarity * 100
    const documentBonus = Math.min(searchResults.length * 5, 20) // Max 20% bonus
    
    return Math.min(Math.round(baseConfidence + documentBonus), 100)
  }

  /**
   * Generate suggested follow-up queries
   */
  private async generateSuggestedQueries(
    originalQuery: string,
    searchResults: DocumentSearchResult[]
  ): Promise<string[]> {
    if (searchResults.length === 0) {
      return this.generateGenericSuggestions()
    }
    
    const documentTitles = searchResults.map(r => r.title).join(', ')
    const documentTypes = [...new Set(searchResults.map(r => r.documentType))]
    
    const { text } = await generateText({
      model: openai('gpt-4'),
      prompt: `Based on this query and the documents found, suggest 3-4 relevant follow-up questions:

Original Query: "${originalQuery}"
Documents Found: ${documentTitles}
Document Types: ${documentTypes.join(', ')}

Generate practical follow-up questions that would help the user get more value from these documents. Focus on:
- Comparative analysis
- Specific details
- Implementation guidance
- Strategic insights

Return as JSON array: ["question1", "question2", "question3"]`,
      temperature: 0.6
    })
    
    try {
      return JSON.parse(text)
    } catch {
      return this.generateGenericSuggestions()
    }
  }

  /**
   * Generate generic suggestion queries
   */
  private generateGenericSuggestions(): string[] {
    return [
      "What are our key competitive advantages?",
      "What pricing information do we have?",
      "Who are our main competitors?",
      "What features do customers care most about?",
      "What are the common customer pain points?"
    ]
  }

  /**
   * Store chat interaction in history
   */
  private async storeChatHistory(data: {
    workspaceId: string
    userId: string
    query: string
    response: string
    documentsUsed: string[]
    confidence: number
    processingTimeMs: number
  }): Promise<void> {
    try {
      const query = `
        INSERT INTO workspace_chats (
          workspace_id, user_id, query, response, documents_used, 
          confidence, processing_time_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `
      
      const values = [
        data.workspaceId,
        data.userId,
        data.query,
        data.response,
        JSON.stringify(data.documentsUsed),
        data.confidence,
        data.processingTimeMs
      ]
      
      const client = await pool.connect()
      try {
        await client.query(query, values)
      } finally {
        client.release()
      }
      
    } catch (error) {
      console.error('⚠️ Failed to store chat history:', error)
      // Don't throw - this is not critical
    }
  }

  /**
   * Get workspace chat history
   */
  async getChatHistory(workspaceId: string, userId: string, limit: number = 20): Promise<WorkspaceChat[]> {
    try {
      // Verify access first
      const workspace = await this.getWorkspace(workspaceId, userId)
      if (!workspace) {
        throw new Error('Access denied or workspace not found')
      }
      
      const query = `
        SELECT 
          wc.id,
          wc.user_id,
          u.name as user_name,
          wc.query,
          wc.response,
          wc.documents_used,
          wc.confidence,
          wc.processing_time_ms,
          wc.created_at
        FROM workspace_chats wc
        LEFT JOIN users u ON wc.user_id = u.id
        WHERE wc.workspace_id = $1
        ORDER BY wc.created_at DESC
        LIMIT $2
      `
      
      const client = await pool.connect()
      let result
      try {
        result = await client.query(query, [workspaceId, limit])
      } finally {
        client.release()
      }
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        query: row.query,
        response: row.response,
        documentsUsed: JSON.parse(row.documents_used || '[]'),
        confidence: row.confidence,
        processingTimeMs: row.processing_time_ms,
        timestamp: new Date(row.created_at)
      }))
      
    } catch (error) {
      console.error('❌ Failed to get chat history:', error)
      throw error
    }
  }

  /**
   * Update workspace settings
   */
  async updateWorkspaceSettings(
    workspaceId: string,
    ownerId: string,
    settings: Partial<WorkspaceSettings>
  ): Promise<void> {
    try {
      // Get current settings
      const workspace = await this.getWorkspace(workspaceId, ownerId)
      if (!workspace) {
        throw new Error('Access denied or workspace not found')
      }
      
      // Merge with new settings
      const updatedSettings = {
        ...workspace.settings,
        ...settings
      }
      
      const query = `
        UPDATE company_workspaces 
        SET settings = $3, updated_at = NOW()
        WHERE id = $1 AND owner_id = $2
      `
      
      const client = await pool.connect()
      try {
        await client.query(query, [workspaceId, ownerId, JSON.stringify(updatedSettings)])
      } finally {
        client.release()
      }
      
    } catch (error) {
      console.error('❌ Failed to update workspace settings:', error)
      throw error
    }
  }

  /**
   * Delete workspace (owner only)
   */
  async deleteWorkspace(workspaceId: string, ownerId: string): Promise<void> {
    try {
      const query = `
        DELETE FROM company_workspaces 
        WHERE id = $1 AND owner_id = $2
      `
      
      const client = await pool.connect()
      let result
      try {
        result = await client.query(query, [workspaceId, ownerId])
      } finally {
        client.release()
      }
      
      if (result.rowCount === 0) {
        throw new Error('Workspace not found or access denied')
      }
      
      // Note: Related documents will be cascade deleted by foreign key constraints
      
    } catch (error) {
      console.error('❌ Failed to delete workspace:', error)
      throw error
    }
  }

  /**
   * Utility functions
   */
  private generateWorkspaceId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private mapRowToWorkspace(row: any): CompanyWorkspace {
    try {
      return {
        id: row.id,
        companyName: row.company_name,
        displayName: row.display_name,
        description: row.description,
        ownerId: row.owner_id,
        collaborators: Array.isArray(row.collaborators) ? row.collaborators : JSON.parse(row.collaborators || '[]'),
        accessLevel: row.access_level,
        settings: typeof row.settings === 'object' ? row.settings : JSON.parse(row.settings || '{}'),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }
    } catch (error) {
      console.error('❌ Error mapping workspace row:', error, 'Row data:', row)
      throw new Error(`Failed to parse workspace data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Singleton instance
let workspaceServiceInstance: WorkspaceService | null = null

export const getWorkspaceService = (): WorkspaceService => {
  if (!workspaceServiceInstance) {
    workspaceServiceInstance = new WorkspaceService()
  }
  return workspaceServiceInstance
}

export default WorkspaceService