import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { orderStatusLabel } from "../lib/orderStatus.js";

function money(n) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("uk-UA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

export default function Orders() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await api("/api/orders");
        if (!cancelled) setOrders(d.orders || []);
      } catch (e) {
        if (!cancelled) toast.error(e.message || "Помилка");
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (loading || fetching) {
    return <p className="text-sm text-brand-muted">Завантаження…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-ink mb-2">Мої замовлення</h1>
      <p className="text-sm text-brand-muted mb-6">Статус замовлення можна відстежувати тут (оновлення — з боку магазину).</p>

      {orders.length === 0 ? (
        <p className="text-brand-muted">
          Поки немає замовлень.{" "}
          <Link to="/" className="text-brand-orange font-medium hover:underline">
            Перейти в каталог
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-brand-ink">Замовлення #{o.id}</p>
                  <p className="text-xs text-brand-muted mt-1">{formatDate(o.created_at)}</p>
                  <p className="text-sm text-brand-muted mt-1">
                    {o.item_count} {o.item_count === 1 ? "позиція" : "позицій"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-ink">{money(o.total)}</p>
                  <p className="text-sm text-brand-orange font-medium mt-1">{orderStatusLabel(o.status)}</p>
                  <Link to={`/orders/${o.id}`} className="text-xs text-brand-orange hover:underline mt-2 inline-block">
                    Деталі
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
