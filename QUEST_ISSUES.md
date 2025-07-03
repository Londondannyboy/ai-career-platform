# Outstanding Issues for Company Repository

## 🚨 **CRITICAL UX FIXES NEEDED**

### 1. **Main Dashboard Navigation**
- [ ] Add "Company Repository" card to main dashboard (`/`)
- [ ] Link to `/admin/companies` instead of old enrichment page
- [ ] Remove or rename old "Company Enrichment" to "Enrich New Company"
- [ ] Make Company Repository the primary entry point

### 2. **Company Links & Access**
- [ ] Add "View Company" buttons to company cards in repository
- [ ] Direct navigation from company search results to individual pages
- [ ] Breadcrumb navigation between repository and individual companies
- [ ] Quick access to previously enriched companies

### 3. **Visualization Issues**
- [ ] CK Delta still showing old visualization (needs re-enrichment)
- [ ] New relationship mapping not visible (requires fresh HarvestAPI call)
- [ ] Enhanced network connections not displaying
- [ ] Skills heat maps not showing up
- [ ] Education networks missing
- [ ] Experience analysis visualizations absent

### 4. **Individual Employee Drill-Down**
- [ ] Create `/employee/[id]` pages for individual profiles
- [ ] Personal network graphs when clicking on employees
- [ ] Show all scraped HarvestAPI data per person
- [ ] Employee recommendations and connections visualization
- [ ] Skills, education, experience detail views

## 🔧 **TECHNICAL ISSUES**

### 5. **Database & Caching**
- [ ] Investigate why companies not showing in admin dashboard
- [ ] Test 1-month caching implementation
- [ ] Verify auto-table creation in production
- [ ] Debug missing company data issue

### 6. **AI Query System**
- [ ] Test intelligent queries in production
- [ ] Verify company-specific filtering works
- [ ] Ensure intent analysis and recommendations display
- [ ] Test natural language processing accuracy

### 7. **Data Visualizations Not Deploying**
- [ ] Skills heat maps with color coding
- [ ] Education alumni networks
- [ ] Previous company experience overlaps
- [ ] Network intelligence dashboards
- [ ] Most connected people analysis

## 📊 **MISSING FEATURES TO IMPLEMENT**

### 8. **Enhanced Company Pages**
- [ ] Deploy individual company intelligence pages
- [ ] Company-specific AI query panels
- [ ] Rich data visualization tabs (skills, education, experience, network)
- [ ] Interactive network graphs with relationship edges

### 9. **Network Expansion Strategy**
- [ ] Auto-discovery of external companies from recommendations
- [ ] Smart expansion with cost controls
- [ ] Introduction pathway mapping
- [ ] External company enrichment suggestions

### 10. **Administration & Monitoring**
- [ ] Cost tracking and usage analytics
- [ ] Admin refresh controls testing
- [ ] Cache hit/miss monitoring
- [ ] API usage dashboards

## 🎯 **USER EXPERIENCE PRIORITIES**

1. **Primary**: Fix main dashboard navigation to Company Repository
2. **Critical**: Re-enrich CK Delta to show new relationship features
3. **Important**: Deploy individual company pages with visualizations
4. **Essential**: Build employee drill-down personal network pages
5. **Nice-to-have**: Test complete intelligent query system end-to-end