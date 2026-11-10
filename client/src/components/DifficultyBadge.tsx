import type { Difficulty } from '@algoholic/shared'
import styles from './DifficultyBadge.module.css'

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={`${styles.badge} ${styles[difficulty]}`}>{difficulty}</span>
}
