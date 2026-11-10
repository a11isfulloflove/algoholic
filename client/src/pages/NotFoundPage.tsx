import { Link } from 'react-router'
import styles from './ProblemPage.module.css'

export function NotFoundPage() {
  return (
    <div className={styles.message}>
      this page wandered off into an unsorted array —{' '}
      <Link to="/problems">back to problems</Link>
    </div>
  )
}
