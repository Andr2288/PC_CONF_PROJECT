import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

function money(n) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(n);
}

function buildMockProductFields(category) {
  const idPart = Date.now().toString(36);
  const slugKey = category?.slug;

  const bySlug = {
    cpu: {
      name: "AMD Ryzen 5 7600",
      slug: `amd-ryzen-5-7600-${idPart}`,
      description:
        "6 ядер / 12 потоків, сокет AM5, вбудована графіка Radeon RDNA2. У комплекті — кулер AMD Wraith Stealth.",
      price: "8299",
      stock: "14",
      image_url: "https://placehold.co/480x360/e85d04/ffffff?text=Ryzen+7600",
      specs: {
        socket: "AM5",
        tdpW: 65,
      },
    },
    motherboard: {
      name: "ASUS B650M-PLUS WIFI",
      slug: `asus-b650m-plus-wifi-${idPart}`,
      description: "Материнська плата mATX, сокет AM5, DDR5, Wi‑Fi 6E, PCIe 4.0.",
      price: "6299",
      stock: "11",
      image_url: "https://placehold.co/480x360/2e7d32/ffffff?text=B650M",
      specs: {
        socket: "AM5",
        ramType: "DDR5",
        formFactor: "mATX",
      },
    },
    ram: {
      name: "Kingston Fury Beast 32GB DDR5 5600",
      slug: `kingston-fury-beast-32-ddr5-5600-${idPart}`,
      description: "Комплект 2×16 ГБ, профілі AMD EXPO та Intel XMP, швидкість 5600 МГц.",
      price: "3699",
      stock: "22",
      image_url: "https://placehold.co/480x360/6a1b9a/ffffff?text=DDR5+32",
      specs: {
        ramType: "DDR5",
        sizeGb: 32,
        speedMhz: 5600,
      },
    },
    gpu: {
      name: "NVIDIA GeForce RTX 4060 8GB",
      slug: `nvidia-rtx-4060-8gb-${idPart}`,
      description: "8 ГБ GDDR6, енергоспоживання до 115 Вт. Підходить для ігор у Full HD на високих налаштуваннях.",
      price: "11299",
      stock: "7",
      image_url: "https://placehold.co/480x360/222222/76b900?text=RTX+4060",
      specs: {
        vramGb: 8,
        tdpW: 115,
      },
    },
    storage: {
      name: "Samsung 990 PRO 1TB NVMe",
      slug: `samsung-990-pro-1tb-${idPart}`,
      description: "SSD M.2 NVMe PCIe 4.0, до 7450 МБ/с читання, ємність 1 ТБ.",
      price: "5499",
      stock: "19",
      image_url: "https://placehold.co/480x360/1428a0/ffffff?text=990+PRO",
      specs: {
        interface: "NVMe",
        capacityGb: 1000,
      },
    },
    psu: {
      name: "DeepCool PK750D 750W",
      slug: `deepcool-pk750d-750w-${idPart}`,
      description: "Блок живлення 750 Вт, сертифікат 80+ Bronze, надійна платформа для середнього класу ПК.",
      price: "2499",
      stock: "16",
      image_url: "https://placehold.co/480x360/455a64/ffffff?text=750W",
      specs: {
        wattage: 750,
        cert: "80+ Bronze",
      },
    },
  };

  const base = bySlug[slugKey] || bySlug.cpu;
  return {
    category_id: category?.id != null ? String(category.id) : "",
    name: base.name,
    slug: base.slug,
    description: base.description,
    price: base.price,
    stock: base.stock,
    image_url: base.image_url,
    specsText: JSON.stringify(base.specs, null, 2),
  };
}

async function uploadImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return data.url;
}

export default function AdminProducts() {
  const { user, loading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [category_id, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [image_url, setImageUrl] = useState("");
  const [specsText, setSpecsText] = useState("{}");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const [catData, prodData] = await Promise.all([api("/api/catalog/categories"), api("/api/admin/products")]);
      setCategories(catData.categories || []);
      setItems(prodData.items || []);
    } catch (e) {
      toast.error(e.message || "Помилка завантаження");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    loadList();
  }, [user, loadList]);

  const applyNewProductTemplate = useCallback((category) => {
    if (!category) return;
    const m = buildMockProductFields(category);
    setCategoryId(m.category_id);
    setName(m.name);
    setSlug(m.slug);
    setDescription(m.description);
    setPrice(m.price);
    setStock(m.stock);
    setImageUrl(m.image_url);
    setSpecsText(m.specsText);
  }, []);

  const resetForm = useCallback(() => {
    setEditingId(null);
    if (!categories.length) {
      setCategoryId("");
      setName("");
      setSlug("");
      setDescription("");
      setPrice("");
      setStock("");
      setImageUrl("");
      setSpecsText("{}");
      return;
    }
    applyNewProductTemplate(categories[0]);
  }, [categories, applyNewProductTemplate]);

  useEffect(() => {
    if (!categories.length || editingId != null) return;
    resetForm();
  }, [categories, editingId, resetForm]);

  function startEdit(row) {
    setEditingId(row.id);
    setCategoryId(String(row.category_id));
    setName(row.name);
    setSlug(row.slug);
    setDescription(row.description);
    setPrice(String(row.price));
    setStock(String(row.stock));
    setImageUrl(row.image_url || "");
    setSpecsText(row.specs ? JSON.stringify(row.specs, null, 2) : "{}");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e) {
    e.preventDefault();
    let specsPayload = null;
    const trimmed = specsText.trim();
    if (trimmed && trimmed !== "{}") {
      try {
        specsPayload = JSON.parse(trimmed);
      } catch {
        toast.error("Поле «Характеристики» має бути валідним JSON");
        return;
      }
    }

    setBusy(true);
    try {
      if (editingId) {
        await api(`/api/admin/products/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            category_id: Number(category_id),
            name: name.trim(),
            slug: slug.trim().toLowerCase(),
            description: description.trim(),
            price: Number(price),
            stock: parseInt(stock, 10),
            image_url: image_url.trim(),
            specs: specsPayload,
          }),
        });
        toast.success("Товар оновлено");
      } else {
        await api("/api/admin/products", {
          method: "POST",
          body: JSON.stringify({
            category_id: Number(category_id),
            name: name.trim(),
            slug: slug.trim().toLowerCase(),
            description: description.trim(),
            price: Number(price),
            stock: parseInt(stock, 10),
            image_url: image_url.trim(),
            specs: specsPayload,
          }),
        });
        toast.success("Товар створено");
      }
      await loadList();
      resetForm();
    } catch (err) {
      toast.error(err.message || "Помилка");
    } finally {
      setBusy(false);
    }
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
      toast.success("Зображення завантажено");
    } catch (err) {
      toast.error(err.message || "Не вдалося завантажити");
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Видалити товар з каталогу? Якщо він уже купувався, він буде лише знятий з продажу.")) return;
    try {
      const data = await api(`/api/admin/products/${id}`, { method: "DELETE" });
      if (data.archived) {
        if (data.alreadyArchived) {
          toast.success("Товар уже знято з продажу");
        } else {
          toast.success("Знято з продажу (товар був у замовленнях — рядок збережено для історії)");
        }
      } else {
        toast.success("Видалено");
      }
      await loadList();
      if (editingId === id) resetForm();
    } catch (err) {
      toast.error(err.message || "Помилка");
    }
  }

  if (!loading && (!user || user.role !== "admin")) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-brand-ink mb-2">Доступ заборонено</h1>
        <p className="text-brand-muted mb-4">Ця сторінка лише для адміністратора.</p>
        <Link to="/" className="text-brand-orange font-medium hover:underline">
          На головну
        </Link>
      </div>
    );
  }

  if (loading || listLoading) {
    return <p className="text-sm text-brand-muted">Завантаження…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-ink mb-2">Адмін: товари</h1>
      <p className="text-sm text-brand-muted mb-6">Створення, редагування, видалення та завантаження зображення.</p>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm mb-10">
        <h2 className="text-lg font-semibold text-brand-ink mb-4">{editingId ? `Редагування #${editingId}` : "Новий товар"}</h2>
        <form onSubmit={onSubmit} className="max-w-2xl space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-brand-muted mb-1">Категорія *</label>
              <select
                required
                value={category_id}
                onChange={(e) => {
                  const v = e.target.value;
                  setCategoryId(v);
                  if (editingId != null) return;
                  const cat = categories.find((c) => String(c.id) === v);
                  if (cat) applyNewProductTemplate(cat);
                }}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">Slug * (латиниця, дефіс)</label>
              <input
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
                placeholder="my-product-slug"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-brand-muted mb-1">Назва *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-brand-muted mb-1">Опис *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-brand-muted mb-1">Ціна (UAH) *</label>
              <input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">Залишок *</label>
              <input required type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-brand-muted mb-1">URL зображення</label>
            <div className="flex flex-wrap gap-2">
              <input
                value={image_url}
                onChange={(e) => setImageUrl(e.target.value)}
                className="min-w-[200px] flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="https://… або завантажте файл"
              />
              <label className="inline-flex items-center justify-center rounded border border-gray-300 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                {uploading ? "…" : "Файл"}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onPickFile} disabled={uploading} />
              </label>
            </div>
            {image_url && (
              <div className="mt-2 h-24 w-32 rounded border border-gray-200 overflow-hidden bg-gray-50">
                <img src={image_url} alt="" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-brand-muted mb-1">Характеристики (JSON)</label>
            <textarea rows={10} value={specsText} onChange={(e) => setSpecsText(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono text-xs" />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded bg-brand-orange px-4 py-2 text-sm font-medium text-white hover:bg-brand-orange-hover disabled:opacity-50"
            >
              {busy ? "Збереження…" : editingId ? "Зберегти зміни" : "Створити товар"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                Скасувати редагування
              </button>
            )}
          </div>
        </form>
      </div>

      <h2 className="text-lg font-semibold text-brand-ink mb-3">Список товарів</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-brand-muted uppercase">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Назва</th>
              <th className="px-3 py-2">Категорія</th>
              <th className="px-3 py-2">Ціна</th>
              <th className="px-3 py-2">Склад</th>
              <th className="px-3 py-2 w-28" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2 font-mono text-xs">{row.id}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {row.is_active === false ? (
                      <span className="text-brand-muted" title={row.slug}>
                        {row.name}
                      </span>
                    ) : (
                      <Link to={`/product/${row.slug}`} className="text-brand-orange hover:underline">
                        {row.name}
                      </Link>
                    )}
                    {row.is_active === false && (
                      <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium uppercase text-brand-muted">
                        знято
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-brand-muted">{row.category_name}</td>
                <td className="px-3 py-2 whitespace-nowrap">{money(row.price)}</td>
                <td className="px-3 py-2">{row.stock}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <button type="button" onClick={() => startEdit(row)} className="text-brand-orange text-xs hover:underline mr-2">
                    Змінити
                  </button>
                  <button type="button" onClick={() => onDelete(row.id)} className="text-red-600 text-xs hover:underline">
                    Видалити
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
