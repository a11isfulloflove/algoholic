import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api, ApiError } from '../api'
import type { ProblemDetail } from '@algoholic/shared'
import { DifficultyBadge } from '../components/DifficultyBadge'
import { EditorPanel } from '../components/EditorPanel'
import styles from './ProblemPage.module.css'

export function ProblemPage() {
  const { slug } = useParams<{ slug: string }>()
  const [problem, setProblem] = useState<ProblemDetail | null>(null)
  const [solved, setSolved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [lastSlug, setLastSlug] = useState(slug)
  if (slug !== lastSlug) {
    setLastSlug(slug)
    setLoading(true)
    setNotFound(false)
    setError(null)
  }

  useEffect(() => {
    if (!slug) return
    let active = true
    api
      .problem(slug)
      .then((p) => {
        if (active) {
          setProblem(p)
          setSolved(p.solved)
        }
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setError(err instanceof Error ? err.message : 'failed to load problem')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [slug])

  if (loading) {
    return <div className={styles.message}>loading problem…</div>
  }

  if (notFound) {
    return (
      <div className={styles.message}>
        problem not found — <Link to="/problems">back to all problems</Link>
      </div>
    )
  }

  if (error || !problem) {
    return <div className={styles.message}>{error ?? 'something went wrong'}</div>
  }

  return (
    <div>
      <Link to="/problems" className={styles.backLink}>
        ← all problems
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>{problem.title}</h1>
        <DifficultyBadge difficulty={problem.difficulty} />
        {solved && (
          <span className={styles.solvedBadge} title="you solved this one">
            ✓ solved
          </span>
        )}
        <span className={styles.title} style={{ fontSize: 14, color: 'var(--text-soft)' }}>
          {problem.category.name}
        </span>
      </div>

      <div className={styles.layout}>
        <section className={styles.statement}>
          <div className={styles.card}>
            <div className={styles.meta}>
              <span>⏱ {problem.timeLimitMs / 1000}s time limit</span>
              <span>🧠 {problem.memoryLimitMb} MB memory</span>
              <span>🧪 {problem.testCount} tests</span>
              <span>🎯 js / ts</span>
            </div>

            <div className={styles.markdown}>
              <Markdown remarkPlugins={[remarkGfm]}>{problem.description}</Markdown>
            </div>

            <h3 className={styles.markdown}>samples</h3>
            <table className={styles.samples}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>input (args)</th>
                  <th>expected</th>
                </tr>
              </thead>
              <tbody>
                {problem.samples.map((s, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{s.args.map((a) => JSON.stringify(a)).join(', ')}</td>
                    <td>{JSON.stringify(s.expected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.editorSide}>
          <EditorPanel
            slug={problem.slug}
            starterCodeJs={problem.starterCodeJs}
            starterCodeTs={problem.starterCodeTs}
            onSubmitResult={(result) => {
              if (result.status === 'accepted') {
                setSolved(true)
              }
            }}
          />
        </section>
      </div>
    </div>
  )
}
