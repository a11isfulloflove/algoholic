import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api, ApiError } from '../api'
import type { SubmissionDetail } from '@algoholic/shared'
import { StatusBadge } from '../components/StatusBadge'
import styles from './SubmissionDetailPage.module.css'

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [lastId, setLastId] = useState(id)
  if (id !== lastId) {
    setLastId(id)
    setLoading(true)
    setNotFound(false)
    setError(null)
  }

  const numericId = Number(id)
  const invalidId = !Number.isInteger(numericId) || numericId < 1

  useEffect(() => {
    if (invalidId) {
      return
    }
    let active = true
    api
      .submission(numericId)
      .then((s) => {
        if (active) setSubmission(s)
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setError(err instanceof Error ? err.message : 'failed to load submission')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, invalidId, numericId])

  if (invalidId) {
    return (
      <div className={styles.message}>
        submission not found — <Link to="/submissions">back to history</Link>
      </div>
    )
  }

  if (loading) {
    return <div className={styles.message}>loading submission…</div>
  }

  if (notFound) {
    return (
      <div className={styles.message}>
        submission not found — <Link to="/submissions">back to history</Link>
      </div>
    )
  }

  if (error || !submission) {
    return <div className={styles.message}>{error ?? 'something went wrong'}</div>
  }

  return (
    <div>
      <Link to="/submissions" className={styles.backLink}>
        ← all submissions
      </Link>

      <div className={styles.card}>
        <div className={styles.header}>
          <StatusBadge status={submission.status} />
          <Link to={`/problems/${submission.problemSlug}`} className={styles.problemLink}>
            {submission.problemTitle}
          </Link>
          <span className={styles.meta}>{submission.language}</span>
          <span className={styles.meta}>
            {submission.runtimeMs !== null ? `${submission.runtimeMs} ms` : '—'}
          </span>
          <span className={styles.meta}>{new Date(submission.createdAt).toLocaleString()}</span>
        </div>
        <pre className={styles.code}>{submission.code}</pre>
      </div>
    </div>
  )
}
