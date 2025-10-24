import type { AppType } from '../../../backend/src/app'
import { hc } from 'hono/client'

export const client = hc<AppType>('http://localhost:6001/')

// Helper function to check if the client works
export function testClient() {
  return client
}
