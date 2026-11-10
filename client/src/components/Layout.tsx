import { Link, Outlet } from 'react-router'
import { useAuth } from '../use-auth'
import styles from './Layout.module.css'

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/problems" className={styles.brand}>
            algo<span className={styles.brandAccent}>holic</span>
          </Link>
          <nav className={styles.nav}>
            <Link to="/problems" className={styles.navLink}>
              Problems
            </Link>
            {user ? (
              <>
                <span className={styles.userEmail}>{user.email}</span>
                <button type="button" className={styles.logoutButton} onClick={() => logout()}>
                  log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.navLink}>
                  log in
                </Link>
                <Link to="/register" className={styles.navLink}>
                  register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
