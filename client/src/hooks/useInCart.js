import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api";
import { CART_UPDATE_EVENT } from "../lib/cartEvents.js";

export function useInCart(user) {
  const [inCartIds, setInCartIds] = useState(() => new Set());
  const [addingToCartId, setAddingToCartId] = useState(null);

  useEffect(() => {
    if (!user) {
      setInCartIds(new Set());
      return undefined;
    }
    let cancelled = false;
    async function loadCartIds() {
      try {
        const d = await api("/api/cart");
        if (!cancelled) {
          setInCartIds(new Set((d.items || []).map((i) => i.product_id)));
        }
      } catch {
        if (!cancelled) setInCartIds(new Set());
      }
    }
    loadCartIds();
    const onUpdate = () => loadCartIds();
    window.addEventListener(CART_UPDATE_EVENT, onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(CART_UPDATE_EVENT, onUpdate);
    };
  }, [user]);

  const addToCart = useCallback(async (productId) => {
    setAddingToCartId(productId);
    try {
      const data = await api("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity: 1, from_catalog: true }),
      });
      if (data.alreadyInCart) {
        toast("Цей товар уже у кошику — змініть кількість у кошику", { icon: "ℹ️" });
      } else {
        toast.success("Товар додано в кошик");
      }
      setInCartIds((prev) => new Set(prev).add(productId));
      window.dispatchEvent(new Event(CART_UPDATE_EVENT));
    } catch (e) {
      toast.error(e.message || "Не вдалося додати в кошик");
    } finally {
      setAddingToCartId(null);
    }
  }, []);

  return { inCartIds, addingToCartId, addToCart };
}
