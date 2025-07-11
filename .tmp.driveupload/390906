# Quest Quick Reference Card

## 🚀 Current Status (Dec 11, 2025)
- ✅ All visualizations working with live data
- ✅ Surface Repo saving properly
- ✅ Authentication issues resolved
- ✅ Skills and experiences persisting

## 🔗 Key URLs
- **Edit Profile**: `/repo/surface/edit`
- **3D Visualizations**:
  - Surface Repo: `/visualization/3d/surface-repo`
  - Career Timeline: `/visualization/career-timeline`
  - Skills Universe: `/visualization/skills-universe`
- **Debug Tools**:
  - Save Test: `/debug-save`
  - User Check: `/debug-user`
  - Test URLs: `/test-urls`

## 🔑 Critical Pattern: Client-Server Auth
```typescript
// CLIENT (auth works)
const { user } = useUser();
headers: { 'X-User-Id': user?.id }
body: JSON.stringify({ userId: user?.id, data })

// SERVER (auth fails)
const userId = body.userId || headers.get('X-User-Id');
```

## 📊 Next Priorities
1. **OKR Mountains** - 3D topographical visualization
2. **AI Intelligence** - Skill suggestions & clustering
3. **Repo Restructure** - Simplify to Surface + Specialized

## 🛠️ Dev Commands
```bash
npm run dev        # Start local
npm run build      # Test build
git push           # Deploy to Vercel
```

## ⚠️ Common Issues
1. **"No authenticated user"** → Pass user ID from client
2. **Data not saving** → Check if using correct user ID
3. **Type errors** → Add `: any` to catch blocks
4. **Viz not loading** → Wait for isLoaded && user

## 📚 Key Docs
- `QUEST_COMMON_PITFALLS.md` - Check FIRST when debugging
- `CLAUDE.md` - Project overview & critical patterns
- `QUEST_SESSION_SUMMARY_*.md` - Detailed implementation history