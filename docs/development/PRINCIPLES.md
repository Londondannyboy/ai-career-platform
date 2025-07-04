# Quest Development Principles

## 🎯 Core Mission

Quest is an AI-powered business intelligence platform that transforms how professionals navigate their careers and how organizations understand their networks. Every line of code should serve this mission by being **intelligent**, **accessible**, and **empowering**.

## 🏗️ Architectural Principles

### 1. **Modular by Design**
Every component, service, and module should be self-contained and reusable.

**✅ Good Examples:**
```typescript
// Self-contained component with clear interface
export interface CompanyCardProps {
  company: Company;
  onSelect?: (company: Company) => void;
  variant?: 'default' | 'compact' | 'detailed';
}

export function CompanyCard({ company, onSelect, variant = 'default' }: CompanyCardProps) {
  // Component logic here
}
```

**❌ Avoid:**
```typescript
// Tightly coupled to specific contexts
function CompanyWidget() {
  const { selectedCompany, setCompany } = useGlobalCompanyState(); // Too coupled
  const dashboardConfig = useDashboardContext(); // Too specific
}
```

**Validation Checklist:**
- [ ] Component has clear, typed interface
- [ ] No hard dependencies on external state
- [ ] Can be used in multiple contexts
- [ ] Has documented props and behavior
- [ ] Includes relevant tests

### 2. **Progressive Enhancement**
Build from the ground up, adding complexity only when needed.

**Implementation Strategy:**
1. **Core Functionality First**: Basic features work without JavaScript
2. **Layer Enhancements**: Add interactivity, animations, advanced features
3. **Graceful Degradation**: Fallbacks for failed API calls or missing data
4. **Performance Budget**: Fast loading even on slow connections

**✅ Good Example:**
```typescript
// Progressive enhancement pattern
export function DataVisualization({ data, enhanced = true }: VisualizationProps) {
  if (!data?.length) {
    return <DataTable data={data} />; // Fallback to simple table
  }
  
  if (!enhanced || !supportsWebGL()) {
    return <Simple2DChart data={data} />; // 2D fallback
  }
  
  return <Interactive3DGraph data={data} />; // Full enhancement
}
```

### 3. **Data-Driven Intelligence**
Let data and user behavior guide architectural decisions.

**Decision Framework:**
- **Performance Metrics**: Response times, bundle sizes, Core Web Vitals
- **User Analytics**: Feature adoption, task completion rates, error frequencies
- **Business Metrics**: Conversion rates, user retention, API cost efficiency
- **Technical Metrics**: Test coverage, code complexity, maintenance overhead

**Example Implementation:**
```typescript
// Architecture decisions based on actual usage
const FEATURE_FLAGS = {
  // 90% of users never use advanced filters
  advancedFilters: shouldLoadAdvancedFilters(userProfile),
  
  // 3D visualization only for power users with capable devices
  enhanced3D: hasWebGLSupport() && isActivePaidUser(),
  
  // Voice features only when user has shown interest
  voiceCoaching: hasUsedVoiceFeature() || userPreferences.voiceEnabled,
};
```

### 4. **AI-First Architecture**
Design with AI capabilities as a core feature, not an add-on.

**Integration Patterns:**
```typescript
// AI should feel integrated, not bolted on
interface IntelligentSearchProps {
  query: string;
  context: UserContext;
  aiEnhanced?: boolean; // Graceful degradation
}

export function IntelligentSearch({ query, context, aiEnhanced = true }: IntelligentSearchProps) {
  const searchStrategy = useSearchStrategy(query, context); // AI determines strategy
  const results = useSearch(query, searchStrategy);
  const insights = useAIInsights(results, context); // AI adds intelligence
  
  return (
    <SearchResults 
      results={results}
      insights={aiEnhanced ? insights : undefined}
      enhancedFeatures={aiEnhanced}
    />
  );
}
```

## 💻 Code Quality Principles

### 5. **Type Safety First**
TypeScript isn't optional—it's essential for maintainable code.

**Standards:**
- **Strict Mode**: No `any` types except for migration legacy code
- **Interface Design**: Clear contracts between components
- **Runtime Validation**: Use Zod for API boundaries
- **Type Generation**: Auto-generate types from database schemas

**✅ Good Example:**
```typescript
// Comprehensive type definitions
interface CompanyEnrichmentRequest {
  companyName: string;
  domain?: string;
  forceRefresh?: boolean;
}

interface CompanyEnrichmentResponse {
  success: boolean;
  data?: EnrichedCompany;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  metadata: {
    requestId: string;
    timestamp: string;
    cacheHit: boolean;
  };
}

// Runtime validation at boundaries
const EnrichmentRequestSchema = z.object({
  companyName: z.string().min(1),
  domain: z.string().url().optional(),
  forceRefresh: z.boolean().default(false),
});
```

### 6. **Testing is Documentation**
Tests should serve as living documentation of how code behaves.

**Testing Hierarchy:**
1. **Unit Tests**: Component behavior, pure functions
2. **Integration Tests**: API endpoints, database interactions
3. **E2E Tests**: Critical user journeys
4. **Visual Tests**: Component rendering across browsers

**Test Quality Standards:**
```typescript
// Tests as documentation
describe('CompanyEnrichment', () => {
  describe('when enriching a new company', () => {
    it('should fetch data from HarvestAPI and cache for 30 days', async () => {
      // Arrange: Clear, descriptive setup
      const mockCompany = createMockCompany({ name: 'CK Delta' });
      mockHarvestAPI.getCompany.mockResolvedValue(mockCompany);
      
      // Act: Single, clear action
      const result = await enrichCompany('CK Delta');
      
      // Assert: Specific, meaningful assertions
      expect(result.data).toEqual(mockCompany);
      expect(mockCache.set).toHaveBeenCalledWith(
        'company:ck-delta', 
        mockCompany, 
        { ttl: 30 * 24 * 60 * 60 * 1000 } // 30 days
      );
    });
  });
});
```

### 7. **Performance as a Feature**
Performance isn't an afterthought—it's a user experience feature.

**Performance Budget:**
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: Core < 200KB gzipped
- **API Response**: < 300ms p95

**Implementation Patterns:**
```typescript
// Performance-first patterns
export function LazyDashboard() {
  // Code splitting for non-critical features
  const Chart3D = lazy(() => import('./Chart3D'));
  const AdvancedFilters = lazy(() => import('./AdvancedFilters'));
  
  // Progressive loading
  const { data, isLoading } = useQuery('company-data', fetchCompanyData, {
    staleTime: 5 * 60 * 1000, // 5 minute cache
    cacheTime: 30 * 60 * 1000, // 30 minute background cache
  });
  
  return (
    <Dashboard>
      {/* Critical content loads first */}
      <CompanySummary data={data} />
      
      {/* Non-critical content loads after */}
      <Suspense fallback={<ChartSkeleton />}>
        <Chart3D data={data} />
      </Suspense>
    </Dashboard>
  );
}
```

## 🎨 User Experience Principles

### 8. **Accessibility is Non-Negotiable**
Every feature must be usable by everyone, regardless of ability.

**Standards:**
- **WCAG 2.1 AA**: Minimum compliance level
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text

**Implementation Example:**
```typescript
// Accessible by design
export function SearchInput({ onSearch, placeholder = "Search companies..." }: SearchInputProps) {
  return (
    <div className="relative">
      <label htmlFor="company-search" className="sr-only">
        Search for companies and organizations
      </label>
      <input
        id="company-search"
        type="search"
        placeholder={placeholder}
        aria-describedby="search-hint"
        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary"
        onKeyDown={(e) => e.key === 'Enter' && onSearch(e.currentTarget.value)}
      />
      <div id="search-hint" className="sr-only">
        Press Enter to search, or use arrow keys to navigate suggestions
      </div>
    </div>
  );
}
```

### 9. **Progressive Disclosure**
Show the right information at the right time.

**Information Architecture:**
- **Overview First**: Start with high-level insights
- **Drill-Down**: Allow users to explore details
- **Context Switching**: Smooth transitions between views
- **Breadcrumbs**: Always show where you are

**Example Implementation:**
```typescript
// Progressive disclosure pattern
export function CompanyDetails({ companyId }: CompanyDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="company-details">
      {/* Always visible overview */}
      <CompanyHeader companyId={companyId} />
      
      {/* Progressive disclosure through tabs */}
      <TabNavigation value={activeTab} onChange={setActiveTab}>
        <TabPanel value="overview">
          <CompanyOverview companyId={companyId} />
        </TabPanel>
        
        <TabPanel value="employees" lazy>
          <EmployeeDirectory companyId={companyId} />
        </TabPanel>
        
        <TabPanel value="network" lazy>
          <NetworkVisualization companyId={companyId} />
        </TabPanel>
      </TabNavigation>
    </div>
  );
}
```

## 🔒 Security Principles

### 10. **Security by Design**
Security considerations must be built in from the start.

**Security Checklist:**
- [ ] All user inputs validated and sanitized
- [ ] API keys and secrets in environment variables only
- [ ] HTTPS everywhere (enforced by middleware)
- [ ] Rate limiting on all public endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React's default escaping + CSP headers)
- [ ] CSRF protection for state-changing operations

**Implementation Example:**
```typescript
// Security-first API endpoint
export async function POST(request: Request) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      return new Response('Too many requests', { status: 429 });
    }
    
    // 2. Authentication
    const user = await authenticateRequest(request);
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // 3. Input validation
    const body = await request.json();
    const validatedData = CompanyEnrichmentSchema.parse(body);
    
    // 4. Authorization
    if (!user.canEnrichCompanies) {
      return new Response('Forbidden', { status: 403 });
    }
    
    // 5. Secure processing
    const result = await enrichCompanySafely(validatedData, user);
    
    return Response.json(result);
  } catch (error) {
    // 6. Error handling without information leakage
    console.error('Company enrichment error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
```

## 🚀 Deployment Principles

### 11. **Continuous Integration/Continuous Deployment**
Every merge should be potentially deployable.

**CI/CD Pipeline Requirements:**
1. **Automated Tests**: All tests must pass
2. **Code Quality**: ESLint, Prettier, TypeScript strict mode
3. **Security Scanning**: Dependency vulnerabilities, secret detection
4. **Performance Testing**: Bundle size, lighthouse scores
5. **Visual Testing**: Screenshot comparisons
6. **Database Migrations**: Automatic and reversible

**Pre-commit Validation:**
```typescript
// .quest/pre-commit-checks.ts
interface PreCommitValidation {
  principles: {
    modularity: boolean;          // Components are self-contained
    typesSafety: boolean;         // No any types, strict mode
    testing: boolean;             // Adequate test coverage
    accessibility: boolean;       // A11y standards met
    performance: boolean;         // Performance budget met
    security: boolean;            // No secrets, inputs validated
    documentation: boolean;       // JSDoc comments, README updates
  };
  
  async validate(): Promise<ValidationReport>;
}
```

### 12. **Observability and Monitoring**
If you can't measure it, you can't improve it.

**Monitoring Stack:**
- **Error Tracking**: Sentry for frontend and backend errors
- **Performance Monitoring**: Web Vitals, API response times
- **User Analytics**: Feature usage, user journeys
- **Business Metrics**: Conversion rates, retention
- **Infrastructure**: Database performance, API costs

**Implementation Example:**
```typescript
// Observability built in
export function useCompanyEnrichment() {
  return useMutation({
    mutationFn: enrichCompany,
    onSuccess: (data, variables) => {
      // Track success metrics
      analytics.track('Company Enriched', {
        companyName: variables.companyName,
        cacheHit: data.metadata.cacheHit,
        responseTime: data.metadata.responseTime,
      });
    },
    onError: (error, variables) => {
      // Track and report errors
      Sentry.captureException(error, {
        tags: { operation: 'company-enrichment' },
        extra: { companyName: variables.companyName },
      });
    },
  });
}
```

## 📝 Documentation Principles

### 13. **Self-Documenting Code**
Code should be readable without extensive comments.

**Documentation Hierarchy:**
1. **Clear Naming**: Functions and variables explain intent
2. **Type Definitions**: TypeScript interfaces document structure
3. **JSDoc Comments**: For complex logic and public APIs
4. **README Files**: For modules and significant features
5. **Architecture Docs**: For system-level decisions

**Example:**
```typescript
/**
 * Enriches company data using HarvestAPI with intelligent caching.
 * 
 * @param companyName - The company name to enrich
 * @param options - Enrichment options
 * @returns Promise<EnrichmentResult> - Enriched company data or error
 * 
 * @example
 * ```typescript
 * const result = await enrichCompanyIntelligently('CK Delta', {
 *   forceRefresh: false,
 *   includeEmployees: true
 * });
 * 
 * if (result.success) {
 *   console.log('Enriched company:', result.data);
 * }
 * ```
 */
export async function enrichCompanyIntelligently(
  companyName: string,
  options: EnrichmentOptions = {}
): Promise<EnrichmentResult> {
  // Implementation...
}
```

## 🤖 AI Integration Principles

### 14. **AI as Enhancement, Not Replacement**
AI should augment human capabilities, not replace human judgment.

**AI Integration Guidelines:**
- **Transparency**: Always show when AI is being used
- **Confidence Levels**: Display AI confidence in recommendations
- **Human Override**: Users can always correct or ignore AI suggestions
- **Graceful Fallback**: System works without AI when needed
- **Continuous Learning**: AI improves from user feedback

**Example Implementation:**
```typescript
// AI-enhanced with human control
export function IntelligentRecommendations({ context }: RecommendationsProps) {
  const { recommendations, confidence } = useAIRecommendations(context);
  const [userFeedback, setUserFeedback] = useState<Record<string, 'helpful' | 'not-helpful'>>();
  
  return (
    <div className="recommendations">
      <div className="header">
        <h3>AI Recommendations</h3>
        <Badge variant="secondary">
          {confidence > 0.8 ? 'High Confidence' : 'Medium Confidence'}
        </Badge>
      </div>
      
      {recommendations.map((rec) => (
        <RecommendationCard
          key={rec.id}
          recommendation={rec}
          onFeedback={(feedback) => {
            setUserFeedback(prev => ({ ...prev, [rec.id]: feedback }));
            trackAIFeedback(rec.id, feedback);
          }}
        />
      ))}
      
      <div className="ai-disclaimer">
        <Icon name="info" />
        <span>These recommendations are AI-generated. Always use your judgment.</span>
      </div>
    </div>
  );
}
```

## ✅ Pre-Commit Validation

Before any code is committed, it must pass these principle checks:

### Modularity Check
- [ ] Component has clear, typed interface
- [ ] No hard dependencies on global state
- [ ] Can be reused in multiple contexts
- [ ] Includes basic tests

### Quality Check  
- [ ] TypeScript strict mode compliance
- [ ] ESLint passes with no warnings
- [ ] Prettier formatting applied
- [ ] No console.log statements in production code

### Performance Check
- [ ] Bundle size impact analyzed
- [ ] Large dependencies justified
- [ ] Images optimized and appropriately sized
- [ ] API calls are cached when appropriate

### Accessibility Check
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast requirements met
- [ ] Focus indicators visible

### Security Check
- [ ] No secrets in code
- [ ] User inputs validated
- [ ] SQL injection prevention
- [ ] XSS protection in place

### Documentation Check
- [ ] Public APIs have JSDoc comments
- [ ] Complex logic is explained
- [ ] README updated if needed
- [ ] Type definitions are clear

---

*These principles guide every decision in Quest development. They ensure we build a platform that is robust, maintainable, accessible, and truly serves our users' needs.*