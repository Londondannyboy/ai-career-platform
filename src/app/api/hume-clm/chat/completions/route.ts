/**
 * Hume EVI Custom Language Model (CLM) Endpoint
 * SSE endpoint following Hume's required naming convention: /chat/completions
 * Routes to existing Hume CLM logic with database integration
 */

import { NextRequest } from 'next/server'
import { POST as humeClmHandler } from '../../route'

export async function POST(req: NextRequest) {
  console.log('🎯 Hume EVI CLM Request via /chat/completions endpoint')
  console.log('🔄 Routing to existing Hume CLM handler with database integration')
  console.log('📅 Endpoint updated:', new Date().toISOString())
  
  // Route to existing Hume CLM handler that has all the database integration
  return humeClmHandler(req)
}

// Export other methods if needed
export { POST as GET }