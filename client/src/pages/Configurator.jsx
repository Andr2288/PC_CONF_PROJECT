import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { clearConfigurator, getConfiguratorItems, removeConfiguratorItem } from "../lib/configurator";

function money(n) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(n);
}

export default function Configurator() {
  const [, bump] = useState(0);
  const items = useMemo(() => getConfiguratorItems(), [bump]);

  function refresh() {
    bump((x) => x + 1);
  }

  const total = items.reduce((s, x) => s + Number(x.price || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-ink mb-2">Конфігуратор ПК</h1>
      <p className="text-sm text-brand-muted mb-6 max-w-2xl">
        Чернетка з головної (локально в браузері). Далі тут буде сумісність і порівняння збірок.
      </p>

      {items.length === 0 ? (
        <p className="text-brand-muted mb-4">
          Список порожній. Додайте комплектуючі з{" "}
          <Link to="/" className="text-brand-orange font-medium hover:underline">
            каталогу
          </Link>
          .
        </p>
      ) : (
        <>
          <ul className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 shadow-sm mb-4">
            {items.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium text-brand-ink">{row.name}</p>
                  <p className="text-xs text-brand-muted">{row.category_slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-brand-ink">{money(row.price)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      removeConfiguratorItem(row.id);
                      refresh();
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Прибрати
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-sm mb-4">
            Орієнтовно: <span className="font-semibold">{money(total)}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              clearConfigurator();
              refresh();
            }}
            className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Очистити все
          </button>
        </>
      )}
    </div>
  );
}
