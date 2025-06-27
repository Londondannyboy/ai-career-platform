const { execSync } = require('child_process');
const fs = require('fs');

class GitHubAutomation {
  constructor() {
    this.repoUrl = 'https://github.com/Londondannyboy/ai-career-platform';
    this.appUrl = 'https://ai-career-platform.vercel.app';
  }

  async checkGitHubCLI() {
    try {
      const version = execSync('gh --version', { encoding: 'utf-8' });
      console.log('✅ GitHub CLI installed:', version.split('\n')[0]);
      return true;
    } catch (error) {
      console.log('❌ GitHub CLI not installed or not authenticated');
      console.log('   Install: brew install gh');
      console.log('   Authenticate: gh auth login');
      return false;
    }
  }

  async getRepoInfo() {
    try {
      const info = execSync('gh repo view --json name,description,url,updatedAt,pushedAt', { encoding: 'utf-8' });
      const repoData = JSON.parse(info);
      
      console.log('📊 Repository Information:');
      console.log(`   Name: ${repoData.name}`);
      console.log(`   Description: ${repoData.description || 'No description'}`);
      console.log(`   URL: ${repoData.url}`);
      console.log(`   Last updated: ${new Date(repoData.updatedAt).toLocaleString()}`);
      console.log(`   Last push: ${new Date(repoData.pushedAt).toLocaleString()}`);
      
      return repoData;
    } catch (error) {
      console.log('❌ Failed to get repo info:', error.message);
      return null;
    }
  }

  async checkDeploymentStatus() {
    try {
      // Check if there are any workflow runs
      const workflows = execSync('gh workflow list --json name,state', { encoding: 'utf-8' });
      const workflowData = JSON.parse(workflows);
      
      console.log('🚀 Deployment Status:');
      if (workflowData.length === 0) {
        console.log('   📝 No GitHub Actions workflows found');
        console.log('   💡 Vercel deployment appears to be via git integration');
      } else {
        workflowData.forEach(workflow => {
          console.log(`   ${workflow.name}: ${workflow.state}`);
        });
      }
      
      return workflowData;
    } catch (error) {
      console.log('⚠️ Could not check workflow status:', error.message);
      return [];
    }
  }

  async createIssueTemplate() {
    const template = `---
name: Bug Report
about: Create a report to help us improve the AI Career Platform
title: '[BUG] '
labels: bug
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- Browser: [e.g. Chrome, Safari]
- Device: [e.g. Desktop, iPhone]
- Voice recognition: [Working/Not working]

**Feature Context:**
- [ ] LinkedIn Authentication
- [ ] Voice Coaching
- [ ] Profile Management
- [ ] Repo Sessions
- [ ] Navigation
- [ ] Mobile/Responsive

**Additional context**
Add any other context about the problem here.
`;

    const templateDir = '.github/ISSUE_TEMPLATE';
    const templatePath = `${templateDir}/bug_report.md`;

    try {
      if (!fs.existsSync('.github')) {
        fs.mkdirSync('.github');
      }
      if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir);
      }
      
      fs.writeFileSync(templatePath, template);
      console.log('✅ Created GitHub issue template:', templatePath);
      return templatePath;
    } catch (error) {
      console.log('❌ Failed to create issue template:', error.message);
      return null;
    }
  }

  async createFeatureTemplate() {
    const template = `---
name: Feature Request
about: Suggest an idea for the AI Career Platform
title: '[FEATURE] '
labels: enhancement
assignees: ''

---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Feature Category:**
- [ ] Voice/AI Features
- [ ] Networking
- [ ] Job Search
- [ ] Profile Management
- [ ] User Experience
- [ ] Performance
- [ ] Security

**Implementation Ideas:**
- Technical approach ideas
- API integrations needed
- UI/UX considerations

**Additional context**
Add any other context or screenshots about the feature request here.
`;

    const templatePath = '.github/ISSUE_TEMPLATE/feature_request.md';
    
    try {
      fs.writeFileSync(templatePath, template);
      console.log('✅ Created feature request template:', templatePath);
      return templatePath;
    } catch (error) {
      console.log('❌ Failed to create feature template:', error.message);
      return null;
    }
  }

  async createPullRequestTemplate() {
    const template = `## 🎯 Description
Brief description of the changes in this PR.

## 🔄 Changes Made
- [ ] New feature implementation
- [ ] Bug fix
- [ ] Performance improvement
- [ ] UI/UX enhancement
- [ ] Documentation update
- [ ] Testing improvements

## 🧪 Testing
- [ ] Manual testing completed
- [ ] Automated tests pass
- [ ] Voice features tested (if applicable)
- [ ] Mobile responsive checked
- [ ] Cross-browser compatibility verified

## 📸 Screenshots
If applicable, add screenshots to demonstrate the changes.

## 🔗 Related Issues
Closes #(issue number)

## 📋 Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Changes tested locally
- [ ] Documentation updated (if needed)
- [ ] No breaking changes (or clearly documented)

## 🚀 Deployment Notes
Any special considerations for deployment or environment variables.
`;

    const templatePath = '.github/pull_request_template.md';
    
    try {
      fs.writeFileSync(templatePath, template);
      console.log('✅ Created pull request template:', templatePath);
      return templatePath;
    } catch (error) {
      console.log('❌ Failed to create PR template:', error.message);
      return null;
    }
  }

  async createHealthCheckWorkflow() {
    const workflow = `name: Health Check

on:
  schedule:
    # Run every hour
    - cron: '0 * * * *'
  workflow_dispatch:
    # Allow manual trigger

jobs:
  health-check:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run health check
      run: npm run test:quick
      
    - name: Create issue on failure
      if: failure()
      uses: actions/github-script@v7
      with:
        script: |
          github.rest.issues.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: 'Health Check Failed - ' + new Date().toISOString(),
            body: 'The automated health check failed. Please investigate the application status.',
            labels: ['bug', 'urgent', 'automated']
          })
`;

    const workflowDir = '.github/workflows';
    const workflowPath = `${workflowDir}/health-check.yml`;
    
    try {
      if (!fs.existsSync(workflowDir)) {
        fs.mkdirSync(workflowDir, { recursive: true });
      }
      
      fs.writeFileSync(workflowPath, workflow);
      console.log('✅ Created health check workflow:', workflowPath);
      return workflowPath;
    } catch (error) {
      console.log('❌ Failed to create workflow:', error.message);
      return null;
    }
  }

  async generateProjectReport() {
    console.log('📊 Generating Project Report...\n');
    
    const report = {
      timestamp: new Date().toISOString(),
      repository: this.repoUrl,
      application: this.appUrl,
      sections: {}
    };

    // GitHub CLI check
    report.sections.githubCli = await this.checkGitHubCLI();
    
    // Repository info
    report.sections.repository = await this.getRepoInfo();
    
    // Deployment status
    report.sections.deployment = await this.checkDeploymentStatus();
    
    // Check current status
    try {
      const quickCheck = require('./quick-check');
      console.log('\n🔍 Running application health check...');
      await quickCheck();
      report.sections.healthCheck = 'passed';
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
      report.sections.healthCheck = 'failed';
    }

    return report;
  }

  async setupAutomation() {
    console.log('🔧 Setting up GitHub Automation...\n');
    
    // Create templates and workflows
    await this.createIssueTemplate();
    await this.createFeatureTemplate();
    await this.createPullRequestTemplate();
    await this.createHealthCheckWorkflow();
    
    console.log('\n✅ GitHub automation setup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. git add .github/');
    console.log('2. git commit -m "Add GitHub automation templates and workflows"');
    console.log('3. git push');
    console.log('\n🎯 Features added:');
    console.log('- Issue templates for bugs and features');
    console.log('- Pull request template');
    console.log('- Automated health check workflow');
  }
}

// Run automation setup
if (require.main === module) {
  const automation = new GitHubAutomation();
  
  if (process.argv[2] === 'setup') {
    automation.setupAutomation();
  } else if (process.argv[2] === 'report') {
    automation.generateProjectReport()
      .then(report => {
        console.log('\n📋 PROJECT REPORT');
        console.log('=================');
        console.log(JSON.stringify(report, null, 2));
      });
  } else {
    console.log('Usage:');
    console.log('  node github-automation.js setup   # Set up automation');
    console.log('  node github-automation.js report  # Generate report');
  }
}

module.exports = GitHubAutomation;