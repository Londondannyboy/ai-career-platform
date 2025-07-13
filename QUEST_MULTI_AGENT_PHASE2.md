# Quest Multi-Agent System - Phase 2 Implementation Plan

## Current Issues (December 2024)

### 1. Agent Handover Not Triggering
- **Problem**: Users saying "I need to organize tasks" doesn't trigger handover
- **Root Cause**: High confidence thresholds (0.8+) and complex GPT-4 analysis
- **Solution**: Lower thresholds and add simple keyword triggers as primary detection

### 2. Skill Detection Failures
- **Problem**: "I'm skilled in JavaScript" not detected as skill
- **Root Cause**: AI detection endpoint may be failing or timing out
- **Solution**: Add fallback detection and debug AI endpoint

### 3. No Visual Agent Presence
- **Problem**: No indication of available agents or their relevance
- **Solution**: Animated agent sidebar with relevance indicators

## Phase 2: Visual Agent Sidebar

### Design Concept
```
┌─────────────────────────────────────┐
│  QUEST CONVERSATION                 │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │   Main Conversation Area       │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│  AGENT SIDEBAR →                   │
│  ┌─────────────┐                   │
│  │ 👤 Quest    │ ← Active (glowing) │
│  │ ⚡ Tasks    │ ← Pulsing (relevant)│
│  │ 🎯 Goals    │ ← Dimmed          │
│  │ 📅 Calendar │ ← Dimmed          │
│  │ 📚 Learning │ ← Dimmed          │
│  └─────────────┘                   │
└─────────────────────────────────────┘
```

### Agent Visual States
1. **Active** (current agent)
   - Glowing border
   - Full opacity
   - Larger icon

2. **Relevant** (should handover)
   - Pulsing animation
   - Relevance percentage shown
   - Click to request handover

3. **Available** (can switch)
   - Normal appearance
   - Hover shows capabilities

4. **Dormant** (not relevant)
   - Reduced opacity
   - Smaller size

### Implementation Components

#### 1. AgentSidebar Component
```typescript
interface AgentState {
  agentId: string
  name: string
  icon: string
  relevance: number // 0-100
  status: 'active' | 'relevant' | 'available' | 'dormant'
  pulseIntensity: number
  lastTriggerWords: string[]
}
```

#### 2. Real-time Relevance Monitoring
- Background analysis of every message
- Update relevance scores without blocking UI
- Visual feedback immediate, handover suggestion delayed

#### 3. Agent Animations
- **Pulse Effect**: CSS animation for relevant agents
- **Glow Effect**: Active agent indication
- **Hover States**: Show agent capabilities
- **Click Actions**: Manual handover request

## Fixes Required

### 1. Lower Handover Thresholds
```typescript
// Current: confidenceThreshold: 0.8
// Change to: confidenceThreshold: 0.5

// Add simple triggers
const INSTANT_TRIGGERS = {
  productivity: ['todo', 'task list', 'organize tasks'],
  goal: ['set goals', 'objectives', 'OKR'],
  calendar: ['schedule', 'meeting', 'appointment']
}
```

### 2. Fix Skill Detection
```typescript
// Add pattern for "I'm skilled in X"
/\b(I'm skilled in|I know|I'm good at|I have experience with)\s+(\w+)/gi

// Ensure AI endpoint has timeout and fallback
const detectWithTimeout = Promise.race([
  aiDetection(message),
  new Promise(resolve => setTimeout(() => resolve(null), 2000))
])
```

### 3. Visual Agent Sidebar
```typescript
// AgentSidebar.tsx
- Real-time relevance calculation
- Smooth animations for state changes
- Click handlers for manual handover
- Tooltips showing capabilities
```

## Test Scenarios

### 1. Productivity Agent Test
- User: "I need to create a todo list"
- Expected: Productivity agent pulses, suggests handover
- User: "organize my tasks for the week"
- Expected: Immediate handover suggestion

### 2. Skill Detection Test
- User: "I'm skilled in JavaScript"
- Expected: Skill confirmation for JavaScript
- User: "I know Python and marketing"
- Expected: Two skill confirmations

### 3. Goal Agent Test
- User: "I want to set some career goals"
- Expected: Goal agent pulses
- User: "My objective is to become a VP"
- Expected: Goal agent handover suggestion

### 4. Multi-Agent Flow Test
- Start with Quest
- Mention tasks → Productivity agent
- Complete tasks → Auto handback to Quest
- Mention goals → Goal agent suggestion

## Database Considerations

### Agent Activity Tracking
```sql
CREATE TABLE agent_interactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  agent_id TEXT,
  handover_from TEXT,
  handover_to TEXT,
  reason TEXT,
  confidence FLOAT,
  accepted BOOLEAN,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Relevance Learning
- Track which handovers users accept/reject
- Improve relevance scoring over time
- Personalize agent suggestions per user

## Next Session Tasks

1. **Create AgentSidebar component** with animations
2. **Lower detection thresholds** for easier triggering
3. **Fix skill detection** patterns and AI timeout
4. **Add visual relevance indicators**
5. **Implement smooth handover animations**
6. **Create comprehensive test suite**

## Success Metrics

- Agent handovers trigger on first relevant mention
- Skill detection works for natural phrases
- Visual feedback within 100ms of typing
- Users understand which agent is active
- Smooth transitions between agents

## Notes for Next Session

The multi-agent system is architecturally sound but needs:
- Better visual communication
- Lower triggering thresholds  
- More responsive detection
- Animated agent presence

Focus on making agents feel "alive" and responsive to conversation context.

---

*Created: December 2024*
*Status: Ready for Phase 2 implementation*
*Priority: Visual agent sidebar and detection fixes*