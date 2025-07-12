#!/usr/bin/env node

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

interface TestResult {
  suite: string
  passed: number
  failed: number
  duration: number
  failures: string[]
}

class FeatureTestRunner {
  private results: TestResult[] = []
  
  async runTests() {
    console.log(`${colors.cyan}${colors.bright}🧪 Quest Feature Test Suite${colors.reset}`)
    console.log(`${colors.cyan}=========================${colors.reset}\n`)
    
    const testSuites = [
      {
        name: 'Data Enrichment',
        file: 'data-enrichment.spec.ts',
        description: 'Testing rich data objects, migration, and forms'
      },
      {
        name: 'Skill Relationships',
        file: 'skill-relationships.spec.ts',
        description: 'Testing 3D visualization, learning paths, and clustering'
      },
      {
        name: 'Career Recommendations',
        file: 'career-recommendations.spec.ts',
        description: 'Testing AI insights and career analysis'
      }
    ]
    
    // Check if tests exist
    for (const suite of testSuites) {
      const testPath = path.join(__dirname, suite.file)
      try {
        await fs.access(testPath)
      } catch {
        console.log(`${colors.yellow}⚠️  Test file not found: ${suite.file}${colors.reset}`)
        continue
      }
      
      console.log(`${colors.blue}📋 ${suite.name}${colors.reset}`)
      console.log(`   ${colors.bright}${suite.description}${colors.reset}`)
      
      const result = await this.runTestSuite(suite.file)
      this.results.push({ ...result, suite: suite.name })
      
      if (result.failed > 0) {
        console.log(`   ${colors.red}❌ ${result.failed} failed${colors.reset}`)
      }
      if (result.passed > 0) {
        console.log(`   ${colors.green}✅ ${result.passed} passed${colors.reset}`)
      }
      console.log(`   ⏱️  ${result.duration}s\n`)
    }
    
    await this.generateReport()
  }
  
  private runTestSuite(testFile: string): Promise<TestResult> {
    return new Promise((resolve) => {
      const startTime = Date.now()
      const result: TestResult = {
        suite: testFile,
        passed: 0,
        failed: 0,
        duration: 0,
        failures: []
      }
      
      const playwright = spawn('npx', [
        'playwright',
        'test',
        testFile,
        '--reporter=json'
      ], {
        cwd: __dirname,
        env: { ...process.env, CI: 'true' }
      })
      
      let output = ''
      
      playwright.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      playwright.stderr.on('data', (data) => {
        console.error(`   ${colors.red}Error: ${data.toString()}${colors.reset}`)
      })
      
      playwright.on('close', (code) => {
        result.duration = Math.round((Date.now() - startTime) / 1000)
        
        try {
          // Parse JSON output if available
          const jsonMatch = output.match(/\{[\s\S]*\}/m)
          if (jsonMatch) {
            const testData = JSON.parse(jsonMatch[0])
            result.passed = testData.stats?.passed || 0
            result.failed = testData.stats?.failed || 0
            
            if (testData.failures) {
              result.failures = testData.failures.map((f: any) => f.title)
            }
          }
        } catch (e) {
          // Fallback to simple parsing
          const passMatch = output.match(/(\d+) passed/)
          const failMatch = output.match(/(\d+) failed/)
          
          if (passMatch) result.passed = parseInt(passMatch[1])
          if (failMatch) result.failed = parseInt(failMatch[1])
        }
        
        resolve(result)
      })
    })
  }
  
  private async generateReport() {
    console.log(`${colors.bright}${colors.cyan}📊 Test Summary${colors.reset}`)
    console.log(`${colors.cyan}===============${colors.reset}\n`)
    
    let totalPassed = 0
    let totalFailed = 0
    let totalDuration = 0
    
    for (const result of this.results) {
      totalPassed += result.passed
      totalFailed += result.failed
      totalDuration += result.duration
      
      const status = result.failed === 0 ? 
        `${colors.green}PASS${colors.reset}` : 
        `${colors.red}FAIL${colors.reset}`
      
      console.log(`${status} ${result.suite}`)
      console.log(`     Passed: ${result.passed}, Failed: ${result.failed}, Duration: ${result.duration}s`)
      
      if (result.failures.length > 0) {
        console.log(`     Failures:`)
        result.failures.forEach(failure => {
          console.log(`       - ${colors.red}${failure}${colors.reset}`)
        })
      }
      console.log()
    }
    
    console.log(`${colors.bright}Total:${colors.reset}`)
    console.log(`  Tests run: ${totalPassed + totalFailed}`)
    console.log(`  ${colors.green}Passed: ${totalPassed}${colors.reset}`)
    console.log(`  ${colors.red}Failed: ${totalFailed}${colors.reset}`)
    console.log(`  Duration: ${totalDuration}s\n`)
    
    // Generate HTML report
    await this.generateHTMLReport()
    
    // Generate recommendations
    if (totalFailed > 0) {
      console.log(`${colors.yellow}${colors.bright}⚠️  Recommendations:${colors.reset}`)
      console.log(`${colors.yellow}1. Check if the dev server is running (npm run dev)`)
      console.log(`2. Ensure all environment variables are set`)
      console.log(`3. Check authentication is properly mocked`)
      console.log(`4. Review failed test screenshots in tests/test-results/${colors.reset}\n`)
    } else {
      console.log(`${colors.green}${colors.bright}✨ All tests passed! Great job!${colors.reset}\n`)
    }
  }
  
  private async generateHTMLReport() {
    const reportPath = path.join(__dirname, 'test-report.html')
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Quest Feature Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .suite {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .suite.passed { border-left: 4px solid #10b981; }
    .suite.failed { border-left: 4px solid #ef4444; }
    .stats {
      display: flex;
      gap: 20px;
      margin-top: 10px;
    }
    .stat {
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 14px;
    }
    .stat.passed { background: #d1fae5; color: #065f46; }
    .stat.failed { background: #fee2e2; color: #991b1b; }
    .stat.duration { background: #e0e7ff; color: #3730a3; }
    .failures {
      margin-top: 15px;
      padding: 10px;
      background: #fef2f2;
      border-radius: 4px;
    }
    .timestamp {
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Quest Feature Test Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
  
  ${this.results.map(result => `
    <div class="suite ${result.failed === 0 ? 'passed' : 'failed'}">
      <h2>${result.suite}</h2>
      <div class="stats">
        <span class="stat passed">✅ ${result.passed} passed</span>
        <span class="stat failed">❌ ${result.failed} failed</span>
        <span class="stat duration">⏱️ ${result.duration}s</span>
      </div>
      ${result.failures.length > 0 ? `
        <div class="failures">
          <strong>Failed tests:</strong>
          <ul>
            ${result.failures.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('')}
  
  <div style="margin-top: 30px; text-align: center; color: #6b7280;">
    <p>Run <code>npx playwright show-report</code> for detailed results</p>
  </div>
</body>
</html>`
    
    await fs.writeFile(reportPath, html)
    console.log(`${colors.green}📄 HTML report generated: ${reportPath}${colors.reset}`)
  }
}

// Run tests
const runner = new FeatureTestRunner()
runner.runTests().catch(console.error)