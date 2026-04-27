import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { CART_UPDATE_EVENT } from "../lib/cartEvents.js";
import { deliveryAddressIsPlausible } from "../lib/validateAddress.js";

function money(n) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(n);
}

export default function Checkout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [options, setOptions] = useState({ payment_methods: [], shipping_methods: [] });
  const [delivery_address, setDeliveryAddress] = useState("");
  const [payment_method, setPaymentMethod] = useState("");
  const [shipping_method, setShippingMethod] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [cartData, optData] = await Promise.all([api("/api/cart"), api("/api/orders/form-options")]);
    setCart(cartData);
    setOptions(optData);
    setPaymentMethod((prev) => prev || optData.payment_methods?.[0] || "");
    setShippingMethod((prev) => prev || optData.shipping_methods?.[0] || "");
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        await load();
      } catch (e) {
        toast.error(e.message || "Помилка");
      }
    })();
  }, [user, load]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { order } = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({ delivery_address, payment_method, shipping_method }),
      });
      window.dispatchEvent(new Event(CART_UPDATE_EVENT));
      toast.success("Замовлення оформлено");
      navigate(`/orders/${order.id}`);
    } catch (err) {
      toast.error(err.message || "Помилка оформлення");
    } finally {
      setBusy(false);
    }
  }

  if (!loading && !user) {
    return <Navigate to="/login" replace state={{ from: "/checkout" }} />;
  }

  if (loading || !cart) {
    return <p className="text-sm text-brand-muted">Завантаження…</p>;
  }

  if (!cart.items?.length) {
    return (
      <div>
        <p className="text-brand-muted mb-4">Кошик порожній — додайте товари перед оформленням.</p>
        <Link to="/cart" className="text-brand-orange font-medium hover:underline">
          До кошика
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-ink mb-2">Оформлення замовлення</h1>
      <p className="text-sm text-brand-muted mb-6">
        Разом до сплати: <span className="font-semibold text-brand-ink">{money(cart.totalPrice)}</span> ({cart.totalQty}{" "}
        шт.)
      </p>

      <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Адреса доставки *</label>
          <textarea
            required
            minLength={10}
            maxLength={500}
            rows={4}
            value={delivery_address}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            placeholder="Місто, відділення / вулиця, будинок, квартира…"
          />
          {delivery_address.trim().length >= 10 && !deliveryAddressIsPlausible(delivery_address) && (
            <p className="text-xs text-red-600 mt-1">
              Невірний формат вводу. Потрібні літери або цифри (наприклад, місто, номер відділення).
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Оплата *</label>
          <select
            required
            value={payment_method}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          >
            {options.payment_methods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Доставка *</label>
          <select
            required
            value={shipping_method}
            onChange={(e) => setShippingMethod(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          >
            {options.shipping_methods.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={busy || delivery_address.trim().length < 10 || !deliveryAddressIsPlausible(delivery_address)}
            className="rounded bg-brand-orange px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-orange-hover disabled:opacity-50"
          >
            {busy ? "Відправка…" : "Підтвердити замовлення"}
          </button>
          <Link to="/cart" className="inline-flex items-center rounded border border-gray-300 px-5 py-2.5 text-sm hover:bg-gray-50">
            Назад до кошика
          </Link>
        </div>
      </form>
    </div>
  );
}
