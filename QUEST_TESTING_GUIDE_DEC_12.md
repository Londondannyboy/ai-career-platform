# Quest Testing Guide - December 12, 2025
## Testing Recent Features

### 🧪 Quick Testing Checklist

#### 1. **Data Migration Testing**
**Path**: `/repo/edit`

- [ ] Create a test account with no data
- [ ] Add skills as simple strings via API/console
- [ ] Load `/repo/edit` and verify automatic conversion to rich objects
- [ ] Check that skills now have proficiency levels
- [ ] Verify experiences show impact metric fields

#### 2. **Skill Relationships & Learning Paths**
**Path**: `/profile/[username]` → Skills tab

- [ ] View skill relationship graph (3D visualization)
- [ ] Check cluster analysis shows percentage coverage
- [ ] Click on skill nodes to see details
- [ ] Test learning path generator:
  - Enter "Machine Learning" as target skill
  - Verify prerequisites shown (e.g., Python, Statistics)
  - Check time estimates and difficulty ratings

#### 3. **Career Recommendations**
**Path**: `/profile/[username]` → AI Insights tab

- [ ] View career analysis overview
- [ ] Check career velocity calculation
- [ ] Review 5 types of recommendations:
  - Next role progression
  - Skill gaps
  - Lateral moves
  - Leadership paths
  - Specializations
- [ ] Click recommendation cards for detailed action plans
- [ ] Verify confidence scores are reasonable

#### 4. **Rich Data Entry Forms**
**Path**: `/repo/edit`

- [ ] **Experience Entry**:
  - Add new experience with impact metrics
  - Enter team size and direct reports
  - Add multiple impact items with metrics
  - Test technology/methodology tags
  
- [ ] **Education Entry**:
  - Start typing "Harvard" - verify autocomplete
  - Add achievements and coursework
  - Check institution normalization
  
- [ ] **Skill Entry**:
  - Add skill with proficiency level
  - Set years of experience
  - Toggle "actively using"
  - Verify custom skills allowed

#### 5. **Career Trajectory Visualization**
**Path**: `/visualization/3d/career-trajectory`

- [ ] View timeline of experiences
- [ ] Check education nodes below timeline
- [ ] Verify skill nodes clustered by proficiency
- [ ] Look for future experience nodes (amber color)
- [ ] Click nodes for detailed information

### 📝 Test Data Scenarios

#### Scenario 1: New Graduate
```javascript
{
  experiences: [],
  education: [{
    institution: "MIT",
    degree: "BS",
    field: "Computer Science",
    endDate: "2025-05"
  }],
  skills: [
    { name: "Python", proficiency: "intermediate" },
    { name: "JavaScript", proficiency: "beginner" }
  ]
}
```
**Expected**: Entry-level recommendations, strong learning paths

#### Scenario 2: Mid-Career Professional
```javascript
{
  experiences: [{
    title: "Senior Software Engineer",
    company: "Tech Corp",
    current: true,
    teamSize: 8,
    impact: [
      { description: "Reduced API latency", metric: "40%" }
    ]
  }],
  skills: [
    { name: "React", proficiency: "expert" },
    { name: "Node.js", proficiency: "advanced" },
    { name: "Leadership", proficiency: "intermediate" }
  ]
}
```
**Expected**: Staff/Management recommendations, specialization options

#### Scenario 3: Career Changer
```javascript
{
  experiences: [{
    title: "Marketing Manager",
    company: "Corp Inc",
    current: true
  }],
  futureExperiences: [{
    title: "Product Manager",
    company: "Target Tech Company"
  }],
  skills: [
    { name: "Marketing", proficiency: "expert" },
    { name: "Data Analysis", proficiency: "beginner" }
  ]
}
```
**Expected**: Lateral move recommendations, skill gap analysis

### 🐛 Known Issues to Test

1. **Skill Normalization**
   - Test variations: "JS" → "JavaScript"
   - Custom skills should remain as entered
   - Check duplicates are prevented

2. **Experience Impact Metrics**
   - Metrics should save with both description and value
   - Empty metrics shouldn't create errors

3. **Career Velocity**
   - Should handle profiles with gaps in employment
   - First job should calculate correctly

4. **3D Visualizations**
   - Should handle empty data gracefully
   - Performance with 50+ skills

### 🔧 Debug Commands

```bash
# Check database for rich data
psql $DATABASE_URL -c "SELECT user_id, surface_repo_data->'skills' FROM user_profiles LIMIT 1;"

# Test data migration manually
curl -X GET http://localhost:3000/api/deep-repo \
  -H "X-User-Id: test-user-id"

# Force re-render of visualizations
localStorage.clear()
window.location.reload()
```

### 📊 Performance Benchmarks

- Page load: < 2 seconds
- 3D visualization render: < 3 seconds
- Skill search autocomplete: < 100ms
- Career recommendation generation: < 1 second

### ✅ Sign-off Checklist

- [ ] All form inputs save correctly
- [ ] Data persists between sessions
- [ ] Visualizations load without errors
- [ ] AI recommendations are relevant
- [ ] No TypeScript errors in console
- [ ] Mobile responsive (basic functionality)

---

**Note**: Test with both new and existing accounts to verify migration works correctly.