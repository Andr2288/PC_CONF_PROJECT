import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useInCart } from "../hooks/useInCart.js";
import { addToConfiguratorDraft, getConfiguratorItems } from "../lib/configurator";

function money(n) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(n);
}

export default function Home() {
  const { user } = useAuth();
  const { inCartIds, addingToCartId, addToCart } = useInCart(user);
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const search = params.get("search") || "";
  const page = Math.max(1, parseInt(params.get("page"), 10) || 1);

  const [categories, setCategories] = useState([]);
  const [catalog, setCatalog] = useState({ items: [], total: 0, pages: 1, page: 1, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(search);
  const [cfgBump, setCfgBump] = useState(0);

  const configCount = useMemo(() => getConfiguratorItems(user).length, [cfgBump, user?.id]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api("/api/catalog/categories");
        if (!cancelled) setCategories(data.categories || []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    if (search) q.set("search", search);
    q.set("page", String(page));
    q.set("limit", "12");

    (async () => {
      try {
        const data = await api(`/api/catalog/products?${q.toString()}`);
        if (cancelled) return;
        setCatalog(data);
        if (page > data.pages && data.pages >= 1) {
          setParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set("page", String(data.pages));
              return next;
            },
            { replace: true }
          );
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Помилка завантаження");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, search, page, setParams]);

  const setCategory = useCallback(
    (slug) => {
      const next = new URLSearchParams(params);
      if (slug) next.set("category", slug);
      else next.delete("category");
      next.set("page", "1");
      setParams(next);
    },
    [params, setParams]
  );

  const applySearch = useCallback(
    (e) => {
      e?.preventDefault?.();
      const next = new URLSearchParams(params);
      const q = searchInput.trim();
      if (q) next.set("search", q);
      else next.delete("search");
      next.set("page", "1");
      setParams(next);
    },
    [params, searchInput, setParams]
  );

  const goPage = useCallback(
    (p) => {
      const next = new URLSearchParams(params);
      next.set("page", String(p));
      setParams(next);
    },
    [params, setParams]
  );

  const addToCfg = useCallback(
    (item) => {
      addToConfiguratorDraft(item, user);
      setCfgBump((x) => x + 1);
      toast.success("Додано в конфігуратор");
    },
    [user]
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand-ink mb-1">Каталог</h1>
        </div>
        {configCount > 0 && (
          <Link
            to="/configurator"
            className="inline-flex items-center justify-center rounded bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-hover shrink-0"
          >
            Конфігуратор ({configCount})
          </Link>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm mb-6">
        <p className="text-xs font-medium text-brand-muted mb-2">Категорія</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={`rounded-full px-3 py-1 text-sm border ${
              !category ? "border-brand-orange bg-orange-50 text-brand-orange font-medium" : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            Усі
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={`rounded-full px-3 py-1 text-sm border ${
                category === c.slug
                  ? "border-brand-orange bg-orange-50 text-brand-orange font-medium"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <form onSubmit={applySearch} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Пошук за назвою…"
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
          <button
            type="submit"
            className="rounded bg-brand-orange px-4 py-2 text-sm font-medium text-white hover:bg-brand-orange-hover"
          >
            Шукати
          </button>
        </form>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-sm text-brand-muted">Завантаження…</p>}

      {!loading && !error && (
        <>
          <p className="text-sm text-brand-muted mb-3">
            Знайдено: {catalog.total} {catalog.total === 1 ? "товар" : "товарів"}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.items.map((p) => (
              <li
                key={p.id}
                className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow"
              >
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gray-100">
                  <img
                    src={p.image_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-xs text-brand-orange font-medium mb-1">{p.category_name}</p>
                  <Link
                    to={`/product/${p.slug}`}
                    className="font-medium text-brand-ink text-sm leading-snug line-clamp-2 mb-2 hover:text-brand-orange"
                  >
                    {p.name}
                  </Link>
                  <p className="text-lg font-semibold text-brand-ink mt-auto">{money(p.price)}</p>
                  <p className={`text-xs mt-1 ${p.stock > 0 ? "text-brand-green" : "text-red-600"}`}>
                    {p.stock > 0 ? `На складі: ${p.stock} шт.` : "Немає в наявності"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {user ? (
                      inCartIds.has(p.id) ? (
                        <Link
                          to="/cart"
                          className="flex-1 min-w-[120px] text-center rounded border-2 border-brand-orange bg-orange-50 py-2 text-xs font-medium text-brand-orange hover:bg-orange-100"
                        >
                          У кошику
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={p.stock < 1 || addingToCartId === p.id}
                          onClick={() => addToCart(p.id)}
                          className="flex-1 min-w-[120px] rounded bg-brand-orange py-2 text-xs font-medium text-white hover:bg-brand-orange-hover disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {addingToCartId === p.id ? "Додаємо…" : "У кошик"}
                        </button>
                      )
                    ) : (
                      <Link
                        to="/login"
                        className="flex-1 min-w-[120px] text-center rounded bg-gray-200 py-2 text-xs font-medium text-brand-ink hover:bg-gray-300"
                      >
                        У кошик (вхід)
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        addToCfg({
                          id: p.id,
                          name: p.name,
                          price: p.price,
                          category_slug: p.category_slug,
                          specs: p.specs,
                        })
                      }
                      className="flex-1 min-w-[120px] rounded border border-brand-green py-2 text-xs font-medium text-brand-green hover:bg-green-50"
                    >
                      У конфігуратор
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {catalog.pages > 1 && (
            <nav className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
                className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
              >
                Назад
              </button>
              <span className="text-sm text-brand-muted px-2">
                {page} / {catalog.pages}
              </span>
              <button
                type="button"
                disabled={page >= catalog.pages}
                onClick={() => goPage(page + 1)}
                className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
              >
                Далі
              </button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
