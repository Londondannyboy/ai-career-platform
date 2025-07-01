# GitHub Issue: Quest Company Data Unifier

**Copy this content to create a GitHub issue:**

---

## 🏢 Quest Company Data Unifier - Missing Component

### **Issue Summary**
During the Cole Medin architecture implementation, we identified that a **Company Data Unifier** component was not implemented. This component should consolidate company information from multiple sources and resolve duplicate entries.

### **Problem Statement**
Currently, Quest may have:
- Duplicate company profiles from different data sources (DataMagnet, Neo4j, manual entry)
- Inconsistent company naming and formatting
- Missing relationships between company aliases and subsidiaries
- No canonical company identifier system

### **Expected Functionality**

#### **Core Features**
1. **Duplicate Detection**
   - Match companies by name variations (e.g., "Apple Inc" vs "Apple Inc." vs "Apple")
   - Match by domain/URL (apple.com variations)
   - Match by LinkedIn company URLs
   - Use fuzzy matching for similar names

2. **Data Consolidation**
   - Merge company profiles from multiple sources
   - Prioritize data quality (most recent, most complete)
   - Maintain source attribution for audit trails
   - Create canonical company records

3. **Relationship Mapping**
   - Parent/subsidiary relationships
   - Company name changes over time
   - Acquisitions and mergers
   - Alternative company names and aliases

4. **Integration Points**
   - Neo4j graph database for relationships
   - Neon.tech for vector embeddings
   - Graphiti for temporal company evolution
   - DataMagnet API for external data enrichment

### **Technical Requirements**

#### **API Endpoints**
```typescript
POST /api/company/unify          // Trigger unification process
GET  /api/company/duplicates     // Find potential duplicates  
POST /api/company/merge          // Merge specific companies
GET  /api/company/canonical/{id} // Get canonical company data
```

#### **Database Schema**
```sql
-- Company unification tracking
CREATE TABLE company_unification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id UUID NOT NULL,
  source_ids UUID[] NOT NULL,
  confidence_score FLOAT NOT NULL,
  merge_strategy VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Company aliases and variations
CREATE TABLE company_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id UUID NOT NULL,
  alias_name VARCHAR(255) NOT NULL,
  alias_type VARCHAR(50), -- 'legal_name', 'trading_name', 'former_name'
  confidence FLOAT DEFAULT 1.0,
  source VARCHAR(100)
);
```

#### **Temporal Integration**
```typescript
// Track company unification as temporal facts
await graphitiService.storeFact({
  subject: sourceCompanyId,
  predicate: 'unified_into',
  object: canonicalCompanyId,
  confidence: 0.95,
  validFrom: new Date(),
  source: 'company-unifier'
})
```

### **Implementation Strategy**

#### **Phase 1: Detection (2-3 hours)**
- Implement duplicate detection algorithms
- Create scoring system for match confidence
- Build API endpoints for duplicate identification

#### **Phase 2: Unification (3-4 hours)**  
- Implement merge logic with conflict resolution
- Create canonical company record structure
- Add temporal fact tracking for unifications

#### **Phase 3: Integration (2-3 hours)**
- Integrate with existing Quest agent searches
- Update embeddings for unified companies
- Add UI for manual review and approval

#### **Phase 4: Automation (2-3 hours)**
- Implement automatic unification for high-confidence matches
- Add background job for ongoing duplicate detection
- Create monitoring and quality metrics

### **Files to Create/Modify**

#### **New Files**
```
src/lib/unification/
├── companyUnifier.ts           # Core unification logic
├── duplicateDetection.ts       # Matching algorithms
├── mergingStrategies.ts        # Data consolidation rules

src/app/api/company/
├── unify/route.ts             # Unification endpoint
├── duplicates/route.ts        # Duplicate detection API
├── merge/route.ts             # Manual merge endpoint

src/app/company-unifier/
├── page.tsx                   # Admin UI for review
```

#### **Files to Modify**
```
src/lib/agents/questAgent.ts       # Update to use canonical company IDs
src/lib/vector/neonClient.ts        # Add unification tracking
src/lib/temporal/graphiti.ts        # Store unification facts
src/app/neon-migrate/page.tsx       # Add unification option
```

### **Success Criteria**
- [ ] Detect 90%+ of obvious company duplicates
- [ ] Successfully merge companies without data loss
- [ ] Maintain search quality after unification
- [ ] Reduce company count by 20-30% through deduplication
- [ ] Temporal tracking of all unification actions

### **Priority**
**Medium** - Important for data quality but not blocking core functionality

### **Labels**
- enhancement
- data-quality  
- quest-architecture
- company-management

### **Estimated Effort**
8-12 hours across 4 phases

### **Related Components**
- Quest Agent Search (#existing)
- Neon.tech Vector Database (#existing)
- Graphiti Temporal Layer (#existing)
- DataMagnet Integration (#existing)

---

**Note**: This unifier is a natural extension of the Quest architecture that will significantly improve data quality and search accuracy by eliminating duplicate company entries and creating canonical company records.