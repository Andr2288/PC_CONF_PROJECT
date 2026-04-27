import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api";

function money(n) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(n);
}

export default function Cart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api("/api/cart");
      setData(d);
    } catch (e) {
      toast.error(e.message || "Не вдалося завантажити кошик");
      setData({ items: [], totalQty: 0, totalPrice: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().then(() => window.dispatchEvent(new Event("pcshop-cart-update")));
  }, [load]);

  const setQty = useCallback(
    async (productId, quantity) => {
      setUpdatingId(productId);
      try {
        await api(`/api/cart/items/${productId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity }),
        });
        await load();
        window.dispatchEvent(new Event("pcshop-cart-update"));
      } catch (e) {
        toast.error(e.message || "Помилка");
      } finally {
        setUpdatingId(null);
      }
    },
    [load]
  );

  const remove = useCallback(
    async (productId) => {
      setUpdatingId(productId);
      try {
        await api(`/api/cart/items/${productId}`, { method: "DELETE" });
        await load();
        window.dispatchEvent(new Event("pcshop-cart-update"));
        toast.success("Прибрано з кошика");
      } catch (e) {
        toast.error(e.message || "Помилка");
      } finally {
        setUpdatingId(null);
      }
    },
    [load]
  );

  if (loading && !data) {
    return <p className="text-sm text-brand-muted">Завантаження…</p>;
  }

  const items = data?.items || [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-ink mb-2">Кошик</h1>
      <p className="text-sm text-brand-muted mb-6">
        Кількість можна змінювати тут. У каталозі показується залишок на складі (без урахування вашого кошика).
      </p>

      {items.length === 0 ? (
        <p className="text-brand-muted mb-4">
          Порожньо. Перейдіть у{" "}
          <Link to="/" className="text-brand-orange font-medium hover:underline">
            каталог
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-brand-muted uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2">Товар</th>
                  <th className="px-3 py-2 hidden sm:table-cell">На складі</th>
                  <th className="px-3 py-2 w-32">К-сть</th>
                  <th className="px-3 py-2 text-right">Сума</th>
                  <th className="px-2 py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((row) => (
                  <tr key={row.product_id}>
                    <td className="px-3 py-3">
                      <p className="font-medium text-brand-ink">{row.name}</p>
                      <p className="text-xs text-brand-muted sm:hidden">На складі: {row.stock}</p>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-brand-muted">{row.stock}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={updatingId === row.product_id || row.quantity <= 1}
                          onClick={() => setQty(row.product_id, row.quantity - 1)}
                          className="h-8 w-8 rounded border border-gray-300 text-lg leading-none hover:bg-gray-50 disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] text-center font-medium">{row.quantity}</span>
                        <button
                          type="button"
                          disabled={updatingId === row.product_id || row.quantity >= row.stock}
                          onClick={() => setQty(row.product_id, row.quantity + 1)}
                          className="h-8 w-8 rounded border border-gray-300 text-lg leading-none hover:bg-gray-50 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium whitespace-nowrap">{money(row.line_total)}</td>
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        disabled={updatingId === row.product_id}
                        onClick={() => remove(row.product_id)}
                        className="text-red-600 text-xs hover:underline disabled:opacity-40"
                      >
                        Видалити
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-base">
            Разом: <span className="font-semibold">{money(data?.totalPrice || 0)}</span>
            <span className="text-brand-muted text-sm ml-2">({data?.totalQty} шт.)</span>
          </p>
        </>
      )}
    </div>
  );
}
