import type {
  RunSamplesResponse,
  SubmissionStatus,
  SubmitResponse,
  TestCaseResult,
} from '@algoholic/shared'
import styles from './ResultsPanel.module.css'

function bannerClass(status: SubmissionStatus): string {
  if (status === 'accepted') return styles.bannerAccepted
  if (status === 'wrong_answer' || status === 'runtime_error') return styles.bannerWrong
  if (status === 'time_limit' || status === 'compile_error') return styles.bannerWarn
  return styles.bannerInfo
}

function statusLabel(status: SubmissionStatus): string {
  const labels: Record<SubmissionStatus, string> = {
    accepted: '✓ accepted',
    wrong_answer: '✗ wrong answer',
    time_limit: '⏱ time limit exceeded',
    runtime_error: '✗ runtime error',
    compile_error: '⚠ compile error',
    internal_error: 'judge hiccup — try again',
  }
  return labels[status]
}

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined'
  return JSON.stringify(value) ?? String(value)
}

function UserLogs({ logs }: { logs: string }) {
  if (!logs.trim()) return null
  return (
    <details className={styles.logs}>
      <summary className={styles.logsSummary}>your output (console.log)</summary>
      <pre className={styles.logsPre}>{logs}</pre>
    </details>
  )
}

function CompileError({ error }: { error: string }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>compile error</div>
      <div className={styles.compileError}>{error}</div>
    </div>
  )
}

function RunCases({ results }: { results: TestCaseResult[] }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>sample cases</div>
      <table className={styles.cases}>
        <thead>
          <tr>
            <th>#</th>
            <th>input</th>
            <th>expected</th>
            <th>yours</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.index}>
              <td>{r.index + 1}</td>
              <td>{(r.args ?? []).map((a) => formatValue(a)).join(', ')}</td>
              <td>{formatValue(r.expected)}</td>
              <td>
                {r.notRun ? (
                  <span className={styles.caseFail}>not run — {r.error ?? 'skipped'}</span>
                ) : (
                  <span className={r.ok ? styles.caseOk : styles.caseFail}>
                    {formatValue(r.got)}
                    {r.error ? ` — ${r.error}` : ''}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function RunResultsView({ result }: { result: RunSamplesResponse }) {
  return (
    <div className={styles.panel}>
      <div className={`${styles.banner} ${bannerClass(result.status)}`}>
        {statusLabel(result.status)}
        {result.runtimeMs !== null && (
          <span className={styles.runtime}>{result.runtimeMs} ms</span>
        )}
      </div>
      {result.compileError ? (
        <CompileError error={result.compileError} />
      ) : (
        <RunCases results={result.results} />
      )}
      <div className={styles.section}>
        <UserLogs logs={result.userLogs} />
      </div>
    </div>
  )
}

export function SubmitResultsView({ result }: { result: SubmitResponse }) {
  return (
    <div className={styles.panel}>
      <div className={`${styles.banner} ${bannerClass(result.status)}`}>
        {statusLabel(result.status)}
        {result.runtimeMs !== null && (
          <span className={styles.runtime}>{result.runtimeMs} ms</span>
        )}
        <span className={styles.runtime}>
          {result.passedCount}/{result.totalCount} tests
        </span>
      </div>

      <div className={styles.section}>
        {result.status === 'compile_error' && result.compileError ? (
          <div className={styles.compileError}>{result.compileError}</div>
        ) : (
          <div className={styles.kv}>
            {result.failedIndex !== null && (
              <>
                <span className={styles.kvKey}>failed test</span>
                <span className={styles.kvValue}>#{result.failedIndex + 1}</span>
              </>
            )}
            {result.got !== undefined && (
              <>
                <span className={styles.kvKey}>your output</span>
                <span className={styles.kvValue}>{formatValue(result.got)}</span>
              </>
            )}
            {result.error && (
              <>
                <span className={styles.kvKey}>error</span>
                <span className={styles.kvValue}>{result.error}</span>
              </>
            )}
          </div>
        )}
        <UserLogs logs={result.userLogs} />
      </div>
    </div>
  )
}
