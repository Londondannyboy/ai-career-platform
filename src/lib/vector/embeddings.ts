/**
 * Embeddings Service
 * Generates vector embeddings for semantic search
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface EmbeddingResult {
  embedding: number[]
  tokens: number
  model: string
}

export class EmbeddingsService {
  private model = 'text-embedding-ada-002' // OpenAI's embedding model
  private maxTokens = 8191 // Model limit
  
  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      // Clean and truncate text if needed
      const cleanedText = this.cleanText(text)
      
      const response = await openai.embeddings.create({
        model: this.model,
        input: cleanedText,
      })
      
      return {
        embedding: response.data[0].embedding,
        tokens: response.usage.total_tokens,
        model: this.model
      }
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw new Error(`Failed to generate embedding: ${error.message}`)
    }
  }
  
  /**
   * Generate embeddings for multiple texts (batch)
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    try {
      // OpenAI allows up to 2048 embedding inputs per request
      const batchSize = 100
      const results: EmbeddingResult[] = []
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize)
        const cleanedBatch = batch.map(text => this.cleanText(text))
        
        const response = await openai.embeddings.create({
          model: this.model,
          input: cleanedBatch,
        })
        
        const batchResults = response.data.map(item => ({
          embedding: item.embedding,
          tokens: Math.floor(response.usage.total_tokens / batch.length), // Approximate
          model: this.model
        }))
        
        results.push(...batchResults)
      }
      
      return results
    } catch (error) {
      console.error('Error generating embeddings:', error)
      throw new Error(`Failed to generate embeddings: ${error.message}`)
    }
  }
  
  /**
   * Generate embedding for a company profile
   */
  async generateCompanyEmbedding(company: any): Promise<number[]> {
    // Create a rich text representation of the company
    const companyText = this.createCompanyText(company)
    const result = await this.generateEmbedding(companyText)
    return result.embedding
  }
  
  /**
   * Generate embedding for a person profile
   */
  async generatePersonEmbedding(person: any): Promise<number[]> {
    // Create a rich text representation of the person
    const personText = this.createPersonText(person)
    const result = await this.generateEmbedding(personText)
    return result.embedding
  }
  
  /**
   * Generate embedding for a search query
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    // Enhance query with context for better search
    const enhancedQuery = `Search query: ${query}`
    const result = await this.generateEmbedding(enhancedQuery)
    return result.embedding
  }
  
  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same dimension')
    }
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
  
  /**
   * Clean and prepare text for embedding
   */
  private cleanText(text: string): string {
    // Remove excessive whitespace
    let cleaned = text.replace(/\s+/g, ' ').trim()
    
    // Remove special characters that don't add meaning
    cleaned = cleaned.replace(/[^\w\s\-.,!?]/g, '')
    
    // Truncate if too long (leave room for token overhead)
    const maxChars = 30000 // Conservative limit
    if (cleaned.length > maxChars) {
      cleaned = cleaned.substring(0, maxChars) + '...'
    }
    
    return cleaned
  }
  
  /**
   * Create rich text representation of a company
   */
  private createCompanyText(company: any): string {
    const parts = []
    
    if (company.company_name || company.name) {
      parts.push(`Company: ${company.company_name || company.name}`)
    }
    
    if (company.industry) {
      parts.push(`Industry: ${company.industry}`)
    }
    
    if (company.description) {
      parts.push(`Description: ${company.description}`)
    }
    
    if (company.specialties) {
      parts.push(`Specialties: ${Array.isArray(company.specialties) ? company.specialties.join(', ') : company.specialties}`)
    }
    
    if (company.employee_count || company.employees) {
      parts.push(`Employees: ${company.employee_count || company.employees}`)
    }
    
    if (company.headquarters || company.location) {
      parts.push(`Location: ${company.headquarters || company.location}`)
    }
    
    return parts.join(' | ')
  }
  
  /**
   * Create rich text representation of a person
   */
  private createPersonText(person: any): string {
    const parts = []
    
    if (person.name || person.display_name) {
      parts.push(`Name: ${person.name || person.display_name}`)
    }
    
    if (person.headline || person.profile_headline) {
      parts.push(`Title: ${person.headline || person.profile_headline}`)
    }
    
    if (person.current_company_name || person.currentCompany) {
      parts.push(`Company: ${person.current_company_name || person.currentCompany}`)
    }
    
    if (person.summary) {
      parts.push(`Summary: ${person.summary}`)
    }
    
    if (person.skills && person.skills.length > 0) {
      const skillsList = Array.isArray(person.skills) 
        ? person.skills.join(', ')
        : person.skills
      parts.push(`Skills: ${skillsList}`)
    }
    
    if (person.location) {
      parts.push(`Location: ${person.location}`)
    }
    
    // Include recommendation context if available
    if (person.recommendations && person.recommendations.length > 0) {
      const recCount = person.recommendations.length
      parts.push(`Recommendations: ${recCount} professional recommendations`)
    }
    
    return parts.join(' | ')
  }
}

export const embeddingsService = new EmbeddingsService()