import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-orange text-white shadow">
        <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="font-semibold text-lg hover:opacity-90">
            PC Shop
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            {!loading && user && (
              <>
                <span className="opacity-90 truncate max-w-[200px]" title={user.email}>
                  {user.full_name || user.email}
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="rounded bg-white/15 px-3 py-1 hover:bg-white/25"
                >
                  Вийти
                </button>
              </>
            )}
            {!loading && !user && (
              <>
                <Link to="/login" className="hover:underline">
                  Вхід
                </Link>
                <Link
                  to="/register"
                  className="rounded bg-white/15 px-3 py-1 hover:bg-white/25 font-medium"
                >
                  Реєстрація
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 flex-1 w-full">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-brand-muted">
        Навчальний проєкт
      </footer>
    </div>
  );
}
