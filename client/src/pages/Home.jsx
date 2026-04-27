import { useEffect, useState } from "react";

export default function Home() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false, db: "down" }));
  }, []);

  return (
    <>
      <h1 className="text-2xl font-semibold text-brand-ink mb-2">Головна</h1>
      <p className="text-brand-muted mb-6 max-w-2xl">
        Далі тут буде каталог. Зараз — перевірка API та БД.
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
          MySQL (XAMPP), <code className="bg-gray-100 px-1 rounded">server/.env</code>,{" "}
          <code className="bg-gray-100 px-1 rounded">npm run setup</code> → пункт 2.
        </p>
      </div>
    </>
  );
}
