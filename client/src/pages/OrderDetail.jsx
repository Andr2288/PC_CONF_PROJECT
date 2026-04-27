import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
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

export default function OrderDetail() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const [order, setOrder] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      setNotFound(false);
      try {
        const d = await api(`/api/orders/${id}`);
        if (!cancelled) setOrder(d.order);
      } catch (e) {
        if (e.status === 404) {
          if (!cancelled) setNotFound(true);
        } else if (!cancelled) {
          toast.error(e.message || "Помилка");
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (loading || fetching) {
    return <p className="text-sm text-brand-muted">Завантаження…</p>;
  }

  if (notFound || !order) {
    return (
      <div>
        <p className="text-brand-muted mb-4">Замовлення не знайдено.</p>
        <Link to="/orders" className="text-brand-orange font-medium hover:underline">
          До списку замовлень
        </Link>
      </div>
    );
  }

  return (
    <div>
      <nav className="text-sm text-brand-muted mb-4">
        <Link to="/orders" className="hover:text-brand-orange">
          Мої замовлення
        </Link>
        <span className="mx-2">/</span>
        <span className="text-brand-ink">#{order.id}</span>
      </nav>

      <h1 className="text-2xl font-semibold text-brand-ink mb-2">Замовлення #{order.id}</h1>
      <p className="text-sm text-brand-orange font-medium mb-1">{orderStatusLabel(order.status)}</p>
      <p className="text-xs text-brand-muted mb-6">{formatDate(order.created_at)}</p>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm mb-6 text-sm space-y-2">
        <p>
          <span className="text-brand-muted">Адреса:</span> {order.delivery_address}
        </p>
        <p>
          <span className="text-brand-muted">Оплата:</span> {order.payment_method}
        </p>
        <p>
          <span className="text-brand-muted">Доставка:</span> {order.shipping_method}
        </p>
      </div>

      <h2 className="text-lg font-semibold text-brand-ink mb-3">Склад замовлення</h2>
      <ul className="rounded-lg border border-gray-200 divide-y divide-gray-100 bg-white text-sm shadow-sm">
        {order.items.map((row) => (
          <li key={row.product_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <Link to={`/product/${row.slug}`} className="font-medium text-brand-ink hover:text-brand-orange">
                {row.name}
              </Link>
              <p className="text-xs text-brand-muted">{row.quantity} шт. × {money(row.price_at_purchase)}</p>
            </div>
            <span className="font-medium">{money(row.line_total)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-base">
        Разом: <span className="font-semibold">{money(order.total)}</span>
      </p>
    </div>
  );
}
