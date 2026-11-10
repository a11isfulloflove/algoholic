import type { ProblemListItem } from '@algoholic/shared'
import { ProblemRow } from './ProblemRow'
import styles from './ProblemTable.module.css'

export function ProblemTable({ items }: { items: ProblemListItem[] }) {
  return (
    <div className={styles.table}>
      <div className={`${styles.rowGrid} ${styles.headerRow}`}>
        <span className={styles.headerCell}>status</span>
        <span className={styles.headerCell}>title</span>
        <span className={styles.headerCell}>category</span>
        <span className={styles.headerCell}>difficulty</span>
      </div>
      {items.map((problem) => (
        <ProblemRow key={problem.slug} problem={problem} />
      ))}
    </div>
  )
}
