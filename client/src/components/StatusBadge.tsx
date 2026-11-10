import type { SubmissionStatus } from '@algoholic/shared'
import styles from './StatusBadge.module.css'

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const cls =
    status === 'accepted'
      ? styles.accepted
      : status === 'wrong_answer' || status === 'runtime_error'
        ? styles.wrong
        : status === 'compile_error' || status === 'time_limit'
          ? styles.warn
          : styles.neutral

  return <span className={`${styles.badge} ${cls}`}>{status.replace('_', ' ')}</span>
}
