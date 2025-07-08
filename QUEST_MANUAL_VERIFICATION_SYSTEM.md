# Manual Verification System - Quest Platform

## Overview

Manual verification represents the **highest level of trust** in our relationship mapping system, where humans explicitly confirm organizational relationships that cannot be automatically inferred or validated.

## Trust Hierarchy

```
Level 4: Manual Verification (Highest Trust)
├── Human-confirmed relationships
├── Cannot be gamed or faked
└── Overrides all other sources

Level 3: Email Domain Verification
├── @company.com email = verified employee
└── Self-reported but domain-validated

Level 2: DataMagnet Recommendations
├── LinkedIn recommendation context
├── Verified professional relationships
└── "Managed directly", "Worked with", etc.

Level 1: DataMagnet "Also Viewed"
├── Network clustering signals
└── Likely connections but unverified

Level 0: Apify/Synthetic Data
├── Bulk scraped employee lists
└── Inferred relationships only
```

## Implementation Design

### Database Schema

```sql
-- Manual verification table
CREATE TABLE manual_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_person_id UUID NOT NULL,
  target_person_id UUID NOT NULL,
  relationship_type VARCHAR(50) NOT NULL, -- 'reports_to', 'manages', 'peer', 'works_with'
  company_id UUID NOT NULL,
  verified_by_user_id UUID NOT NULL, -- Quest user who verified
  verification_method VARCHAR(50), -- 'direct_knowledge', 'conversation', 'document'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  notes TEXT,
  verified_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Relationships can expire
  is_active BOOLEAN DEFAULT true
);

-- Verification audit trail
CREATE TABLE verification_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verification_id UUID REFERENCES manual_verifications(id),
  action VARCHAR(50), -- 'created', 'updated', 'deactivated', 'reactivated'
  performed_by UUID NOT NULL,
  reason TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Visual Representation in 3D Graph

```typescript
// Node colors by verification level
const nodeColors = {
  manuallyVerified: '#00FF00',    // Bright green - highest trust
  emailVerified: '#00CC00',       // Green - domain verified
  recommendationVerified: '#0099FF', // Blue - LinkedIn verified
  alsoViewed: '#6666FF',          // Light blue - clustered
  synthetic: '#999999'            // Gray - inferred only
}

// Edge styles by verification type
const edgeStyles = {
  manuallyVerified: {
    width: 4,
    style: 'solid',
    arrow: true,
    glow: true
  },
  recommendationVerified: {
    width: 3,
    style: 'solid',
    arrow: true
  },
  inferred: {
    width: 1,
    style: 'dashed',
    arrow: false
  }
}
```

## Verification Methods

### 1. Direct Verification (Highest Trust)
- User explicitly confirms: "Yes, I report to John Smith"
- User adds relationship: "Sarah Jones is my direct report"
- Stored with `verification_method = 'direct_knowledge'`

### 2. Conversation Verification
- During Quest AI coaching: "Who do you report to?"
- Natural language processing extracts relationships
- Stored with `verification_method = 'conversation'`

### 3. Document Upload Verification
- Org charts, team lists, project documents
- AI extracts relationships with human confirmation
- Stored with `verification_method = 'document'`

### 4. Peer Verification
- Multiple users confirm same relationship
- Increases confidence score with each confirmation
- Cross-validation from different sources

## API Endpoints

```typescript
// POST /api/verification/manual
{
  "source_person": "linkedin.com/in/johndoe",
  "target_person": "linkedin.com/in/janesmith", 
  "relationship": "reports_to",
  "company": "ckdelta",
  "confidence": 1.0,
  "notes": "Direct report since Jan 2024"
}

// GET /api/verification/relationships/:person_id
// Returns all verified relationships for a person

// POST /api/verification/bulk
// Bulk verify from org chart upload

// PUT /api/verification/:id/deactivate
// Deactivate outdated relationships
```

## User Interface Components

### 1. Relationship Confirmation Modal
```typescript
<ConfirmRelationshipModal
  suggestedRelationship={{
    type: 'reports_to',
    target: 'John Smith',
    source: 'datamagnet_recommendation'
  }}
  onConfirm={(verified) => saveManualVerification(verified)}
  onReject={() => markAsIncorrect()}
/>
```

### 2. Manual Add Relationship
```typescript
<AddRelationshipForm
  currentPerson={user}
  companyContext="ckdelta"
  relationshipTypes={['reports_to', 'manages', 'peer', 'works_with']}
  onSubmit={(relationship) => createManualVerification(relationship)}
/>
```

### 3. Org Chart Builder
- Drag-and-drop interface
- Visual relationship mapping
- Bulk verification from charts

## Privacy & Permissions

### Visibility Rules
1. **Public Relationships**: Visible to all (with consent)
2. **Company-Private**: Visible only within company domain
3. **Personal-Private**: Visible only to verified individuals
4. **Anonymous**: Aggregated data only, no names

### Consent Management
```sql
CREATE TABLE relationship_consent (
  person_id UUID,
  relationship_id UUID,
  visibility_level VARCHAR(20), -- 'public', 'company', 'private', 'anonymous'
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMP
);
```

## Value Proposition

### For Individuals
- Control over their professional graph
- Correct inaccurate synthetic data
- Build verified professional reputation

### For Companies
- Accurate organizational intelligence
- Real reporting structures vs. official org charts
- Identify key connectors and influencers

### For Quest Platform
- Highest quality relationship data in market
- Cannot be gamed or faked
- Competitive moat through human verification

## Future Enhancements

1. **Blockchain Verification** - Immutable relationship records
2. **Multi-Party Confirmation** - Both parties confirm relationship
3. **Time-Series Tracking** - Historical org changes
4. **Verification Rewards** - Incentivize accurate data contribution
5. **API for HR Systems** - Integrate with official sources

## Implementation Priority

**Phase 1**: Basic manual verification UI
**Phase 2**: Conversation-based extraction  
**Phase 3**: Document upload and parsing
**Phase 4**: Peer verification system
**Phase 5**: Blockchain and rewards

---

*Manual verification is the crown jewel of Quest's relationship intelligence system, providing unmatched accuracy in organizational mapping.*