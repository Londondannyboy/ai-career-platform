# Documentation Agent

## Purpose
The Documentation Agent automatically generates and maintains project documentation by analyzing code structure, extracting type information, and creating comprehensive API documentation.

## Capabilities

### 1. **Component Documentation**
- Extracts PropTypes and TypeScript interfaces
- Generates usage examples from component implementations
- Creates interactive documentation with live examples
- Maintains component library catalog

### 2. **API Documentation**
- Analyzes Next.js route handlers
- Extracts request/response schemas
- Generates OpenAPI specifications
- Creates interactive API explorer

### 3. **Type Documentation**
- Documents TypeScript interfaces and types
- Generates type reference guides
- Maintains database schema documentation
- Creates integration guides

## Usage

### Via Task Tool
```typescript
// Delegate documentation tasks to preserve main context
const documentationTasks = [
  'Generate API docs for /api/enrichment routes',
  'Update component library for design system',
  'Create integration guide for new database schema',
  'Generate type documentation for GraphQL schema'
];
```

### Direct Integration
```typescript
import { DocumentationAgent } from '@/agents/documentation';

const agent = new DocumentationAgent();

// Generate component documentation
await agent.generateComponentDocs('./src/components');

// Update API documentation
await agent.updateApiDocs('./src/app/api');

// Create integration guides
await agent.createIntegrationGuides('./docs/integrations');
```

## Benefits for Main Agent Context

### **Context Preservation**
By delegating documentation tasks, the main agent can:
- Focus on high-level architecture decisions
- Maintain context for complex implementations
- Avoid getting bogged down in documentation details
- Keep conversations focused on user goals

### **Automated Maintenance**
- Documentation stays up-to-date automatically
- Reduces manual documentation burden
- Ensures consistency across all docs
- Catches breaking changes early

### **Quality Assurance**
- Validates that public APIs are documented
- Ensures examples compile and work
- Maintains documentation standards
- Integrates with CI/CD pipeline

## Integration Points

### **With Main Development Flow**
```typescript
// Example: Main agent delegates documentation updates
async function implementNewFeature(featureSpec: FeatureSpec) {
  // Main agent focuses on implementation
  const implementation = await createFeatureImplementation(featureSpec);
  
  // Delegate documentation to sub-agent
  await DocumentationAgent.update({
    components: implementation.components,
    apis: implementation.apiRoutes,
    types: implementation.typeDefinitions,
  });
  
  return implementation;
}
```

### **With CI/CD Pipeline**
```yaml
# .github/workflows/documentation.yml
name: Auto-generate Documentation
on:
  push:
    branches: [main]
    paths: ['src/**']

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Generate Documentation
        run: npm run docs:generate
      - name: Deploy Documentation
        run: npm run docs:deploy
```

## Task Types Perfect for Sub-Agent

### **Repetitive Documentation Tasks**
- ✅ Generating component prop tables
- ✅ Extracting API endpoint schemas
- ✅ Creating type reference docs
- ✅ Updating changelog entries

### **Pattern-Based Documentation**
- ✅ Consistent README structures
- ✅ Standard JSDoc comment formats
- ✅ Uniform API documentation
- ✅ Integration guide templates

### **Cross-Reference Updates**
- ✅ Updating links when files move
- ✅ Maintaining inter-document references
- ✅ Generating navigation structures
- ✅ Creating search indexes

## Example Outputs

### **Component Documentation**
```markdown
# CompanyCard Component

## Overview
Displays company information with enrichment status and interaction options.

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| company | Company | required | Company data object |
| variant | 'default' \| 'compact' | 'default' | Display variant |
| onSelect | (company: Company) => void | undefined | Selection callback |

## Examples
\`\`\`tsx
// Basic usage
<CompanyCard company={companyData} />

// With selection handler
<CompanyCard 
  company={companyData} 
  onSelect={(company) => navigateToCompany(company.id)} 
/>
\`\`\`

## Accessibility
- Keyboard navigable
- Screen reader compatible
- High contrast support
```

### **API Documentation**
```markdown
# POST /api/enrichment/company

Enriches company data using HarvestAPI with intelligent caching.

## Request
\`\`\`typescript
interface EnrichmentRequest {
  companyName: string;
  forceRefresh?: boolean;
}
\`\`\`

## Response
\`\`\`typescript
interface EnrichmentResponse {
  success: boolean;
  data?: EnrichedCompany;
  error?: {
    code: string;
    message: string;
  };
}
\`\`\`

## Example
\`\`\`bash
curl -X POST /api/enrichment/company \\
  -H "Content-Type: application/json" \\
  -d '{"companyName": "CK Delta"}'
\`\`\`
```

## Next Steps

1. **Implement Agent Framework**: Create base agent class and communication protocol
2. **Build Documentation Generator**: Start with TypeScript interface extraction
3. **Integrate with CI/CD**: Automatic documentation updates on code changes
4. **Add More Agents**: Testing, Quality, and Data agents following same pattern

This approach allows the main agent to focus on complex reasoning and architecture while sub-agents handle specific, well-defined tasks efficiently.