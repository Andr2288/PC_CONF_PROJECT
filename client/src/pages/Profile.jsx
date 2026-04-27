import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, loading, updateProfile } = useAuth();
  const [full_name, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name || "");
    setPhone(user.phone || "");
  }, [user]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ full_name: full_name.trim(), phone: phone.trim() });
      toast.success("Збережено");
    } catch (err) {
      toast.error(err.message || "Помилка збереження");
    } finally {
      setBusy(false);
    }
  }

  if (!loading && !user) {
    return <Navigate to="/login" replace state={{ from: "/profile" }} />;
  }

  if (loading) {
    return <p className="text-sm text-brand-muted">Завантаження…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-ink mb-2">Профіль</h1>
      <p className="text-sm text-brand-muted mb-6">Перегляд та зміна контактних даних. Email змінюється лише через підтримку (навчальний MVP).</p>

      <form onSubmit={onSubmit} className="max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-brand-muted"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Ім’я *</label>
          <input
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            minLength={2}
            maxLength={120}
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Телефон</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={40}
            placeholder="+380…"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>
        {user.role === "admin" && (
          <p className="text-xs text-brand-orange">Роль: адміністратор</p>
        )}
        <button
          type="submit"
          disabled={busy || full_name.trim().length < 2}
          className="rounded bg-brand-orange px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-orange-hover disabled:opacity-50"
        >
          {busy ? "Збереження…" : "Зберегти"}
        </button>
      </form>
    </div>
  );
}
