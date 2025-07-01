/**
 * Neon.tech PostgreSQL Client with pgvector
 * Handles vector embeddings and semantic search
 */

import { Pool } from 'pg'

// Neon.tech connection pool
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

export interface VectorDocument {
  id: string
  content: string
  metadata: Record<string, any>
  embedding?: number[]
  created_at?: Date
}

export interface SearchResult {
  id: string
  content: string
  metadata: Record<string, any>
  similarity: number
}

export class NeonVectorClient {
  /**
   * Initialize the vector extension and create tables
   */
  async initialize() {
    const client = await pool.connect()
    try {
      // Enable pgvector extension
      await client.query('CREATE EXTENSION IF NOT EXISTS vector')
      
      // Create documents table with vector column
      await client.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          content TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          embedding vector(1536), -- OpenAI ada-002 dimensions
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)
      
      // Create index for fast similarity search
      await client.query(`
        CREATE INDEX IF NOT EXISTS documents_embedding_idx 
        ON documents USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `)
      
      // Create separate tables for different content types
      await client.query(`
        CREATE TABLE IF NOT EXISTS company_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_name VARCHAR(255) NOT NULL,
          linkedin_url VARCHAR(255) UNIQUE,
          description TEXT,
          industry VARCHAR(255),
          employee_count INTEGER,
          metadata JSONB DEFAULT '{}',
          embedding vector(1536),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS person_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          linkedin_url VARCHAR(255) UNIQUE,
          username VARCHAR(255) UNIQUE,
          headline TEXT,
          summary TEXT,
          skills JSONB DEFAULT '[]',
          metadata JSONB DEFAULT '{}',
          embedding vector(1536),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)
      
      console.log('✅ Neon.tech vector database initialized')
    } finally {
      client.release()
    }
  }
  
  /**
   * Store document with embedding
   */
  async storeDocument(doc: VectorDocument): Promise<string> {
    const client = await pool.connect()
    try {
      const query = `
        INSERT INTO documents (content, metadata, embedding)
        VALUES ($1, $2, $3)
        RETURNING id
      `
      const result = await client.query(query, [
        doc.content,
        doc.metadata,
        doc.embedding ? `[${doc.embedding.join(',')}]` : null
      ])
      return result.rows[0].id
    } finally {
      client.release()
    }
  }
  
  /**
   * Store company profile with embedding
   */
  async storeCompanyProfile(company: any, embedding?: number[]): Promise<string> {
    const client = await pool.connect()
    try {
      const query = `
        INSERT INTO company_profiles (
          company_name, linkedin_url, description, industry, 
          employee_count, metadata, embedding
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (linkedin_url) 
        DO UPDATE SET
          description = EXCLUDED.description,
          industry = EXCLUDED.industry,
          employee_count = EXCLUDED.employee_count,
          metadata = EXCLUDED.metadata,
          embedding = EXCLUDED.embedding,
          updated_at = NOW()
        RETURNING id
      `
      const result = await client.query(query, [
        company.company_name || company.name,
        company.linkedin_url || company.url,
        company.description,
        company.industry,
        company.employee_count || company.employees,
        company,
        embedding ? `[${embedding.join(',')}]` : null
      ])
      return result.rows[0].id
    } finally {
      client.release()
    }
  }
  
  /**
   * Store person profile with embedding
   */
  async storePersonProfile(person: any, embedding?: number[]): Promise<string> {
    const client = await pool.connect()
    try {
      const query = `
        INSERT INTO person_profiles (
          name, linkedin_url, username, headline, summary, 
          skills, metadata, embedding
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (username) 
        DO UPDATE SET
          name = EXCLUDED.name,
          headline = EXCLUDED.headline,
          summary = EXCLUDED.summary,
          skills = EXCLUDED.skills,
          metadata = EXCLUDED.metadata,
          embedding = EXCLUDED.embedding,
          updated_at = NOW()
        RETURNING id
      `
      
      // Extract username from LinkedIn URL
      let username = person.username || person.public_identifier
      if (!username && person.linkedin_url) {
        const match = person.linkedin_url.match(/\/in\/([^\/\?]+)/i)
        if (match) username = match[1]
      }
      
      const result = await client.query(query, [
        person.name || person.display_name,
        person.linkedin_url || person.url,
        username,
        person.headline || person.profile_headline,
        person.summary,
        person.skills || [],
        person,
        embedding ? `[${embedding.join(',')}]` : null
      ])
      return result.rows[0].id
    } finally {
      client.release()
    }
  }
  
  /**
   * Semantic search using vector similarity
   */
  async vectorSearch(
    embedding: number[], 
    limit: number = 10,
    threshold: number = 0.7,
    filter?: Record<string, any>
  ): Promise<SearchResult[]> {
    const client = await pool.connect()
    try {
      let query = `
        SELECT 
          id,
          content,
          metadata,
          1 - (embedding <=> $1::vector) as similarity
        FROM documents
        WHERE embedding IS NOT NULL
      `
      
      const params: any[] = [`[${embedding.join(',')}]`]
      let paramCount = 1
      
      // Add metadata filters if provided
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          paramCount++
          query += ` AND metadata->>'${key}' = $${paramCount}`
          params.push(value)
        })
      }
      
      query += `
        AND 1 - (embedding <=> $1::vector) > $${paramCount + 1}
        ORDER BY embedding <=> $1::vector
        LIMIT $${paramCount + 2}
      `
      
      params.push(threshold, limit)
      
      const result = await client.query(query, params)
      
      return result.rows.map(row => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        similarity: row.similarity
      }))
    } finally {
      client.release()
    }
  }
  
  /**
   * Hybrid search combining vector similarity and keyword matching
   */
  async hybridSearch(
    query: string,
    embedding: number[],
    limit: number = 10,
    vectorWeight: number = 0.7
  ): Promise<SearchResult[]> {
    const client = await pool.connect()
    try {
      const textWeight = 1 - vectorWeight
      
      const searchQuery = `
        WITH vector_search AS (
          SELECT 
            id,
            content,
            metadata,
            1 - (embedding <=> $1::vector) as vector_similarity
          FROM documents
          WHERE embedding IS NOT NULL
        ),
        text_search AS (
          SELECT 
            id,
            content,
            metadata,
            ts_rank(to_tsvector('english', content), plainto_tsquery('english', $2)) as text_rank
          FROM documents
          WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $2)
        )
        SELECT 
          COALESCE(v.id, t.id) as id,
          COALESCE(v.content, t.content) as content,
          COALESCE(v.metadata, t.metadata) as metadata,
          (
            COALESCE(v.vector_similarity, 0) * $3 + 
            COALESCE(t.text_rank, 0) * $4
          ) as combined_score
        FROM vector_search v
        FULL OUTER JOIN text_search t ON v.id = t.id
        ORDER BY combined_score DESC
        LIMIT $5
      `
      
      const result = await client.query(searchQuery, [
        `[${embedding.join(',')}]`,
        query,
        vectorWeight,
        textWeight,
        limit
      ])
      
      return result.rows.map(row => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        similarity: row.combined_score
      }))
    } finally {
      client.release()
    }
  }
  
  /**
   * Get similar companies
   */
  async findSimilarCompanies(
    companyEmbedding: number[],
    limit: number = 5
  ): Promise<any[]> {
    const client = await pool.connect()
    try {
      const query = `
        SELECT 
          company_name,
          linkedin_url,
          industry,
          employee_count,
          1 - (embedding <=> $1::vector) as similarity
        FROM company_profiles
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `
      
      const result = await client.query(query, [
        `[${companyEmbedding.join(',')}]`,
        limit
      ])
      
      return result.rows
    } finally {
      client.release()
    }
  }
  
  /**
   * Get similar people
   */
  async findSimilarPeople(
    personEmbedding: number[],
    limit: number = 5
  ): Promise<any[]> {
    const client = await pool.connect()
    try {
      const query = `
        SELECT 
          name,
          linkedin_url,
          headline,
          1 - (embedding <=> $1::vector) as similarity
        FROM person_profiles
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `
      
      const result = await client.query(query, [
        `[${personEmbedding.join(',')}]`,
        limit
      ])
      
      return result.rows
    } finally {
      client.release()
    }
  }
}

export const neonClient = new NeonVectorClient()