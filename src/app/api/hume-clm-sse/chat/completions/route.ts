/**
 * Hume EVI CLM Endpoint - /chat/completions
 * Routes to SSE handler with proper format
 */

import { NextRequest } from 'next/server'
import { POST as sseHandler } from '../../route'

export async function POST(req: NextRequest) {
  console.log('🎯 Hume CLM via /chat/completions SSE endpoint')
  return sseHandler(req)
}