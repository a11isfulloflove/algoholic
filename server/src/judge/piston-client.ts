const PISTON_URL = process.env.PISTON_URL ?? 'http://localhost:2000'

export interface PistonStageResult {
  stdout: string
  stderr: string
  code: number | null
  signal: string | null
  message: string | null
  status: 'RE' | 'SG' | 'TO' | 'OL' | 'EL' | 'XX' | null
  wall_time?: number
  cpu_time?: number
  memory?: number
}

export interface PistonExecuteResponse {
  language: string
  version: string
  run: PistonStageResult
  compile?: PistonStageResult
}

interface RuntimeEntry {
  language: string
  version: string
  aliases?: string[]
  runtime?: string
}

let cachedVersion: string | null = null

async function resolveNodeVersion(): Promise<string> {
  if (cachedVersion) return cachedVersion

  const res = await fetch(`${PISTON_URL}/api/v2/runtimes`, {
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) {
    throw new Error(`piston at ${PISTON_URL} responded ${res.status}`)
  }

  const runtimes = (await res.json()) as RuntimeEntry[]
  const node = runtimes.find((r) => r.runtime === 'node' || r.language === 'node')
  if (!node) {
    throw new Error('node runtime not installed in piston — run: npm run judge:setup')
  }

  cachedVersion = node.version
  return cachedVersion
}

export interface ExecuteOptions {
  files: Array<{ name: string; content: string }>
  runTimeoutMs: number
  memoryLimitBytes: number
}

export async function executeNode(options: ExecuteOptions): Promise<PistonExecuteResponse> {
  const version = await resolveNodeVersion()
  const res = await fetch(`${PISTON_URL}/api/v2/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'javascript',
      version,
      files: options.files,
      run_timeout: options.runTimeoutMs,
      run_memory_limit: options.memoryLimitBytes,
    }),
    signal: AbortSignal.timeout(options.runTimeoutMs + 15000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`piston execute failed: ${res.status} ${text.slice(0, 300)}`)
  }

  return (await res.json()) as PistonExecuteResponse
}
