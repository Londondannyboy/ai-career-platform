# Document Management & AI Chat API Documentation

## Overview
This API provides document management, AI-powered chat, and sales intelligence capabilities built on Neon.tech (PostgreSQL with pgvector) for vector storage and OpenAI for AI processing.

## Base URL
```
https://ai-career-platform.vercel.app/api
```

## Authentication
All endpoints use Clerk authentication with fallback to `test-user-123` for testing.

---

## 🏢 Workspace Management

### Create Workspace
```http
POST /workspace/create
Content-Type: application/json

{
  "companyName": "string",
  "displayName": "string", 
  "description": "string (optional)",
  "accessLevel": "private|team|company|public (optional, default: private)"
}
```

**Restrictions:**
- One workspace per user
- Unique workspace names (case-insensitive)

**Response:**
```json
{
  "success": true,
  "workspace": {
    "id": "ws_timestamp_id",
    "companyName": "string",
    "displayName": "string",
    "description": "string",
    "ownerId": "string",
    "accessLevel": "string",
    "createdAt": "ISO datetime"
  }
}
```

### Get Workspace Details
```http
GET /workspace/{workspaceId}
```

**Response:**
```json
{
  "success": true,
  "workspace": {...},
  "documents": [...],
  "chatHistory": [...],
  "stats": {
    "totalDocuments": number,
    "documentTypes": {...},
    "recentActivity": number
  }
}
```

### Delete Workspace
```http
DELETE /workspace/{workspaceId}
```

### List User Workspaces
```http
GET /workspace/list
```

---

## 📄 Document Management

### Upload Document (Full Featured)
```http
POST /workspace/{workspaceId}/upload
Content-Type: multipart/form-data

FormData:
- file: File (PDF, TXT, DOCX, PPTX, max 50MB)
- title: string (optional, defaults to filename)
- documentType: string (required) - see Document Types
- accessLevel: string (optional, default: team)
- tags: string (optional, comma-separated)
```

**Document Types:**
- `product_spec`
- `sales_deck`
- `case_study`
- `pricing`
- `competitor_analysis`
- `proposal`
- `whitepaper`

**Features:**
- AI entity extraction
- Auto-tagging
- Vector embedding generation
- Duplicate name prevention

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "doc_timestamp_id",
    "title": "string",
    "type": "string",
    "extractedEntities": {...},
    "autoTags": [...],
    "processingTime": number
  },
  "message": "Document uploaded and processed successfully"
}
```

### Get Document Details
```http
GET /workspace/{workspaceId}/document/{documentId}
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "string",
    "title": "string", 
    "content": "string",
    "contentPreview": "string",
    "documentType": "string",
    "fileType": "string",
    "uploadedBy": "string",
    "tags": [...],
    "autoTags": [...],
    "accessLevel": "string",
    "createdAt": "ISO datetime"
  }
}
```

### Delete Document
```http
DELETE /workspace/{workspaceId}/document/{documentId}
```

---

## 🤖 AI Chat & Intelligence

### Chat with Documents
```http
POST /workspace/{workspaceId}/chat
Content-Type: application/json

{
  "query": "string"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "string",
  "documentsUsed": [
    {
      "documentId": "string",
      "title": "string",
      "documentType": "string", 
      "maxSimilarity": number,
      "relevantChunks": [...]
    }
  ],
  "confidence": number,
  "suggestedQueries": [...],
  "processingTime": number
}
```

**Example Queries:**
```json
{
  "query": "What are our competitive advantages?"
}

{
  "query": "Who should I contact at enterprise companies?"
}

{
  "query": "What pricing information do we have for mid-market?"
}
```

---

## 🔧 Debug & Testing Endpoints

### Comprehensive System Test
```http
GET /debug/test-comprehensive
```

Tests all system components and returns capability assessment.

### Database Schema Inspection  
```http
GET /debug/inspect-db
```

### Check Database Constraints
```http
GET /debug/check-constraints
```

### Workspace Cleanup
```http
GET /workspace/cleanup     # Check status
DELETE /workspace/cleanup  # Clean duplicates
DELETE /debug/delete-all-workspaces  # Nuclear option
```

---

## 🗄️ Database Architecture

### Technology Stack
- **Vector Database:** Neon.tech (PostgreSQL with pgvector)
- **Embedding Model:** OpenAI text-embedding-ada-002 (1536 dimensions)
- **AI Model:** OpenAI GPT-4 for chat and entity extraction
- **Search:** Cosine similarity on vector embeddings

### Key Tables
```sql
-- Workspaces
company_workspaces (id, company_name, display_name, owner_id, ...)

-- Documents  
company_documents (id, workspace_id, title, full_content, document_type, ...)

-- Vector Embeddings
document_embeddings (id, document_id, embedding vector(1536), ...)

-- Chat History
workspace_chats (id, workspace_id, user_id, query, response, ...)
```

---

## 🎯 Sales Intelligence Use Cases

### 1. Competitive Analysis
```http
POST /workspace/{id}/chat
{
  "query": "How do we compare to HubSpot for enterprise clients?"
}
```

### 2. Proposal Preparation  
```http
POST /workspace/{id}/chat
{
  "query": "What talking points should I use for a meeting with Microsoft?"
}
```

### 3. Pricing Intelligence
```http
POST /workspace/{id}/chat  
{
  "query": "What pricing models do we offer for mid-market companies?"
}
```

### 4. Document Knowledge Mining
```http
POST /workspace/{id}/chat
{
  "query": "What ROI data do we have from our case studies?"
}
```

---

## 🔗 Integration Points

### Neo4j Integration (Planned)
- Export entity relationships from document analysis
- Visualize company networks, decision makers, and opportunities
- Graph-based recommendation engine

### Data Export Format
```json
{
  "entities": {
    "companies": [...],
    "products": [...], 
    "competitors": [...],
    "features": [...],
    "decision_makers": [...]
  },
  "relationships": [
    {
      "from": "entity_id",
      "to": "entity_id", 
      "type": "COMPETES_WITH|MENTIONS|TARGETS",
      "confidence": number,
      "sourceDocument": "doc_id"
    }
  ]
}
```

---

## 📊 Performance & Limits

- **File Size:** 50MB maximum
- **Supported Formats:** PDF, TXT, DOCX, PPTX
- **Vector Dimensions:** 1536 (OpenAI standard)
- **Chat Context:** Top 5 most relevant documents
- **Processing Time:** ~2-10 seconds per document
- **Search Threshold:** 0.6 similarity for relevance

---

## 🚨 Error Codes

- `400` - Bad Request (missing required fields, invalid file type)
- `401` - Authentication Required  
- `404` - Resource Not Found (workspace, document)
- `409` - Conflict (duplicate names, user limits)
- `500` - Server Error (processing failures, database issues)

---

## 📝 Development Notes

- All endpoints support CORS
- File uploads use multipart/form-data
- Chat responses include confidence scoring
- Vector search uses cosine similarity
- Entity extraction powered by GPT-4
- Automatic content chunking for large documents