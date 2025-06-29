# Graph Database Setup Guide

## 🚀 Quick Setup Instructions

### Step 1: Neo4j AuraDB Setup (5 minutes)

1. **Create Account**: Go to [console.neo4j.io](https://console.neo4j.io)
2. **Create Instance**: 
   - Click "New Instance"
   - Choose "AuraDB Free" 
   - Select region (closest to you)
   - Generate instance
3. **Get Credentials**:
   - **URI**: `neo4j+s://xxxxx.databases.neo4j.io`
   - **Username**: `neo4j` (default)
   - **Password**: Auto-generated (copy it!)

### Step 2: RushDB Setup (3 minutes)

1. **Access Dashboard**: Login to your RushDB account
2. **Generate API Token**:
   - Navigate to Settings/API
   - Click "Generate New Token"
   - Copy the token (starts with `rushdb_`)

### Step 3: Environment Configuration

Add to your `.env.local` file:

```bash
# Neo4j Configuration
NEO4J_URI=neo4j+s://your-instance-id.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_generated_password
NEO4J_DATABASE=neo4j

# RushDB Configuration  
RUSHDB_API_TOKEN=your_api_token_here
RUSHDB_API_URL=https://api.rushdb.com/api/v1
```

### Step 4: Test Setup

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Navigate to Graph Test Page**:
   ```
   http://localhost:3000/graph-test
   ```

3. **Initialize Databases**:
   - Click "Setup Databases" button
   - Wait for success message
   - See TechFlow Solutions 3D network appear

## 🎯 Success Verification

### You'll Know It's Working When:

✅ **Visual Confirmation**:
- 3D graph appears with 12 employee nodes
- Color-coded departments (Blue=Engineering, Green=Product, etc.)
- Interactive dragging and zooming works

✅ **Data Source Switching**:
- Radio buttons switch between Neo4j/RushDB/Hybrid
- Graph updates when changing sources
- Employee count remains consistent (12 nodes)

✅ **Relationship Visualization**:
- Red lines = reporting relationships (hierarchy)
- Green lines = collaboration relationships (projects)
- Click nodes to see employee details

## 🔧 Troubleshooting

### "Setup Databases" Button Fails:

**Check Environment Variables**:
```bash
# In your terminal, verify:
echo $NEO4J_URI
echo $RUSHDB_API_TOKEN
```

**Common Issues**:
- Neo4j URI missing `neo4j+s://` protocol
- RushDB token missing or invalid
- Environment variables not loaded (restart dev server)

### Graph Doesn't Render:

**Browser Requirements**:
- Modern browser (Chrome, Firefox, Safari, Edge)
- WebGL enabled (required for 3D graphics)
- JavaScript enabled

**Debug Steps**:
1. Open browser developer tools (F12)
2. Check Console tab for errors
3. Check Network tab - API calls should return 200 OK

### No Data Appears:

**Database Connection Issues**:
- Verify Neo4j instance is running (AuraDB dashboard)
- Test RushDB API token via their dashboard
- Check server console logs for connection errors

## 📊 Understanding the Test Data

### TechFlow Solutions Company Structure:

**Engineering Department** (Blue nodes):
- Sarah Chen (VP) → Alex Kumar, Maria Gonzalez, James Wilson, Lisa Park

**Product Department** (Green nodes):
- Michael Rodriguez (Director) → Emma Davis

**Sales Department** (Yellow nodes):
- Jennifer Kim (VP) → Robert Johnson, Amanda Taylor

**Marketing Department** (Red nodes):
- David Thompson (Director) → Sophie Brown

### Relationship Types:
- **Reporting**: Solid red lines (manager ↔ direct report)
- **Collaboration**: Solid green lines (project teammates)
- **Cross-functional**: Connections between departments

## 🔮 Next Steps: Graphiti Integration

**Note**: You mentioned "Graffiti" - I believe you mean **Graphiti** (the temporal graph analysis library).

**Graphiti Status**: Not yet implemented, planned for Phase 2
**Purpose**: Temporal relationship analysis and career progression tracking
**Timeline**: After basic 3D visualization is confirmed working

**Graphiti Will Add**:
- Time-based relationship evolution
- Career progression analysis  
- Skill development tracking
- Predictive relationship modeling

---

**Ready to Test?** Follow the setup steps above and let me know when you see the 3D TechFlow Solutions network! 🚀