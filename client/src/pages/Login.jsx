import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Помилка входу");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-brand-ink mb-1">Вхід</h1>
      <p className="text-sm text-brand-muted mb-6">
        Немає акаунта?{" "}
        <Link to="/register" className="text-brand-orange font-medium hover:underline">
          Реєстрація
        </Link>
      </p>

      <form onSubmit={onSubmit} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Email</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Пароль</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            required
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-brand-orange py-2.5 text-sm font-medium text-white hover:bg-brand-orange-hover disabled:opacity-60"
        >
          {busy ? "Вхід…" : "Увійти"}
        </button>
      </form>
    </div>
  );
}
