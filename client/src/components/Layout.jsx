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
                <>
                  <Link to="/cart" className="hover:underline">
                    Кошик{cartCount != null && cartCount > 0 ? ` (${cartCount})` : ""}
                  </Link>
                  <Link to="/orders" className="hover:underline">
                    Замовлення
                  </Link>
                  <Link to="/profile" className="hover:underline">
                    Профіль
                  </Link>
                  {user.role === "admin" && (
                    <Link to="/admin/products" className="hover:underline font-medium">
                      Адмін
                    </Link>
                  )}
                </>
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

      <main className="mx-auto flex w-full min-h-0 max-w-5xl flex-1 flex-col px-4 py-8 sm:px-5 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-gray-50/80 py-5 text-center text-xs text-brand-muted">
        PC Shop
      </footer>
    </div>
  );
}
