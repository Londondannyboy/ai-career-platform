/**
 * Test Document Upload and Management System
 * Tests the new document upload, processing, and chat features
 */

const fs = require('fs')
const path = require('path')

// Test configuration
const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
const TEST_TIMEOUT = 30000 // 30 seconds

console.log('📄 Testing Document Upload and Management System...')
console.log(`🌐 Base URL: ${BASE_URL}`)

async function testDocumentEndpoints() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  }

  // Test 1: Check workspace creation endpoint
  try {
    console.log('\n1️⃣ Testing workspace creation endpoint...')
    const response = await fetch(`${BASE_URL}/api/workspace/create`, {
      method: 'GET'
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ Workspace creation endpoint accessible')
      console.log('   📋 Required fields:', data.requiredFields)
      console.log('   📋 Access levels:', data.accessLevels)
      results.passed++
    } else {
      console.log(`   ❌ Workspace creation endpoint failed: ${response.status}`)
      results.failed++
    }
    results.tests.push('Workspace Creation Endpoint')
  } catch (error) {
    console.log(`   ❌ Error testing workspace creation: ${error.message}`)
    results.failed++
    results.tests.push('Workspace Creation Endpoint')
  }

  // Test 2: Check workspace list endpoint (without auth - should fail gracefully)
  try {
    console.log('\n2️⃣ Testing workspace list endpoint...')
    const response = await fetch(`${BASE_URL}/api/workspace/list`)
    
    if (response.status === 401) {
      console.log('   ✅ Workspace list properly requires authentication')
      results.passed++
    } else {
      console.log(`   ❌ Unexpected response from workspace list: ${response.status}`)
      results.failed++
    }
    results.tests.push('Workspace List Authentication')
  } catch (error) {
    console.log(`   ❌ Error testing workspace list: ${error.message}`)
    results.failed++
    results.tests.push('Workspace List Authentication')
  }

  // Test 3: Check document search endpoint configuration
  try {
    console.log('\n3️⃣ Testing document search endpoint configuration...')
    const response = await fetch(`${BASE_URL}/api/documents/search`, {
      method: 'GET'
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ Document search endpoint accessible')
      console.log('   📋 Supported document types:', data.supportedDocumentTypes?.length || 0)
      console.log('   📋 Capabilities:', data.capabilities?.length || 0)
      results.passed++
    } else {
      console.log(`   ❌ Document search endpoint failed: ${response.status}`)
      results.failed++
    }
    results.tests.push('Document Search Configuration')
  } catch (error) {
    console.log(`   ❌ Error testing document search: ${error.message}`)
    results.failed++
    results.tests.push('Document Search Configuration')
  }

  // Test 4: Test file upload endpoint structure (without auth - should fail gracefully)
  try {
    console.log('\n4️⃣ Testing file upload endpoint structure...')
    
    // Create a test workspace ID for the endpoint
    const testWorkspaceId = 'test-workspace-123'
    const response = await fetch(`${BASE_URL}/api/workspace/${testWorkspaceId}/upload`, {
      method: 'GET'
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ Upload endpoint configuration accessible')
      console.log('   📋 Allowed file types:', data.allowedFileTypes?.length || 0)
      console.log('   📋 Max file size:', data.maxFileSize)
      console.log('   📋 Document types:', data.documentTypes?.length || 0)
      results.passed++
    } else {
      console.log(`   ❌ Upload endpoint configuration failed: ${response.status}`)
      results.failed++
    }
    results.tests.push('Upload Endpoint Configuration')
  } catch (error) {
    console.log(`   ❌ Error testing upload endpoint: ${error.message}`)
    results.failed++
    results.tests.push('Upload Endpoint Configuration')
  }

  // Test 5: Test chat endpoint (without auth - should fail gracefully)
  try {
    console.log('\n5️⃣ Testing chat endpoint authentication...')
    
    const testWorkspaceId = 'test-workspace-123'
    const response = await fetch(`${BASE_URL}/api/workspace/${testWorkspaceId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'test query'
      })
    })
    
    if (response.status === 401) {
      console.log('   ✅ Chat endpoint properly requires authentication')
      results.passed++
    } else {
      console.log(`   ❌ Unexpected response from chat endpoint: ${response.status}`)
      results.failed++
    }
    results.tests.push('Chat Endpoint Authentication')
  } catch (error) {
    console.log(`   ❌ Error testing chat endpoint: ${error.message}`)
    results.failed++
    results.tests.push('Chat Endpoint Authentication')
  }

  // Test 6: Check if database schema dependencies exist
  try {
    console.log('\n6️⃣ Testing database schema dependencies...')
    
    // Try to access the schema file we created
    const schemaPath = path.join(__dirname, '../supabase/social-intelligence-schema.sql')
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8')
      const requiredTables = [
        'company_workspaces',
        'company_documents', 
        'document_embeddings',
        'workspace_chats'
      ]
      
      let tablesFound = 0
      requiredTables.forEach(table => {
        if (schemaContent.includes(`create table public.${table}`) || 
            schemaContent.includes(`CREATE TABLE public.${table}`)) {
          tablesFound++
        }
      })
      
      console.log(`   ✅ Schema file exists with ${tablesFound}/${requiredTables.length} required tables`)
      results.passed++
    } else {
      console.log('   ❌ Schema file not found')
      results.failed++
    }
    results.tests.push('Database Schema Dependencies')
  } catch (error) {
    console.log(`   ❌ Error checking schema: ${error.message}`)
    results.failed++
    results.tests.push('Database Schema Dependencies')
  }

  return results
}

// Test 7: Create a simple test file for upload simulation
function createTestFile() {
  console.log('\n7️⃣ Creating test file for upload simulation...')
  
  try {
    const testContent = `# Test Document for Quest Document Management

This is a test document to validate the document upload and processing system.

## Product Information
- Product Name: Quest AI Platform
- Category: AI-powered career development
- Features: Voice coaching, document analysis, personalized insights

## Key Features
- Intelligent document processing
- Vector-based search capabilities  
- AI-powered chat interface
- Multi-workspace collaboration

## Competitive Analysis
- Main competitors: Traditional career coaching platforms
- Differentiator: AI-native approach with voice interface
- Target market: Professionals seeking AI-enhanced career development

## Pricing Considerations
- Subscription-based model
- Multiple tiers: Basic, Professional, Enterprise
- Value proposition: Personalized AI coaching at scale

This document contains various business entities that should be extracted by the AI processing system.`

    const testFilePath = path.join(__dirname, 'test-document.txt')
    fs.writeFileSync(testFilePath, testContent)
    console.log(`   ✅ Test file created: ${testFilePath}`)
    console.log(`   📄 File size: ${testContent.length} characters`)
    
    return testFilePath
  } catch (error) {
    console.log(`   ❌ Error creating test file: ${error.message}`)
    return null
  }
}

// Main test runner
async function runTests() {
  console.log('\n🚀 Starting Document Management System Tests...')
  
  const startTime = Date.now()
  
  // Create test file
  const testFilePath = createTestFile()
  
  // Run endpoint tests
  const results = await testDocumentEndpoints()
  
  const endTime = Date.now()
  const duration = endTime - startTime
  
  // Summary
  console.log('\n📊 TEST SUMMARY')
  console.log('================')
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⏱️  Duration: ${duration}ms`)
  console.log(`📋 Tests run: ${results.tests.join(', ')}`)
  
  if (testFilePath && fs.existsSync(testFilePath)) {
    console.log(`\n📁 Test file available for manual upload testing: ${testFilePath}`)
    console.log('   To test file upload manually:')
    console.log('   1. Start the dev server: npm run dev')
    console.log('   2. Create a workspace through the UI')
    console.log('   3. Upload the test file using the document upload feature')
    console.log('   4. Try asking questions about the document content')
  }
  
  // Clean up
  try {
    if (testFilePath && fs.existsSync(testFilePath)) {
      // Don't delete - leave for manual testing
      // fs.unlinkSync(testFilePath)
    }
  } catch (error) {
    console.log(`⚠️  Could not clean up test file: ${error.message}`)
  }
  
  console.log('\n🎯 Document Management System Test Complete!')
  
  if (results.failed > 0) {
    console.log('❌ Some tests failed - check the output above for details')
    process.exit(1)
  } else {
    console.log('✅ All tests passed!')
  }
}

// Handle timeouts
setTimeout(() => {
  console.log('❌ Tests timed out after 30 seconds')
  process.exit(1)
}, TEST_TIMEOUT)

// Run the tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error)
  process.exit(1)
})