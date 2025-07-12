# 🧪 Simple Manual Testing Checklist

Just open your browser to http://localhost:3000 and click through these tests manually. Check each box as you go!

## 📝 Data Enrichment Tests

### Test 1: Rich Experience Form
1. [ ] Go to `/repo/edit`
2. [ ] Click "Experience" tab
3. [ ] Click "Add Experience"
4. [ ] Check that you see:
   - [ ] Team Size field
   - [ ] Direct Reports field
   - [ ] Impact & Achievements section
   - [ ] Technologies field
   - [ ] Methodologies field
5. [ ] Fill out the form:
   - Title: "Senior Software Engineer"
   - Company: "Test Corp"
   - Team Size: 10
   - Click "Add Impact"
   - Impact: "Reduced load time by 50%"
6. [ ] Click Save
7. [ ] Refresh the page
8. [ ] Check data is still there

### Test 2: Enhanced Skills
1. [ ] In `/repo/edit`, click "Skills" tab
2. [ ] Click "Add Skill"
3. [ ] Check that you see:
   - [ ] Proficiency dropdown (Beginner/Intermediate/Advanced/Expert)
   - [ ] Years of Experience field
   - [ ] "Actively Using" checkbox
4. [ ] Add skill "React" as "Expert" with "5" years
5. [ ] Save and refresh
6. [ ] Verify it saved correctly

### Test 3: Education with Achievements
1. [ ] In `/repo/edit`, click "Education" tab
2. [ ] Click "Add Education"
3. [ ] Start typing "Harv" in Institution field
4. [ ] Check if "Harvard University" appears as suggestion
5. [ ] Add an achievement
6. [ ] Save and verify

## 🔗 Skill Relationships Tests

### Test 4: Skill Visualization
1. [ ] Go to `/profile/[your-username]`
2. [ ] Click "Skills" tab
3. [ ] Look for "Skill Relationships" section
4. [ ] Check if you see a 3D graph (might take a moment to load)
5. [ ] Try clicking and dragging to rotate
6. [ ] Click on a skill node - should show details

### Test 5: Learning Paths
1. [ ] Still in Skills tab, find "Generate Learning Path" button
2. [ ] Click it
3. [ ] Enter "Machine Learning" as target skill
4. [ ] Click "Generate Path"
5. [ ] Check if it shows prerequisites like "Python" and "Statistics"

## 🎯 Career Recommendations Tests

### Test 6: AI Insights
1. [ ] In your profile, click "AI Insights" tab
2. [ ] Check if you see:
   - [ ] Career Analysis section
   - [ ] Career Velocity metric
   - [ ] 5 recommendation cards
3. [ ] Click on "Next Role Progression"
4. [ ] Check if it shows:
   - [ ] Suggested next role
   - [ ] Timeline estimate
   - [ ] Required skills
   - [ ] Action items

### Test 7: Career Trajectory
1. [ ] Go to `/visualization/3d/career-trajectory`
2. [ ] Wait for it to load (can take 5-10 seconds)
3. [ ] Check if you see:
   - [ ] Timeline with your experiences
   - [ ] Education nodes below
   - [ ] Skills clustered by proficiency
4. [ ] Try rotating the view

## ✅ Quick Functionality Checks

### Data Persistence
1. [ ] Make a change in `/repo/edit`
2. [ ] Open the same page in an incognito window
3. [ ] Log in with the same account
4. [ ] Check if your changes are there

### Error Handling
1. [ ] Try saving an empty experience form
2. [ ] Should show validation errors
3. [ ] Try adding a skill with no name
4. [ ] Should prevent saving

## 🚨 Common Issues to Check

1. **If 3D visualizations don't load:**
   - [ ] Wait 10 seconds (they load dynamically)
   - [ ] Check browser console for errors (F12)
   - [ ] Try refreshing the page

2. **If data doesn't save:**
   - [ ] Check you're logged in
   - [ ] Check browser console for API errors
   - [ ] Try logging out and back in

3. **If AI features don't work:**
   - [ ] Make sure you have at least 2-3 experiences added
   - [ ] Add a variety of skills
   - [ ] The AI needs data to work with

## 📊 Testing Status

- Date Tested: ________________
- Tested By: ________________
- All Tests Passed: Yes [ ] No [ ]
- Issues Found: ________________

---

**That's it!** Just work through this checklist in your browser. Much simpler than automated tests! 

If you find issues, note them down and we can fix them one by one.