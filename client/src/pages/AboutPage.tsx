import { useAuth } from '../use-auth'
import styles from './AboutPage.module.css'

export function AboutPage() {
  const { user } = useAuth()
  const dedication = user?.name ? `for ${user.name}` : 'for you'

  return (
    <div>
      <div className={styles.card}>
        <h1 className={styles.title}>about algoholic</h1>
        <p className={styles.text}>
          algoholic is a small, honest place to practice algorithmic problems: read a statement,
          write javascript or typescript, run it against samples, and submit it to an automated
          judge that runs your code in a real sandbox.
        </p>
        <p className={styles.text}>
          no leaderboards, no ads, no streak anxiety — just you, the problems, and a green ✓ when
          you earn it.
        </p>

        <div className={styles.sectionTitle}>how the judge works</div>
        <ul className={styles.list}>
          <li>your code runs in an isolated sandbox — no network, capped time and memory</li>
          <li>typescript is transpiled first; syntax errors become compile errors</li>
          <li>solutions are checked against visible samples and hidden tests</li>
          <li>hidden test answers never leave the server — no peeking</li>
        </ul>

        <div className={styles.sectionTitle}>under the hood</div>
        <ul className={styles.list}>
          <li>react + vite on the front, express + prisma + postgresql on the back</li>
          <li>piston for sandboxed code execution</li>
          <li>bcrypt-hashed passwords, httpOnly cookie sessions</li>
        </ul>

        <p className={styles.soft}>
          built with 💗 {dedication} — pick an avatar, solve something, come back tomorrow for
          the problem of the day.
        </p>
      </div>
    </div>
  )
}
