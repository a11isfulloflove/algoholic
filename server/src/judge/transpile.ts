import { transformSync } from 'esbuild'
import type { Language } from '@algoholic/shared'

export interface TranspileResult {
  ok: boolean
  code?: string
  error?: string
}

interface EsbuildErrorLocation {
  line?: number
  column?: number
}

interface EsbuildError {
  text: string
  location?: EsbuildErrorLocation
}

function formatErrors(errors: EsbuildError[]): string {
  return errors
    .map((e) => {
      if (e.location && e.location.line !== undefined) {
        const loc = e.location
        return `${loc.line ?? '?'}:${loc.column ?? '?'} — ${e.text}`
      }
      return e.text
    })
    .join('\n')
}

export function transpile(source: string, language: Language): TranspileResult {
  try {
    const result = transformSync(source, {
      loader: language === 'typescript' ? 'ts' : 'js',
      format: 'cjs',
      target: 'es2022',
    })
    return { ok: true, code: result.code }
  } catch (err) {
    const errors = (err as { errors?: EsbuildError[] }).errors
    if (errors && errors.length > 0) {
      return { ok: false, error: formatErrors(errors) }
    }
    return { ok: false, error: String(err) }
  }
}
