import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { CART_UPDATE_EVENT } from "../lib/cartEvents.js";

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(null);

  useEffect(() => {
    if (!user) {
      setCartCount(null);
      return undefined;
    }

    let cancelled = false;
    async function loadCount() {
      try {
        const d = await api("/api/cart");
        if (!cancelled) setCartCount(d.items?.length ?? 0);
      } catch {
        if (!cancelled) setCartCount(0);
      }
    }

    loadCount();
    const onUpdate = () => {
      loadCount();
    };
    window.addEventListener(CART_UPDATE_EVENT, onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(CART_UPDATE_EVENT, onUpdate);
    };
  }, [user, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-orange text-white shadow">
        <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-5">
            <Link to="/" className="font-semibold text-lg hover:opacity-90">
              PC Shop
            </Link>
            <nav className="flex flex-wrap items-center gap-3 text-sm opacity-95">
              <Link to="/" className="hover:underline">
                Каталог
              </Link>
              <Link to="/configurator" className="hover:underline">
                Конфігуратор
              </Link>
              {user && (
                <Link to="/cart" className="hover:underline">
                  Кошик{cartCount != null && cartCount > 0 ? ` (${cartCount})` : ""}
                </Link>
              )}
            </nav>
          </div>
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
