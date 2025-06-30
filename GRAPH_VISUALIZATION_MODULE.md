# 3D Graph Visualization Module

## 🚀 Complete Reusable Module for Interactive 3D Graph Visualization

**Status**: ✅ Production Ready  
**Live Demo**: https://ai-career-platform.vercel.app/graph-test  
**Last Updated**: December 2024

## Overview

This module provides a complete solution for visualizing organizational or network data in interactive 3D graphs. It combines Neo4j graph database power with RushDB's visualization capabilities, wrapped in a React component using `react-force-graph-3d`.

## 🎯 Key Features

- **Interactive 3D Visualization** - Click, drag, zoom, and explore network relationships
- **Hybrid Database Support** - Neo4j for robust querying, RushDB for visualization interface
- **Graceful Fallback** - Works with single database or embedded test data
- **Real-time Activity Logging** - Monitor operations and debug issues
- **Responsive Design** - Works on desktop and mobile
- **TypeScript Support** - Full type safety and IntelliSense

## 📦 Installation

### 1. Install Dependencies

```bash
npm install neo4j-driver @rushdb/javascript-sdk react-force-graph-3d three
npm install --save-dev @types/three
```

### 2. Copy Module Files

```bash
# Core graph services
cp -r src/lib/graph/ [your-project]/src/lib/

# 3D visualization component  
cp src/components/Graph3D.tsx [your-project]/src/components/

# API endpoints (optional)
cp -r src/app/api/graph/ [your-project]/src/app/api/

# Test interface (optional)
cp -r src/app/graph-test/ [your-project]/src/app/
```

### 3. Environment Variables (Optional)

```bash
# Neo4j Configuration
NEO4J_URI=neo4j+s://your-project.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password

# RushDB Configuration  
RUSHDB_API_TOKEN=your-rushdb-token
```

> **Note**: For testing, you can use hardcoded credentials in the service files.

## 🔧 Architecture

### Database Layer
```
┌─────────────────────────────────────────────────────────┐
│                   Graph Service                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Neo4j     │  │   RushDB    │  │  Fallback Data  │  │
│  │ (Cypher)    │  │ (Visual)    │  │  (Embedded)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                    ┌─────────────┐
                    │ React 3D    │
                    │ Component   │
                    └─────────────┘
```

### Component Structure
```
src/
├── lib/graph/
│   ├── index.ts          # Main service coordinator
│   ├── neo4j.ts          # Neo4j integration
│   └── rushdb.ts         # RushDB integration
├── components/
│   └── Graph3D.tsx       # 3D visualization component
└── app/
    ├── api/graph/        # REST API endpoints
    └── graph-test/       # Testing interface
```

## 🚀 Usage

### Basic Implementation

```typescript
import { useState, useEffect } from 'react'
import graphService from '@/lib/graph'
import Graph3D from '@/components/Graph3D'

export default function MyGraphPage() {
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(false)

  const setupGraph = async () => {
    setLoading(true)
    try {
      // Initialize databases
      await graphService.initializeAll({
        neo4j: {
          uri: 'neo4j+s://your-project.databases.neo4j.io',
          username: 'neo4j',
          password: 'your-password'
        },
        rushdb: {
          apiToken: 'your-rushdb-token'
        }
      })

      // Create sample data
      await graphService.setupTechFlowTestData()

      // Get visualization data
      const data = await graphService.getVisualizationData('hybrid')
      setGraphData(data)
    } catch (error) {
      console.error('Graph setup failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={setupGraph} disabled={loading}>
        {loading ? 'Setting up...' : 'Setup Graph'}
      </button>
      
      {graphData && (
        <Graph3D 
          data={graphData}
          width={800}
          height={600}
          onNodeClick={(node) => console.log('Clicked:', node)}
        />
      )}
    </div>
  )
}
```

### API Integration

```typescript
// Using API endpoints
const setupDatabases = async () => {
  const response = await fetch('/api/graph/setup', { method: 'POST' })
  const result = await response.json()
  return result
}

const getVisualizationData = async (source = 'hybrid') => {
  const response = await fetch(`/api/graph/visualization?source=${source}`)
  const result = await response.json()
  return result.data
}
```

### Custom Data Structure

```typescript
// Define your own data structure
const customData = {
  nodes: [
    {
      id: 'node1',
      name: 'John Doe', 
      role: 'Manager',
      department: 'Sales',
      level: 'Senior',
      color: '#3B82F6',
      size: 15
    }
    // ... more nodes
  ],
  links: [
    {
      source: 'node1',
      target: 'node2', 
      type: 'reports_to',
      color: '#DC2626'
    }
    // ... more links
  ]
}

<Graph3D data={customData} />
```

## 🎨 Customization

### Graph3D Component Props

```typescript
interface Graph3DProps {
  data?: {
    nodes: Node[]
    links: Link[]
  }
  width?: number              // Default: 800
  height?: number            // Default: 600
  onNodeClick?: (node: Node) => void
  onNodeHover?: (node: Node | null) => void
}
```

### Node Data Structure

```typescript
interface Node {
  id: string
  name: string
  role?: string
  department?: string
  level?: string
  color?: string            // Hex color code
  size?: number            // Node size
  x?: number              // 3D position (optional)
  y?: number
  z?: number
}
```

### Link Data Structure

```typescript
interface Link {
  source: string           // Node ID
  target: string          // Node ID
  type?: string           // Relationship type
  color?: string          // Hex color code
}
```

### Color Schemes

```typescript
// Department colors (built-in)
const departmentColors = {
  'Engineering': '#3B82F6',   // Blue
  'Product': '#10B981',       // Green  
  'Sales': '#F59E0B',         // Yellow
  'Marketing': '#EF4444'      // Red
}

// Relationship colors
const relationshipColors = {
  'reporting': '#DC2626',     // Red
  'collaboration': '#059669'   // Green
}
```

## 🛠️ Advanced Configuration

### Custom Graph Service

```typescript
import { GraphService } from '@/lib/graph'

class CustomGraphService extends GraphService {
  async loadCustomData() {
    // Your custom data loading logic
    const data = await fetchFromYourAPI()
    return this.transformData(data)
  }

  private transformData(rawData: any) {
    // Transform your data to Graph3D format
    return {
      nodes: rawData.entities.map(entity => ({
        id: entity.id,
        name: entity.displayName,
        color: this.getCustomColor(entity.type)
      })),
      links: rawData.relationships.map(rel => ({
        source: rel.from,
        target: rel.to,
        type: rel.relationshipType
      }))
    }
  }
}
```

### Error Handling

```typescript
const GraphWithErrorBoundary = () => {
  const [error, setError] = useState(null)

  const handleGraphError = (error: Error) => {
    console.error('Graph error:', error)
    setError(error.message)
  }

  if (error) {
    return (
      <div className="error-fallback">
        <h3>Graph visualization error</h3>
        <p>{error}</p>
        <button onClick={() => setError(null)}>Try again</button>
      </div>
    )
  }

  return <Graph3D data={graphData} />
}
```

## 🔍 Database Limits & Quotas

### Neo4j AuraDB (Free Tier)
- **Nodes**: 50,000
- **Relationships**: 200,000  
- **Storage**: 50MB
- **Daily Access**: Unlimited for development
- **Query Timeout**: 60 seconds

### RushDB (Check Current Limits)
- **Records**: Varies by plan
- **API Calls**: Rate limited
- **Daily Access**: Check documentation for current quotas
- **Storage**: Plan dependent

> **Recommendation**: Use Neo4j for data storage and complex queries, RushDB for visualization interface layer.

## 🐛 Troubleshooting

### Common Issues

#### "o.map is not a function" Error
```typescript
// Problem: RushDB returns DBRecordsArrayInstance, not regular array
// Solution: Cast as any to access array methods
const employees = employeesResult as any
const nodes = employees.map(emp => ({...}))
```

#### React Infinite Re-renders
```typescript
// Problem: Functions in useEffect dependencies cause re-renders
// Solution: Wrap functions in useCallback
const loadData = useCallback(async () => {
  // your code
}, [dependency1, dependency2])
```

#### 3D Graph Not Rendering
```typescript
// Problem: Data not in correct format
// Solution: Validate data structure
if (!data || !Array.isArray(data.nodes)) {
  return <div>Invalid graph data</div>
}
```

#### Database Connection Issues
```typescript
// Problem: Credentials or network issues
// Solution: Add connection testing
const testConnection = async () => {
  try {
    const status = await graphService.testConnections()
    console.log('Connection status:', status)
  } catch (error) {
    console.error('Connection failed:', error)
  }
}
```

## 📊 Performance Optimization

### Large Datasets
```typescript
// For > 1000 nodes, consider:
1. Pagination in data loading
2. Level-of-detail rendering
3. Node clustering
4. Virtual scrolling for lists

// Example implementation
const optimizedData = useMemo(() => {
  if (data.nodes.length > 1000) {
    return {
      nodes: data.nodes.slice(0, 100), // Show subset
      links: data.links.filter(link => 
        data.nodes.slice(0, 100).some(node => 
          node.id === link.source || node.id === link.target
        )
      )
    }
  }
  return data
}, [data])
```

### Memory Management
```typescript
// Clean up graph resources
useEffect(() => {
  return () => {
    graphService.disconnect()
  }
}, [])
```

## 🧪 Testing

### Unit Tests
```typescript
import { GraphService } from '@/lib/graph'

describe('Graph Service', () => {
  it('should initialize databases', async () => {
    const service = new GraphService()
    const result = await service.initializeAll(mockConfig)
    expect(result).toBe(true)
  })

  it('should transform data correctly', () => {
    const mockData = { /* test data */ }
    const result = service.transformData(mockData)
    expect(result.nodes).toHaveLength(mockData.length)
  })
})
```

### Integration Tests
```typescript
// Test with real databases
const integrationTest = async () => {
  await graphService.setupTechFlowTestData()
  const data = await graphService.getVisualizationData()
  expect(data.nodes.length).toBeGreaterThan(0)
}
```

## 📝 Module Checklist

When implementing in new projects:

- [ ] Install required dependencies
- [ ] Copy module files to correct locations  
- [ ] Configure database credentials
- [ ] Test basic graph rendering
- [ ] Customize colors and styling
- [ ] Add error handling
- [ ] Test with your data structure
- [ ] Performance test with larger datasets
- [ ] Add unit tests
- [ ] Document any customizations

## 🚀 Future Enhancements

Potential improvements for future versions:

1. **VR/AR Support** - Three.js WebXR integration
2. **Real-time Updates** - WebSocket data streaming
3. **Advanced Layouts** - Force-directed algorithms
4. **Export Features** - PNG/SVG export capabilities
5. **Performance** - WebGL optimization for large graphs
6. **Analytics** - Built-in network analysis tools

## 📖 References

- [Neo4j JavaScript Driver](https://neo4j.com/docs/api/javascript-driver/current/)
- [RushDB Documentation](https://docs.rushdb.com/)
- [react-force-graph-3d](https://github.com/vasturiano/react-force-graph-3d)
- [Three.js Documentation](https://threejs.org/docs/)

---

**Module Version**: 1.0.0  
**Compatibility**: Next.js 14+, React 18+  
**License**: MIT  
**Maintainer**: AI Career Platform Team