import express from 'express'
import type { HealthResponse } from '@algoholic/shared'

export function createApp() {
  const app = express()

  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_req, res) => {
    const body: HealthResponse = { status: 'ok' }
    res.json(body)
  })

  return app
}
