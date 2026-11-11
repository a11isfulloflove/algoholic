import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api, ApiError } from '../api'
import type { ProblemDetail, ProblemSolution } from '@algoholic/shared'
import { DifficultyBadge } from '../components/DifficultyBadge'
import { EditorPanel } from '../components/EditorPanel'
import styles from './ProblemPage.module.css'

function revealedHintsKey(slug: string): string {
  return `algoholic:hints:${slug}`
}

function loadRevealedHints(slug: string): number {
  try {
    const raw = localStorage.getItem(revealedHintsKey(slug))
    const n = raw ? Number(raw) : 0
    return Number.isInteger(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

export function ProblemPage({ slug: slugProp }: { slug?: string } = {}) {
  const params = useParams<{ slug: string }>()
  const slug = slugProp ?? params.slug
  const [problem, setProblem] = useState<ProblemDetail | null>(null)
  const [solved, setSolved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [revealedHints, setRevealedHints] = useState(() => (slug ? loadRevealedHints(slug) : 0))
  const [solution, setSolution] = useState<ProblemSolution | null>(null)
  const [solutionOpen, setSolutionOpen] = useState(false)
  const [solutionError, setSolutionError] = useState<string | null>(null)

  const [lastSlug, setLastSlug] = useState(slug)
  if (slug !== lastSlug) {
    setLastSlug(slug)
    setLoading(true)
    setNotFound(false)
    setError(null)
    setRevealedHints(slug ? loadRevealedHints(slug) : 0)
    setSolution(null)
    setSolutionOpen(false)
    setSolutionError(null)
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

  function revealNextHint() {
    if (!problem?.hints) return
    const next = Math.min(revealedHints + 1, problem.hints.length)
    setRevealedHints(next)
    try {
      localStorage.setItem(revealedHintsKey(problem.slug), String(next))
    } catch {
      // storage unavailable — reveals just won't persist
    }
  }

  async function toggleSolution() {
    if (solutionOpen) {
      setSolutionOpen(false)
      return
    }
    if (!solution) {
      setSolutionError(null)
      try {
        const s = await api.solution(problem?.slug ?? '')
        setSolution(s)
      } catch (err) {
        setSolutionError(err instanceof Error ? err.message : 'could not load solution')
        return
      }
    }
    setSolutionOpen(true)
  }

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
              {problem.targetComplexity && <span>🚀 aim for {problem.targetComplexity}</span>}
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

            {problem.hintsCount > 0 && (
              <div className={styles.hintsBlock}>
                <div className={styles.hintsTitle}>💡 hints</div>
                {!problem.hints ? (
                  <p className={styles.softText}>
                    <Link to="/login">log in</Link> to reveal {problem.hintsCount} gentle
                    {problem.hintsCount > 1 ? ' hints' : ' hint'}
                  </p>
                ) : (
                  <>
                    {problem.hints.slice(0, revealedHints).map((h, i) => (
                      <div key={i} className={styles.hintCard}>
                        <span className={styles.hintNumber}>{i + 1}</span>
                        <span>{h}</span>
                      </div>
                    ))}
                    {revealedHints < problem.hints.length && (
                      <button
                        type="button"
                        className={styles.revealButton}
                        onClick={revealNextHint}
                      >
                        {revealedHints === 0 ? 'reveal a hint' : `reveal hint ${revealedHints + 1}`}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {problem.related.length > 0 && (
              <div className={styles.tryNextBlock}>
                <div className={styles.hintsTitle}>🧭 try next</div>
                <div className={styles.tryNextChips}>
                  {problem.related.map((r) => (
                    <Link key={r.slug} to={`/problems/${r.slug}`} className={styles.tryNextChip}>
                      <span className={r.solved ? styles.tryNextSolved : ''}>
                        {r.solved ? '✓ ' : ''}
                        {r.title}
                      </span>
                      <DifficultyBadge difficulty={r.difficulty} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {solved && (
            <div className={styles.solutionCard}>
              <button type="button" className={styles.solutionToggle} onClick={toggleSolution}>
                🔓 {solutionOpen ? 'hide' : "compare with the author's solution"}
              </button>
              {solutionError && <p className={styles.softText}>{solutionError}</p>}
              {solutionOpen && solution && (
                <>
                  {solution.solutionNotes && (
                    <div className={`${styles.markdown} ${styles.solutionNotes}`}>
                      <Markdown remarkPlugins={[remarkGfm]}>{solution.solutionNotes}</Markdown>
                    </div>
                  )}
                  <pre className={styles.starter}>{solution.solutionJs}</pre>
                </>
              )}
            </div>
          )}
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
