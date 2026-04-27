import { useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  clearConfigurator,
  clearSlot,
  getConfiguratorItems,
  getSlotItems,
  removeConfiguratorItem,
  tryCopyCurrentToSlot,
} from "../lib/configurator";
import { checkCompatibility, compareBuilds } from "../lib/configuratorAnalysis";

function money(n) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(n);
}

function sumItems(items) {
  return items.reduce((s, x) => s + Number(x.price || 0), 0);
}

function panelClass(level) {
  if (level === "ok") return "border-emerald-200 bg-emerald-50";
  if (level === "warn") return "border-amber-200 bg-amber-50";
  return "border-gray-200 bg-gray-50";
}

export default function Configurator() {
  const { user } = useAuth();
  /** Лічильник, щоб після кожної зміни localStorage зробився повторний рендер і все перечиталося */
  const [, setRenderTick] = useState(0);
  const refresh = () => setRenderTick((n) => n + 1);

  const items = getConfiguratorItems(user);
  const slotA = getSlotItems("a", user);
  const slotB = getSlotItems("b", user);

  const total = sumItems(items);
  const compat = checkCompatibility(items);
  const compatA = checkCompatibility(slotA);
  const compatB = checkCompatibility(slotB);
  const comparison = compareBuilds(slotA, slotB);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-ink mb-2">Конфігуратор ПК</h1>
      <p className="text-sm text-brand-muted mb-6 max-w-2xl">
        Список зберігається лише в цьому браузері, окремо для гостя і для власного акаунта. Ми намагаємось підказати, чи
        пасують у списку процесор, плата й пам’ять. Щоб порівняти два плани — збережіть у A один набір, у B інший
        (спочатку додайте/приберіть товари, потім кнопкою скопіювати).
      </p>

      {items.length === 0 ? (
        <p className="text-brand-muted mb-4">
          Список поточної чернетки порожній. Додайте комплектуючі з{" "}
          <Link to="/" className="text-brand-orange font-medium hover:underline">
            каталогу
          </Link>
          .
        </p>
      ) : (
        <ul className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 shadow-sm mb-4">
          {items.map((row) => (
            <li
              key={`${row.id}-${row.category_slug}`}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium text-brand-ink">{row.name}</p>
                <p className="text-xs text-brand-muted">{row.category_slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-brand-ink">{money(row.price)}</span>
                <button
                  type="button"
                  onClick={() => {
                    removeConfiguratorItem(row.id, user);
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
      )}

      <p className="text-sm mb-4">
        Орієнтовна сума: <span className="font-semibold">{money(total)}</span>
      </p>

      <div className={`rounded-lg border p-4 mb-6 text-sm ${panelClass(compat.level)}`}>
        <p className="font-medium text-brand-ink mb-2">Перевірка сумісності (поточна чернетка)</p>
        <ul className="list-disc pl-5 space-y-1 text-brand-ink">
          {compat.lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            type="button"
            onClick={() => {
              if (!tryCopyCurrentToSlot("a", user)) {
                toast.error("Порівняння потребує різні варіанти. Поточна чернетка вже збігається з B — змініть товари або очистіть B.");
                return;
              }
              refresh();
              toast.success("Скопійовано в збірку A");
            }}
            className="rounded border border-brand-green bg-white px-3 py-2 text-sm text-brand-green hover:bg-green-50"
          >
            Поточне → A
          </button>
          <button
            type="button"
            onClick={() => {
              if (!tryCopyCurrentToSlot("b", user)) {
                toast.error("Порівняння потребує різні варіанти. Поточна чернетка вже збігається з A — змініть товари або очистіть A.");
                return;
              }
              refresh();
              toast.success("Скопійовано в збірку B");
            }}
            className="rounded border border-brand-green bg-white px-3 py-2 text-sm text-brand-green hover:bg-green-50"
          >
            Поточне → B
          </button>
          <button
            type="button"
            onClick={() => {
              clearConfigurator(user);
              refresh();
            }}
            className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            Очистити поточне
          </button>
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-brand-ink mb-3">Збірки для порівняння</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {["a", "b"].map((slot) => {
            const data = slot === "a" ? slotA : slotB;
            const c = slot === "a" ? compatA : compatB;
            const t = sumItems(data);
            return (
              <div
                key={slot}
                className={`rounded-lg border p-4 text-sm ${
                  slot === "a" ? "border-blue-200 bg-blue-50/50" : "border-violet-200 bg-violet-50/50"
                }`}
              >
                <p className="font-medium text-brand-ink mb-1">Збірка {slot.toUpperCase()}</p>
                <p className="text-xs text-brand-muted mb-2">
                  {data.length} поз. · {money(t)}
                </p>
                {data.length > 0 && (
                  <p className="text-xs text-brand-ink mb-2 line-clamp-3" title={data.map((d) => d.name).join(", ")}>
                    {data.map((d) => d.name).join(" · ")}
                  </p>
                )}
                {data.length === 0 ? (
                  <p className="text-brand-muted">Порожньо. «Поточне → {slot.toUpperCase()}» після додавання в чернетку.</p>
                ) : (
                  <ul className="text-xs space-y-1 text-brand-ink mb-2 border-t border-gray-200/80 pt-2">
                    {c.lines.map((l, i) => (
                      <li key={i}>
                        {l}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => {
                    clearSlot(slot, user);
                    refresh();
                    toast.success(`Збірка ${slot.toUpperCase()} очищена`);
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Очистити {slot.toUpperCase()}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-ink mb-2">{comparison.title}</h2>
        <ul className="text-sm text-brand-ink space-y-2 list-disc pl-5">
          {comparison.body.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
