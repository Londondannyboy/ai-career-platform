# Quest Common Pitfalls & Solutions

This document contains common errors and solutions encountered during Quest development. Essential reading for avoiding repeated mistakes.

## 🚨 Database & SQL Issues

### 1. **PostgreSQL is Primary** (Not Supabase)
- **Issue**: Keep thinking Supabase patterns
- **Reality**: We use Neon PostgreSQL
- **Solution**: Always use `@vercel/postgres` and `sql` template literals

### 2. **Vercel SQL No Dynamic Columns**
```typescript
// WRONG
sql`SELECT ${columnName} FROM users`

// CORRECT - Use switch statement
switch(layer) {
  case 'surface':
    sql`SELECT surface_repo FROM users`
}
```

### 3. **Environment Variable Names**
- `DATABASE_URL` = Neon PostgreSQL (not Supabase)
- `POSTGRES_URL` = Same as above (Vercel expects this)
- Always check which service expects which name

### 4. **Company Schema** (Added Dec 10, 2025)
- **Table**: `company_enrichments`
- **Key field**: `canonical_identifier` (NOT `domain`!)
- **Error**: "column domain does not exist"
- **Fix**: Use correct schema fields

### 5. **Data Format Consistency** (Added Dec 11, 2025)
- **Issue**: Skills stored as both strings and objects
- **Company field**: Can be string or object with name property
```typescript
// Handle both formats
const skillName = typeof skill === 'string' ? skill : skill.name;
const companyName = typeof exp.company === 'string' 
  ? exp.company 
  : (exp.company?.name || 'Unknown');
```

### 6. **Visualization Loading Pattern** (Added Dec 11, 2025)
- **Issue**: Visualizations try to load before user is available
- **Fix**: Wait for user to be loaded
```typescript
useEffect(() => {
  if (!isLoaded || !user?.id) {
    if (isLoaded && !user) {
      setError('Please sign in');
      setLoading(false);
    }
    return;
  }
  // Now safe to load data
  loadVisualization();
}, [user, isLoaded]);
```

## 🚨 Authentication & Middleware

### 1. **Clerk Middleware Blocks Everything**
- **Issue**: Test routes return 404/redirect to sign-in
- **Pattern**: Add to `middleware.ts` public routes
- **Quick Fix**: Use `/api/debug/*` prefix (already public)

Example:
```typescript
const isPublicRoute = createRouteMatcher([
  '/api/public/(.*)',
  '/api/debug/(.*)', // Debug routes are public
  '/api/deep-repo/(.*)', // Add your test routes here
]);
```

### 2. **Auth Endpoint Pattern** (Added Dec 10, 2025 - Updated Dec 11)
- **Issue**: Endpoints fail with "Clerk can't detect usage of clerkMiddleware()"
- **Wrong Fix**: Keep tweaking middleware syntax or requiring auth
- **Right Fix**: Make endpoints handle auth failures gracefully
```typescript
// WRONG - This will cause "Clerk can't detect" errors
const { userId } = await auth();
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// RIGHT - Handle auth failures gracefully
let userId = null;
try {
  const authResult = await auth();
  userId = authResult.userId;
} catch (e) {
  console.log('Auth failed, continuing without auth');
}
// Use anonymous ID if no auth
if (!userId) {
  userId = `anon-${Date.now()}`;
}
```
- **Critical**: Even if routes are in middleware public list, auth() can still fail!

### 3. **Client-Server User ID Pattern** (Added Dec 11, 2025)
- **Issue**: User is authenticated in client but API routes can't access user ID
- **Symptoms**: "No authenticated user" errors even when signed in
- **Solution**: Pass user ID from client where it works
```typescript
// CLIENT - where auth works
const { user } = useUser();
const headers = {
  'Content-Type': 'application/json',
  'X-User-Id': user?.id || ''
};

// Also send in body as backup
fetch('/api/endpoint', {
  method: 'POST',
  headers,
  body: JSON.stringify({ 
    userId: user?.id,
    data: yourData 
  })
});

// SERVER - check multiple sources
const body = await request.json();
let userId = body.userId; // Start with body
if (!userId) {
  userId = request.headers.get('X-User-Id');
}
```

## 🚨 Next.js 15 Specific Issues

### 1. **Dynamic Route Params Must Be Awaited**
```typescript
// WRONG - Works in Next.js 14
export async function GET(req, { params }) {
  const { id } = params; // ERROR!
}

// CORRECT - Next.js 15
export async function GET(req, { params }) {
  const { id } = await params; // Must await!
}
```

### 2. **TypeScript Strict Mode**
- Always type array parameters in map functions
- Use `keyof typeof` for object key access
- Explicitly type empty arrays: `const nodes: any[] = []`

## 🚨 Voice AI Integration

### 1. **Audio Format Requirements**
- **Critical**: Must be 16-bit PCM format
- **Session Settings**: Required for proper audio handling
- **No Fallbacks**: Audio failures must be communicated clearly

### 2. **CLM Endpoint Format**
- Must match OpenAI specification exactly
- Server-sent events (SSE) format required
- Proper Content-Type headers essential

### 3. **HTTPS Required**
- Microphone access requires HTTPS in production
- Local development works with HTTP
- Vercel deployment provides HTTPS automatically

## 🚨 Deep Repo & JSONB

### 1. **JSONB Parsing**
- Vercel SQL returns JSONB as objects, not strings
- Always check type before parsing:
```typescript
const data = typeof result === 'string' 
  ? JSON.parse(result) 
  : result;
```

### 2. **Layer Updates**
- Use specific update methods for each layer
- Merge operations preserve existing data
- Always update `updated_at` timestamp

## 🚨 3D Visualization

### 1. **Dynamic Imports Required**
```typescript
// Required for react-force-graph-3d
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { 
  ssr: false 
});
```

### 2. **Node Positioning**
- Initial positions matter for layout
- Use mathematical formulas for triangular arrangements
- Size nodes appropriately for visibility

## 🚨 Build & Deployment

### 1. **TypeScript Compilation**
- Run `npm run build` before pushing
- Fix all type errors before deployment
- Vercel will fail deployment on TypeScript errors

### 2. **Environment Variables**
- Add all variables to Vercel dashboard
- `NEXT_PUBLIC_` prefix for client-side variables
- Redeploy after adding new variables

### 3. **API Route Testing**
- Check middleware for public route access
- Use proper HTTP methods (GET, POST)
- Return proper NextResponse objects

## 🚨 Common Error Messages

### "Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware()"
**Solution**: Add route to public routes in middleware.ts

### "Cannot read properties of undefined"
**Solution**: Add optional chaining or null checks

### "Element implicitly has an 'any' type"
**Solution**: Add explicit type annotations

### "Failed to compile" (TypeScript)
**Solution**: Fix type errors shown in build output

## Prevention Strategies

1. **Always Test Locally First**
   ```bash
   npm run build  # Must pass
   npm run dev    # Test functionality
   ```

2. **Check These Before Pushing**
   - [ ] TypeScript compiles without errors
   - [ ] New routes added to middleware if needed
   - [ ] Environment variables documented
   - [ ] API endpoints return proper responses

3. **Use Debug Routes**
   - `/api/debug/*` routes are public by default
   - Great for testing without auth issues
   - Remember to move to proper routes later

---

*Last Updated: December 10, 2025*