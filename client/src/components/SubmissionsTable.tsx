import { Link } from 'react-router'
import type { SubmissionSummary } from '@algoholic/shared'
import { StatusBadge } from './StatusBadge'
import styles from './SubmissionsTable.module.css'

export function SubmissionRow({ submission }: { submission: SubmissionSummary }) {
  return (
    <Link
      to={`/submissions/${submission.id}`}
      className={`${styles.rowGrid} ${styles.submissionRow}`}
    >
      <span className={styles.cell}>
        <StatusBadge status={submission.status} />
      </span>
      <span className={styles.cell}>
        <span className={styles.problemLink}>{submission.problemTitle}</span>
      </span>
      <span className={`${styles.cell} ${styles.mono}`}>{submission.language}</span>
      <span className={`${styles.cell} ${styles.mono}`}>
        {submission.runtimeMs !== null ? `${submission.runtimeMs} ms` : '—'}
      </span>
      <span className={`${styles.cell} ${styles.date}`}>
        {new Date(submission.createdAt).toLocaleString()}
      </span>
    </Link>
  )
}

export function SubmissionsTable({ items }: { items: SubmissionSummary[] }) {
  return (
    <div className={styles.table}>
      <div className={`${styles.rowGrid} ${styles.headerRow}`}>
        <span className={styles.headerCell}>status</span>
        <span className={styles.headerCell}>problem</span>
        <span className={styles.headerCell}>language</span>
        <span className={styles.headerCell}>runtime</span>
        <span className={styles.headerCell}>when</span>
      </div>
      {items.map((s) => (
        <SubmissionRow key={s.id} submission={s} />
      ))}
    </div>
  )
}
