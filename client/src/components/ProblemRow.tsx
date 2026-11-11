import { Link } from 'react-router'
import type { ProblemListItem } from '@algoholic/shared'
import { DifficultyBadge } from './DifficultyBadge'
import styles from './ProblemTable.module.css'

export function ProblemRow({ problem }: { problem: ProblemListItem }) {
  return (
    <div className={`${styles.rowGrid} ${styles.problemRow}`}>
      <div className={styles.cell}>
        {problem.solved ? (
          <span className={styles.solvedMark} title="solved">
            ✓
          </span>
        ) : (
          <span className={styles.statusDot} aria-hidden="true" />
        )}
      </div>
      <div className={styles.cell}>
        <Link to={`/problems/${problem.slug}`} className={styles.titleLink}>
          {problem.title}
        </Link>
      </div>
      <div className={styles.cell}>
        <span className={styles.categoryText}>{problem.category.name}</span>
      </div>
      <div className={styles.cell}>
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>
    </div>
  )
}
