import * as adminRouter from './admin.router'
import * as auth from './auth'
import * as paymentsRouter from './payments.router'
import * as securityRouter from './security.router'
import * as webhookRouter from './webhook.router'

export type { RouterClient } from '@orpc/server'

export const router = {
  auth,
  payments: paymentsRouter,
  admin: adminRouter,
  webhook: webhookRouter,
  security: securityRouter,
}

export type Router = typeof router
