/**
 * Document Processing Service
 * Handles file upload, text extraction, AI analysis, and vector storage
 */

import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { embeddingsService } from '../vector/embeddings'
import { Pool } from 'pg'

// Direct PostgreSQL connection for document storage
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

export interface DocumentMetadata {
  title: string
  type: DocumentType
  companyId: string
  workspaceId: string
  userId: string
  accessLevel: AccessLevel
  tags?: string[]
}

export type DocumentType = 'product_spec' | 'sales_deck' | 'case_study' | 'pricing' | 'competitor_analysis' | 'proposal' | 'whitepaper'
export type AccessLevel = 'private' | 'team' | 'company' | 'public'

export interface ProcessedDocument {
  id: string
  metadata: DocumentMetadata
  content: string
  contentPreview: string
  extractedEntities: ExtractedEntities
  autoTags: string[]
  embedding: number[]
  fileUrl: string
  processingTime: number
}

export interface ExtractedEntities {
  products: string[]
  competitors: string[]
  features: string[]
  pricing: PricingInfo[]
  decisionCriteria: string[]
  stakeholders: string[]
  technologies: string[]
  painPoints: string[]
  benefits: string[]
}

export interface PricingInfo {
  product: string
  price: string
  tier: 'enterprise' | 'standard' | 'basic' | 'custom'
  currency?: string
  period?: string // 'monthly', 'annual', 'one-time'
}

export interface DocumentChunk {
  content: string
  index: number
  metadata: {
    section?: string
    pageNumber?: number
    documentType: DocumentType
  }
}

class DocumentProcessingService {
  private readonly MAX_CHUNK_SIZE = 2000 // Characters per chunk
  private readonly CHUNK_OVERLAP = 200   // Overlap between chunks

  /**
   * Process uploaded document through complete pipeline
   */
  async processDocument(
    file: File,
    metadata: DocumentMetadata
  ): Promise<ProcessedDocument> {
    const startTime = Date.now()
    
    try {
      console.log(`📄 Processing document: ${file.name} (${file.size} bytes)`)
      
      // 1. Extract text content from file
      const textContent = await this.extractTextFromFile(file)
      console.log(`✅ Extracted ${textContent.length} characters of text`)
      
      // 2. Create content preview (first 1000 characters)
      const contentPreview = textContent.substring(0, 1000) + 
        (textContent.length > 1000 ? '...' : '')
      
      // 3. AI-powered entity extraction
      const extractedEntities = await this.extractBusinessEntities(textContent, metadata.type)
      console.log(`🤖 Extracted entities:`, {
        products: extractedEntities.products.length,
        competitors: extractedEntities.competitors.length,
        features: extractedEntities.features.length
      })
      
      // 4. Generate auto-tags based on content and entities
      const autoTags = await this.generateAutoTags(textContent, extractedEntities)
      console.log(`🏷️ Generated ${autoTags.length} auto-tags`)
      
      // 5. Generate embedding for the full document
      const embeddingResult = await embeddingsService.generateEmbedding(textContent)
      const embedding = embeddingResult.embedding
      console.log(`🔢 Generated embedding vector`)
      
      // 6. Upload file to storage (simulate with timestamp for now)
      const fileUrl = await this.uploadToStorage(file, metadata)
      console.log(`☁️ Uploaded to storage: ${fileUrl}`)
      
      const processingTime = Date.now() - startTime
      
      return {
        id: this.generateDocumentId(),
        metadata,
        content: textContent,
        contentPreview,
        extractedEntities,
        autoTags,
        embedding,
        fileUrl,
        processingTime
      }
      
    } catch (error) {
      console.error('❌ Document processing failed:', error)
      throw new Error(`Document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract text content from various file types
   */
  private async extractTextFromFile(file: File): Promise<string> {
    const fileType = this.getFileExtension(file.name).toLowerCase()
    
    switch (fileType) {
      case 'txt':
        return await this.extractFromText(file)
      
      case 'pdf':
        return await this.extractFromPDF(file)
      
      case 'docx':
        return await this.extractFromDocx(file)
      
      case 'pptx':
        return await this.extractFromPptx(file)
      
      default:
        throw new Error(`Unsupported file type: ${fileType}`)
    }
  }

  /**
   * Extract text from plain text files
   */
  private async extractFromText(file: File): Promise<string> {
    return await file.text()
  }

  /**
   * Extract text from PDF files
   * Note: This is a simplified implementation. 
   * In production, use a proper PDF parsing library like pdf-parse
   */
  private async extractFromPDF(file: File): Promise<string> {
    // For now, return a placeholder - implement with pdf-parse library
    console.warn('⚠️ PDF extraction not implemented - using placeholder')
    return `[PDF Content from ${file.name}]\n\nThis is placeholder text extracted from a PDF file. In production, this would contain the actual extracted text using a PDF parsing library like pdf-parse.`
  }

  /**
   * Extract text from Word documents
   * Note: Simplified implementation - use mammoth.js in production
   */
  private async extractFromDocx(file: File): Promise<string> {
    console.warn('⚠️ DOCX extraction not implemented - using placeholder')
    return `[DOCX Content from ${file.name}]\n\nThis is placeholder text extracted from a Word document. In production, this would contain the actual extracted text using a library like mammoth.js.`
  }

  /**
   * Extract text from PowerPoint files
   * Note: Simplified implementation - use a proper library in production
   */
  private async extractFromPptx(file: File): Promise<string> {
    console.warn('⚠️ PPTX extraction not implemented - using placeholder')
    return `[PPTX Content from ${file.name}]\n\nThis is placeholder text extracted from a PowerPoint presentation. In production, this would contain the actual extracted text using a library for PPTX parsing.`
  }

  /**
   * Extract business entities using AI
   */
  private async extractBusinessEntities(
    content: string, 
    documentType: DocumentType
  ): Promise<ExtractedEntities> {
    const { text } = await generateText({
      model: openai('gpt-4'),
      prompt: `Extract business intelligence from this ${documentType} document:

Content: "${content.substring(0, 4000)}" ${content.length > 4000 ? '[Content truncated...]' : ''}

Extract the following information:
1. Product names and services mentioned
2. Competitor companies and their products
3. Key features and capabilities
4. Pricing information (if any)
5. Decision criteria and requirements
6. Stakeholder roles mentioned
7. Technologies and tools referenced
8. Pain points or challenges mentioned
9. Benefits and value propositions

Return a JSON object with these fields:
{
  "products": ["product1", "product2"],
  "competitors": ["competitor1", "competitor2"],
  "features": ["feature1", "feature2"],
  "pricing": [
    {
      "product": "product_name",
      "price": "price_info",
      "tier": "enterprise|standard|basic|custom",
      "currency": "USD",
      "period": "monthly|annual|one-time"
    }
  ],
  "decisionCriteria": ["criteria1", "criteria2"],
  "stakeholders": ["role1", "role2"],
  "technologies": ["tech1", "tech2"],
  "painPoints": ["pain1", "pain2"],
  "benefits": ["benefit1", "benefit2"]
}`,
      temperature: 0.3
    })

    try {
      return JSON.parse(text)
    } catch (error) {
      console.error('Failed to parse AI entity extraction:', error)
      return {
        products: [],
        competitors: [],
        features: [],
        pricing: [],
        decisionCriteria: [],
        stakeholders: [],
        technologies: [],
        painPoints: [],
        benefits: []
      }
    }
  }

  /**
   * Generate auto-tags based on content and extracted entities
   */
  private async generateAutoTags(
    content: string,
    entities: ExtractedEntities
  ): Promise<string[]> {
    const { text } = await generateText({
      model: openai('gpt-4'),
      prompt: `Generate 5-10 relevant tags for this business document based on its content and extracted entities:

Content preview: "${content.substring(0, 1000)}"

Extracted entities:
- Products: ${entities.products.join(', ')}
- Competitors: ${entities.competitors.join(', ')}
- Features: ${entities.features.join(', ')}
- Technologies: ${entities.technologies.join(', ')}

Generate tags that would help categorize and search for this document. Include:
- Industry/domain tags
- Document purpose tags
- Technology/tool tags
- Business function tags

Return as a JSON array: ["tag1", "tag2", "tag3"]`,
      temperature: 0.4
    })

    try {
      return JSON.parse(text)
    } catch (error) {
      console.error('Failed to parse auto-tags:', error)
      // Fallback to basic tags from entities
      return [
        ...entities.products.slice(0, 3),
        ...entities.technologies.slice(0, 2)
      ].filter(Boolean)
    }
  }

  /**
   * Break document into chunks for better vector search
   */
  public chunkDocument(content: string, metadata: DocumentMetadata): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    let index = 0
    
    // Simple chunking by character count with overlap
    for (let i = 0; i < content.length; i += this.MAX_CHUNK_SIZE - this.CHUNK_OVERLAP) {
      const chunkContent = content.substring(i, i + this.MAX_CHUNK_SIZE)
      
      if (chunkContent.trim()) {
        chunks.push({
          content: chunkContent,
          index,
          metadata: {
            documentType: metadata.type,
            // Could add more sophisticated section detection here
          }
        })
        index++
      }
    }
    
    return chunks
  }

  /**
   * Store document and embeddings in database
   */
  async storeDocument(processedDoc: ProcessedDocument): Promise<void> {
    try {
      console.log(`💾 Storing document: ${processedDoc.metadata.title}`)
      
      // 1. Store document metadata in main table
      await this.storeDocumentMetadata(processedDoc)
      
      // 2. Create chunks and store embeddings
      const chunks = this.chunkDocument(processedDoc.content, processedDoc.metadata)
      await this.storeDocumentEmbeddings(processedDoc.id, chunks)
      
      console.log(`✅ Stored document with ${chunks.length} chunks`)
      
    } catch (error) {
      console.error('❌ Failed to store document:', error)
      throw error
    }
  }

  /**
   * Store document metadata in database
   */
  private async storeDocumentMetadata(processedDoc: ProcessedDocument): Promise<void> {
    const query = `
      INSERT INTO company_documents (
        id, workspace_id, title, file_name, file_type, document_type,
        content_preview, full_content, extracted_entities, tags, auto_tags,
        uploaded_by, access_level, file_url, embedding_stored
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
    `
    
    const values = [
      processedDoc.id,
      processedDoc.metadata.workspaceId,
      processedDoc.metadata.title,
      `${processedDoc.metadata.title}.${this.getFileExtension(processedDoc.metadata.title)}`,
      this.getFileExtension(processedDoc.metadata.title),
      processedDoc.metadata.type,
      processedDoc.contentPreview,
      processedDoc.content,
      JSON.stringify(processedDoc.extractedEntities),
      processedDoc.metadata.tags || [],
      processedDoc.autoTags,
      processedDoc.metadata.userId,
      processedDoc.metadata.accessLevel,
      processedDoc.fileUrl,
      true
    ]
    
    const client = await pool.connect()
    try {
      await client.query(query, values)
    } finally {
      client.release()
    }
  }

  /**
   * Store document embeddings for vector search
   */
  private async storeDocumentEmbeddings(
    documentId: string, 
    chunks: DocumentChunk[]
  ): Promise<void> {
    for (const chunk of chunks) {
      // Generate embedding for each chunk
      const embeddingResult = await embeddingsService.generateEmbedding(chunk.content)
      const embedding = embeddingResult.embedding
      
      const query = `
        INSERT INTO document_embeddings (
          document_id, content_chunk, chunk_index, chunk_metadata, embedding
        ) VALUES ($1, $2, $3, $4, $5)
      `
      
      const values = [
        documentId,
        chunk.content,
        chunk.index,
        JSON.stringify(chunk.metadata),
        JSON.stringify(embedding) // Convert to JSON for storage
      ]
      
      const client = await pool.connect()
    try {
      await client.query(query, values)
    } finally {
      client.release()
    }
    }
  }

  /**
   * Search documents using vector similarity
   */
  async searchDocuments(
    query: string,
    workspaceId: string,
    options: {
      limit?: number
      threshold?: number
      documentTypes?: DocumentType[]
    } = {}
  ): Promise<DocumentSearchResult[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await embeddingsService.generateQueryEmbedding(query)
      
      // Search for similar document chunks
      const searchQuery = `
        SELECT 
          de.document_id,
          de.content_chunk,
          de.chunk_index,
          cd.title,
          cd.document_type,
          cd.extracted_entities,
          cd.auto_tags,
          1 - (de.embedding <=> $1::vector) as similarity
        FROM document_embeddings de
        JOIN company_documents cd ON de.document_id = cd.id
        WHERE cd.workspace_id = $2
        ${options.documentTypes ? 'AND cd.document_type = ANY($4)' : ''}
        AND 1 - (de.embedding <=> $1::vector) > $3
        ORDER BY similarity DESC
        LIMIT $5
      `
      
      const values = [
        JSON.stringify(queryEmbedding),
        workspaceId,
        options.threshold || 0.7,
        ...(options.documentTypes ? [options.documentTypes] : []),
        options.limit || 10
      ]
      
      const client = await pool.connect()
      let result
      try {
        result = await client.query(searchQuery, values)
      } finally {
        client.release()
      }
      
      // Group results by document and create search results
      const documentMap = new Map<string, DocumentSearchResult>()
      
      for (const row of result.rows) {
        if (!documentMap.has(row.document_id)) {
          documentMap.set(row.document_id, {
            documentId: row.document_id,
            title: row.title,
            documentType: row.document_type,
            extractedEntities: row.extracted_entities,
            autoTags: row.auto_tags,
            relevantChunks: [],
            maxSimilarity: 0,
            averageSimilarity: 0
          })
        }
        
        const docResult = documentMap.get(row.document_id)!
        docResult.relevantChunks.push({
          content: row.content_chunk,
          similarity: row.similarity,
          chunkIndex: row.chunk_index
        })
        
        docResult.maxSimilarity = Math.max(docResult.maxSimilarity, row.similarity)
      }
      
      // Calculate average similarity for each document
      const results = Array.from(documentMap.values()).map(doc => ({
        ...doc,
        averageSimilarity: doc.relevantChunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / doc.relevantChunks.length
      }))
      
      return results.sort((a, b) => b.maxSimilarity - a.maxSimilarity)
      
    } catch (error) {
      console.error('❌ Document search failed:', error)
      throw error
    }
  }

  /**
   * Upload file to storage (placeholder implementation)
   */
  private async uploadToStorage(file: File, metadata: DocumentMetadata): Promise<string> {
    // This would integrate with Supabase Storage or similar
    // For now, return a placeholder URL
    const timestamp = Date.now()
    return `https://storage.quest.app/documents/${metadata.workspaceId}/${timestamp}-${file.name}`
  }

  /**
   * Utility functions
   */
  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
  }
}

export interface DocumentSearchResult {
  documentId: string
  title: string
  documentType: DocumentType
  extractedEntities: ExtractedEntities
  autoTags: string[]
  relevantChunks: {
    content: string
    similarity: number
    chunkIndex: number
  }[]
  maxSimilarity: number
  averageSimilarity: number
}

// Singleton instance
let documentProcessorInstance: DocumentProcessingService | null = null

export const getDocumentProcessor = (): DocumentProcessingService => {
  if (!documentProcessorInstance) {
    documentProcessorInstance = new DocumentProcessingService()
  }
  return documentProcessorInstance
}

export default DocumentProcessingService