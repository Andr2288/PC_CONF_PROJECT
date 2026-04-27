import { useEffect, useState } from "react";

export default function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false, db: "down" }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-orange text-white shadow">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
          <span className="font-semibold text-lg">PC Shop</span>
          <span className="text-sm opacity-90 hidden sm:inline">MVP · комплектуючі</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 flex-1 w-full">
        <h1 className="text-2xl font-semibold text-brand-ink mb-2">Скелет проєкту</h1>
        <p className="text-brand-muted mb-6 max-w-2xl">
          React + Tailwind (кольори в дусі Rozetka), Node + MySQL. Далі: авторизація та каталог.
        </p>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm max-w-md">
          <p className="text-sm font-medium text-brand-ink mb-2">API / БД</p>
          {health === null && <p className="text-sm text-brand-muted">Перевірка…</p>}
          {health !== null && (
            <p className="text-sm">
              API:{" "}
              <span className={health.ok ? "text-brand-green font-medium" : "text-red-600"}>
                {health.ok ? "ok" : "недоступно"}
              </span>
              {health.db && (
                <>
                  {" · "}
                  БД:{" "}
                  <span className={health.db === "up" ? "text-brand-green font-medium" : "text-red-600"}>
                    {health.db === "up" ? "підключено" : "немає зв’язку"}
                  </span>
                </>
              )}
            </p>
          )}
          <p className="text-xs text-brand-muted mt-3">
            Запустіть MySQL (XAMPP), скопіюйте <code className="bg-gray-100 px-1 rounded">server/.env.example</code> у{" "}
            <code className="bg-gray-100 px-1 rounded">server/.env</code>, потім{" "}
            <code className="bg-gray-100 px-1 rounded">npm run setup</code> → пункт 2.
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-brand-muted">
        Навчальний проєкт
      </footer>
    </div>
  );
}
