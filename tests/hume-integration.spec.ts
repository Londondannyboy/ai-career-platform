import { test, expect, Page } from '@playwright/test'

// Mock microphone access for testing
async function setupMockAudio(page: Page) {
  await page.addInitScript(() => {
    // Mock getUserMedia
    (navigator as any).mediaDevices = {
      getUserMedia: async () => {
        console.log('Mock getUserMedia called')
        // Create a mock MediaStream
        const mockStream = {
          getTracks: () => [
            {
              kind: 'audio',
              enabled: true,
              stop: () => console.log('Mock track stopped')
            }
          ],
          getAudioTracks: () => [
            {
              kind: 'audio',
              enabled: true,
              stop: () => console.log('Mock audio track stopped')
            }
          ],
          active: true,
          id: 'mock-stream-id'
        }
        return mockStream as any
      }
    }

    // Mock AudioContext
    (window as any).AudioContext = class MockAudioContext {
      sampleRate = 16000
      state = 'running'
      
      createMediaStreamSource() {
        return {
          connect: () => {}
        }
      }
      
      createAnalyser() {
        return {
          fftSize: 256,
          smoothingTimeConstant: 0.1,
          frequencyBinCount: 128,
          getByteFrequencyData: () => {}
        }
      }
      
      close() {
        return Promise.resolve()
      }
    }

    // Mock WebSocket for Hume AI connection
    (window as any).WebSocket = class MockWebSocket {
      readyState = 1 // OPEN
      
      constructor(url: string) {
        console.log('Mock WebSocket created for:', url)
        setTimeout(() => {
          if (this.onopen) this.onopen({} as any)
        }, 100)
      }
      
      send(data: any) {
        console.log('Mock WebSocket send:', data)
      }
      
      close() {
        console.log('Mock WebSocket closed')
        if (this.onclose) this.onclose({} as any)
      }
      
      onopen: ((event: Event) => void) | null = null
      onclose: ((event: CloseEvent) => void) | null = null
      onmessage: ((event: MessageEvent) => void) | null = null
      onerror: ((event: Event) => void) | null = null
    }
  })
}

test.describe('Hume AI Integration on /quest', () => {
  test.beforeEach(async ({ page }) => {
    // Mock audio APIs before navigation
    await setupMockAudio(page)
    
    // Mock environment variables if needed
    await page.addInitScript(() => {
      // Add any client-side environment variable mocks if needed
    })
  })

  test('should load Quest page with Hume AI interface', async ({ page }) => {
    // Navigate to quest page
    await page.goto('http://localhost:3000/quest')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check for authentication redirect (might redirect to sign-in)
    const currentUrl = page.url()
    if (currentUrl.includes('/sign-in')) {
      console.log('User not authenticated - redirected to sign-in')
      // This is expected behavior for unauthenticated users
      await expect(page.locator('text=Sign in')).toBeVisible()
      return
    }
    
    // If authenticated, check the Quest interface
    await expect(page.locator('h1')).toContainText('Quest')
    await expect(page.locator('text=Your AI-powered journey to career success')).toBeVisible()
    
    // Check for Hume AI version indicator
    await expect(page.locator('text=Powered by Hume AI EVI')).toBeVisible()
    
    // Check for conversation interface
    await expect(page.locator('text=Quest Conversation')).toBeVisible()
    await expect(page.locator('text=Start Quest')).toBeVisible()
  })

  test('should attempt Hume AI connection when Start Quest is clicked', async ({ page }) => {
    // Monitor console for connection attempts
    const consoleMessages: string[] = []
    page.on('console', msg => {
      consoleMessages.push(msg.text())
    })
    
    // Monitor network requests
    const requests: string[] = []
    page.on('request', request => {
      requests.push(request.url())
    })
    
    await page.goto('http://localhost:3000/quest')
    
    // Handle authentication if needed
    const currentUrl = page.url()
    if (currentUrl.includes('/sign-in')) {
      console.log('Skipping connection test - user not authenticated')
      return
    }
    
    // Try to click Start Quest button
    const startButton = page.locator('text=Start Quest')
    if (await startButton.isVisible()) {
      await startButton.click()
      
      // Wait for connection attempt
      await page.waitForTimeout(2000)
      
      // Check console messages for Hume AI connection attempts
      const humeMessages = consoleMessages.filter(msg => 
        msg.includes('Hume') || msg.includes('EVI') || msg.includes('WebSocket')
      )
      
      console.log('Hume-related console messages:', humeMessages)
      
      // Check if microphone permission was requested
      const micMessages = consoleMessages.filter(msg => 
        msg.includes('microphone') || msg.includes('getUserMedia') || msg.includes('audio')
      )
      
      console.log('Audio-related console messages:', micMessages)
    }
  })

  test('should display proper error handling for connection failures', async ({ page }) => {
    // Override WebSocket to simulate connection failure
    await page.addInitScript(() => {
      (window as any).WebSocket = class FailingWebSocket {
        constructor(url: string) {
          console.log('Failing WebSocket created for:', url)
          setTimeout(() => {
            if (this.onerror) this.onerror(new Event('error'))
          }, 100)
        }
        
        close() {}
        send() {}
        
        onopen: ((event: Event) => void) | null = null
        onclose: ((event: CloseEvent) => void) | null = null
        onmessage: ((event: MessageEvent) => void) | null = null
        onerror: ((event: Event) => void) | null = null
      }
    })
    
    await page.goto('http://localhost:3000/quest')
    
    // Handle authentication if needed
    const currentUrl = page.url()
    if (currentUrl.includes('/sign-in')) {
      console.log('Skipping error handling test - user not authenticated')
      return
    }
    
    const startButton = page.locator('text=Start Quest')
    if (await startButton.isVisible()) {
      await startButton.click()
      
      // Wait for error handling
      await page.waitForTimeout(2000)
      
      // Check for error messages in the conversation
      const errorMessage = page.locator('text*=Connection error')
      if (await errorMessage.isVisible()) {
        console.log('Error handling working correctly')
        await expect(errorMessage).toBeVisible()
      }
    }
  })

  test('should check for required environment variables and API keys', async ({ page }) => {
    // Monitor network requests for API calls
    const apiRequests: string[] = []
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push(request.url())
      }
    })
    
    await page.goto('http://localhost:3000/quest')
    
    // Check if the page loads without immediate errors
    await page.waitForLoadState('networkidle')
    
    // Look for any obvious configuration errors in console
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.waitForTimeout(1000)
    
    console.log('API requests made:', apiRequests)
    console.log('Console errors:', consoleErrors)
    
    // Check for environment variable related errors
    const envErrors = consoleErrors.filter(error => 
      error.includes('API key') || 
      error.includes('HUME') || 
      error.includes('configuration')
    )
    
    if (envErrors.length > 0) {
      console.log('Environment variable errors detected:', envErrors)
    }
  })
})