import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({ full_name, email, phone, password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Помилка реєстрації");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-md">
      <h1 className="text-2xl font-semibold text-brand-ink mb-1 text-center sm:text-left">Реєстрація</h1>
      <p className="text-sm text-brand-muted mb-6 text-center sm:text-left">
        Вже є акаунт?{" "}
        <Link to="/login" className="text-brand-orange font-medium hover:underline">
          Вхід
        </Link>
      </p>

      <form onSubmit={onSubmit} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Ім’я</label>
          <input
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            minLength={2}
            required
          />
        </div>
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
          <label className="block text-xs font-medium text-brand-muted mb-1">Телефон (необов’язково)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-muted mb-1">Пароль (мін. 6 символів)</label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            required
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-brand-orange py-2.5 text-sm font-medium text-white hover:bg-brand-orange-hover disabled:opacity-60"
        >
          {busy ? "Створення…" : "Зареєструватися"}
        </button>
      </form>
      </div>
    </div>
  );
}
