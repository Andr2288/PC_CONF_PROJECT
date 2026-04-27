import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useInCart } from "../hooks/useInCart.js";
import { addToConfiguratorDraft } from "../lib/configurator";

function money(n) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(n);
}

const SPEC_LABELS = {
  socket: "Сокет",
  ramType: "Тип ОЗП",
  sizeGb: "Об'єм (ГБ)",
  speedMhz: "Частота (МГц)",
  tdpW: "TDP (Вт)",
  vramGb: "VRAM (ГБ)",
  formFactor: "Форм-фактор",
  wattage: "Потужність (Вт)",
  cert: "Сертифікація",
  interface: "Інтерфейс",
  capacityGb: "Ємність (ГБ)",
};

function specLabel(key) {
  return SPEC_LABELS[key] || key;
}

function formatSpecValue(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default function Product() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { inCartIds, addingToCartId, addToCart } = useInCart(user);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setProduct(null);
    (async () => {
      try {
        const data = await api(`/api/catalog/products/${encodeURIComponent(slug)}`);
        if (!cancelled) setProduct(data.product);
      } catch (e) {
        if (!cancelled) {
          setError(e.status === 404 ? "Товар не знайдено" : e.message || "Помилка");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const addToCfg = useCallback(() => {
    if (!product) return;
    addToConfiguratorDraft(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        category_slug: product.category_slug,
        specs: product.specs,
      },
      user
    );
    toast.success("Додано в чернетку конфігуратора");
  }, [product, user]);

  if (loading) {
    return <p className="text-sm text-brand-muted">Завантаження…</p>;
  }

  if (error || !product) {
    return (
      <div>
        <p className="text-red-600 mb-4">{error || "Товар не знайдено"}</p>
        <Link to="/" className="text-brand-orange font-medium hover:underline">
          До каталогу
        </Link>
      </div>
    );
  }

  const specEntries =
    product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
      ? Object.entries(product.specs)
      : [];

  const catalogLink = product.category_slug ? `/?category=${encodeURIComponent(product.category_slug)}` : "/";

  return (
    <div>
      <nav className="text-sm text-brand-muted mb-4">
        <Link to="/" className="hover:text-brand-orange">
          Каталог
        </Link>
        <span className="mx-2">/</span>
        <Link to={catalogLink} className="hover:text-brand-orange">
          {product.category_name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-brand-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-100 overflow-hidden aspect-square max-h-[420px]">
          <img src={product.image_url} alt="" className="h-full w-full object-contain bg-white" />
        </div>

        <div>
          <p className="text-sm text-brand-orange font-medium mb-1">{product.category_name}</p>
          <h1 className="text-2xl font-semibold text-brand-ink mb-3">{product.name}</h1>
          <p className="text-3xl font-bold text-brand-ink mb-2">{money(product.price)}</p>
          <p className={`text-sm mb-6 ${product.stock > 0 ? "text-brand-green" : "text-red-600"}`}>
            {product.stock > 0 ? `На складі: ${product.stock} шт.` : "Немає в наявності"}
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            {user ? (
              inCartIds.has(product.id) ? (
                <Link
                  to="/cart"
                  className="inline-flex items-center justify-center rounded border-2 border-brand-orange bg-orange-50 px-5 py-2.5 text-sm font-medium text-brand-orange hover:bg-orange-100"
                >
                  У кошику
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={product.stock < 1 || addingToCartId === product.id}
                  onClick={() => addToCart(product.id)}
                  className="rounded bg-brand-orange px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-orange-hover disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {addingToCartId === product.id ? "Додаємо…" : "Додати в кошик"}
                </button>
              )
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded bg-gray-200 px-5 py-2.5 text-sm font-medium text-brand-ink hover:bg-gray-300"
              >
                У кошик (потрібен вхід)
              </Link>
            )}
            <button
              type="button"
              onClick={addToCfg}
              className="rounded border-2 border-brand-green px-5 py-2.5 text-sm font-medium text-brand-green hover:bg-green-50"
            >
              У конфігуратор
            </button>
          </div>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-brand-ink mb-2">Опис</h2>
            <p className="text-sm text-brand-ink whitespace-pre-wrap leading-relaxed">{product.description}</p>
          </section>

          {specEntries.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-brand-ink mb-3">Характеристики</h2>
              <dl className="rounded-lg border border-gray-200 divide-y divide-gray-100 bg-white text-sm">
                {specEntries.map(([key, val]) => (
                  <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-1 px-3 py-2 sm:gap-4">
                    <dt className="text-brand-muted">{specLabel(key)}</dt>
                    <dd className="font-medium text-brand-ink">{formatSpecValue(val)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
