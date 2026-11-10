import express, { type ErrorRequestHandler } from 'express'
import cookieParser from 'cookie-parser'
import type { HealthResponse } from '@algoholic/shared'
import { authRouter } from './routes/auth'
import { categoriesRouter } from './routes/categories'
import { problemsRouter } from './routes/problems'
import { submissionsRouter } from './routes/submissions'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => {
    const body: HealthResponse = { status: 'ok' }
    res.json(body)
  })

  app.use('/api/auth', authRouter)
  app.use('/api/categories', categoriesRouter)
  app.use('/api/problems', problemsRouter)
  app.use('/api/submissions', submissionsRouter)

  app.use((req, res) => {
    res.status(404).json({ error: 'not found' })
  })

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ error: 'internal server error' })
  }
  app.use(errorHandler)

  return app
}
