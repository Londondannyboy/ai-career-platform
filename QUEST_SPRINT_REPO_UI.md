# Quest Sprint: Personal Repo UI Implementation

## Sprint Overview

Build the Personal Repository UI system in small, deployable chunks. Each chunk represents a complete feature that can be tested and deployed independently.

**Sprint Duration**: 5-7 days  
**Deployment Strategy**: One clean commit and deploy per chunk  
**Error Handling**: Fix immediately before moving to next chunk

## Implementation Chunks

### Chunk 1: Surface Repo - Work Experience UI (4-6 hours)

**Objective**: Create comprehensive work experience management with future aspirations

**Files to Create/Modify**:
- `/src/components/repo/WorkExperienceForm.tsx` (new)
- `/src/app/repo/surface/edit/page.tsx` (enhance existing)
- `/src/types/repo-extensions.ts` (new - for future experience types)

**Features**:
```typescript
interface WorkExperienceWithFuture extends WorkExperience {
  isFuture?: boolean; // Flag for aspirational roles
  targetDate?: string; // When user aims to achieve this
  whyThisRole?: string; // Connection to personal Trinity
  requiredSteps?: string[]; // What's needed to get there
}
```

- Add/Edit/Delete work experiences
- Toggle between "Past/Current" and "Future Aspiration"
- Rich text editor for descriptions
- Achievement bullets with dynamic add/remove
- Date validation (future dates only for aspirations)
- Auto-save on field blur

**Validation**:
- End date must be after start date
- Future experiences require target date
- At least one achievement per experience
- Company and title required

**Commit Message**: `feat(repo): Add work experience UI with future aspirations`

---

### Chunk 2: Surface Repo - Skills & Languages (3-4 hours)

**Objective**: Intuitive skill and language management

**Files to Create**:
- `/src/components/repo/SkillsEditor.tsx`
- `/src/components/repo/LanguageSelector.tsx`
- `/src/lib/repo/skillCategories.ts` (predefined categories)

**Features**:

```typescript
interface SkillWithMetadata {
  name: string;
  category: 'Technical' | 'Business' | 'Creative' | 'Leadership';
  endorsements?: number;
  lastUsed?: string; // Link to experience where used
}
```

- Tag-style skill input (press Enter to add)
- Skill categories with color coding
- Drag to reorder skills by priority
- Language proficiency levels
- Bulk operations (import from LinkedIn format)
- Suggested skills based on role

**UX Details**:
- Autocomplete from common skills database
- Visual feedback on add/remove
- Maximum 50 skills (LinkedIn parity)
- Sort by: alphabetical, category, endorsements

**Commit Message**: `feat(repo): Add skills and languages editor components`

---

### Chunk 3: Surface Repo - Education & Certifications (3-4 hours)

**Objective**: Comprehensive education and certification tracking

**Files to Create**:
- `/src/components/repo/EducationForm.tsx`
- `/src/components/repo/CertificationForm.tsx`
- `/src/lib/repo/educationValidation.ts`

**Features**:

```typescript
interface CertificationWithPlanning {
  // ... existing fields ...
  isPlanned?: boolean; // Future certification
  targetDate?: string;
  studyPlan?: string;
  linkedToGoal?: string; // OKR reference
}
```

- Multiple education entries
- Certification with expiry tracking
- Future certifications planning
- Credential ID with verification link
- GPA optional/hideable
- Honors and achievements

**Smart Features**:
- Expiry date warnings (30/60/90 days)
- Link certifications to skills auto-add
- Popular certifications dropdown
- Study plan for future certs

**Commit Message**: `feat(repo): Add education and certification management`

---

### Chunk 4: Personal Repo - OKR System (4-5 hours)

**Objective**: Professional OKR management with progress tracking

**Files to Create**:
- `/src/app/repo/personal/okr/page.tsx`
- `/src/components/repo/OKREditor.tsx`
- `/src/lib/repo/okrService.ts`
- `/api/deep-repo/personal/okr/route.ts`

**Features**:

```typescript
interface ProfessionalOKR {
  objective: string;
  timeframe: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual';
  year: number;
  keyResults: {
    id: string;
    description: string;
    targetValue: number;
    currentValue: number;
    unit: string; // %, count, currency
    status: 'on-track' | 'at-risk' | 'achieved' | 'missed';
  }[];
  linkedToAspiration?: string; // Future role connection
  visibility: 'private' | 'coach' | 'mentor' | 'accountability';
}
```

- Create objectives with 3-5 key results
- Progress bars with color coding
- Quarterly reviews and rollover
- Link to future aspirations
- Check-in reminders setup
- Historical OKR viewing

**Business Logic**:
- Auto-calculate objective progress from KRs
- Suggest KRs based on objective
- Template library (common OKRs)
- Export to PDF for reviews

**Commit Message**: `feat(repo): Add OKR management system`

---

### Chunk 5: Personal Repo - Goals & Tasks (3-4 hours)

**Objective**: Strategic goal setting with task breakdown

**Files to Create**:
- `/src/components/repo/GoalsTasksEditor.tsx`
- `/src/lib/repo/taskCategorization.ts`

**Features**:

```typescript
interface StrategicGoal {
  title: string;
  description: string;
  category: 'Career' | 'Skill' | 'Network' | 'Personal Brand';
  priority: 'Must Have' | 'Should Have' | 'Nice to Have';
  deadline: string;
  tasks: {
    id: string;
    title: string;
    type: 'Admin' | 'Technical' | 'Strategic' | 'Creative';
    estimatedHours: number;
    status: 'todo' | 'in-progress' | 'done';
    linkedToKR?: string; // OKR Key Result reference
  }[];
  outcome: string; // What success looks like
}
```

- Goal creation with SMART criteria
- Task breakdown with time estimates
- Categorization for reporting
- Progress visualization
- Bulk task operations
- Goal templates

**AI Preparation** (for future):
- Task type hints for AI categorization
- Time estimate patterns for AI learning
- Outcome measurement criteria

**Commit Message**: `feat(repo): Add goals and task management`

---

### Chunk 6: Data Relationships & Navigation (2-3 hours)

**Objective**: Connect all repo components with smart navigation

**Files to Create**:
- `/src/components/repo/RepoNavigation.tsx`
- `/src/lib/repo/relationshipService.ts`
- `/src/components/repo/ProfileCompleteness.tsx`

**Features**:
- Tab navigation with completion indicators
- Cross-reference UI (skills ↔ experiences)
- Data integrity validation
- Profile completeness score
- Quick actions menu
- Relationship visualizer preview

**Relationship Examples**:
- Skills used in specific experiences
- Certifications supporting future roles
- OKRs connected to aspirations
- Goals supporting key results

**Commit Message**: `feat(repo): Add navigation and data relationships`

---

## Technical Standards

### State Management
- React hooks for local state
- Context for cross-component state
- Persist to localStorage during edit
- Save to database on explicit save

### Form Validation
```typescript
// Zod schemas for each form
const workExperienceSchema = z.object({
  title: z.string().min(2).max(100),
  company: z.string().min(2).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isCurrent: z.boolean(),
  achievements: z.array(z.string()).min(1).max(10)
});
```

### Error Handling
- Toast notifications for all operations
- Inline validation messages
- Network error recovery
- Unsaved changes warning

### Performance
- Debounced auto-save (2 seconds)
- Optimistic UI updates
- Lazy load heavy components
- Virtual scrolling for long lists

## Success Metrics

Each chunk is complete when:
1. ✅ All features implemented and working
2. ✅ TypeScript compilation passes
3. ✅ Manual testing passes
4. ✅ Deployed to production
5. ✅ No console errors
6. ✅ Mobile responsive

## Next Phase Preview

After UI completion:
1. AI skill categorization and suggestions
2. Career path visualization
3. Skills gap analysis
4. Network effect calculations
5. Achievement verification system

---

**Created**: December 10, 2025  
**Sprint Start**: Immediately after documentation push  
**Estimated Completion**: December 15-17, 2025