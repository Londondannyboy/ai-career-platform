'use client'

/**
 * Simple Hume Integration Test
 * Test the working /chat/completions endpoint with minimal setup
 */

import { useState } from 'react'

export default function TestHumeIntegration() {
  const [testResult, setTestResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const testEndpoint = async () => {
    setIsLoading(true)
    setTestResult('Testing...')
    
    try {
      const response = await fetch('/api/hume-clm/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are Quest, an AI career coach.' },
            { role: 'user', content: 'Hi, what do you know about me and my company?' }
          ],
          user_id: 'user_2z5UB58sfZFnapkymfEkFzGIlzK' // Dan's ID
        })
      })

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      let fullResponse = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('0:')) {
            fullResponse += line.substring(2).replace(/"/g, '')
          }
        }
      }

      setTestResult(fullResponse)
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Hume Integration Test</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Endpoint:</span>
              <span className="text-green-400">https://ai-career-platform.vercel.app/api/hume-clm/chat/completions</span>
            </div>
            <div className="flex justify-between">
              <span>Format:</span>
              <span className="text-green-400">OpenAI Compatible</span>
            </div>
            <div className="flex justify-between">
              <span>Database:</span>
              <span className="text-green-400">Connected (Dan Keegan @ CKDelta)</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <button
            onClick={testEndpoint}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Endpoint Response'}
          </button>
          
          {testResult && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Response:</h3>
              <div className="bg-gray-900 p-4 rounded">
                {testResult}
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Hume Configuration</h2>
          <p className="text-gray-300 mb-4">
            To configure Hume EVI to use this endpoint, you need to set up a Custom Language Model in your Hume dashboard.
          </p>
          
          <div className="bg-gray-900 p-4 rounded font-mono text-sm">
            <div>Endpoint URL: https://ai-career-platform.vercel.app/api/hume-clm/chat/completions</div>
            <div>Config ID: 8f16326f-a45d-4433-9a12-890120244ec3</div>
          </div>
          
          <p className="text-gray-400 text-sm mt-4">
            The endpoint should be configured in your Hume dashboard, not in the playground. 
            Once configured, when you use the Hume Playground with this config ID, 
            it should automatically route through this endpoint and know about Dan Keegan.
          </p>
        </div>
      </div>
    </div>
  )
}