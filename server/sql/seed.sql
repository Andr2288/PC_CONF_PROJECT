SET NAMES utf8mb4;

-- Зображення товарів: Unsplash (https://unsplash.com/license) — прямі URL CDN images.unsplash.com, w=800.
INSERT INTO categories (id, name, slug, sort_order) VALUES
  (1, 'Процесори', 'cpu', 1),
  (2, 'Материнські плати', 'motherboard', 2),
  (3, 'ОЗП', 'ram', 3),
  (4, 'Відеокарти', 'gpu', 4),
  (5, 'SSD / HDD', 'storage', 5),
  (6, 'Блоки живлення', 'psu', 6)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);

INSERT INTO products (category_id, name, slug, description, price, stock, image_url, specs) VALUES
  (1, 'AMD Ryzen 5 7600', 'amd-ryzen-5-7600', '6 ядер / 12 потоків, AM5, з графікою RDNA2.', 8299.00, 15, 'https://images.unsplash.com/photo-1666868213704-1677b7f04c30?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('socket', 'AM5', 'tdpW', 65)),
  (1, 'AMD Ryzen 7 7800X3D', 'amd-ryzen-7-7800x3d', '8C/16T, AM5, 3D V-Cache — топ для ігор.', 15299.00, 8, 'https://images.unsplash.com/photo-1721332154191-ba5f1534266e?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('socket', 'AM5', 'tdpW', 120)),
  (1, 'Intel Core i5-13400F', 'intel-i5-13400f', '10 ядер (6P+4E), LGA1700, без вбудованої графіки.', 7199.00, 22, 'https://images.unsplash.com/photo-1660855552442-1bae49431379?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('socket', 'LGA1700', 'tdpW', 65)),
  (1, 'Intel Core i7-13700K', 'intel-i7-13700k', '16 ядер, LGA1700, розгін.', 14499.00, 6, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('socket', 'LGA1700', 'tdpW', 125)),

  (2, 'ASUS B650M-PLUS WIFI', 'asus-b650m-plus-wifi', 'mATX, AM5, DDR5, Wi‑Fi 6E.', 6299.00, 12, 'https://images.unsplash.com/photo-1694857807827-cd901ede9ba4?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('socket', 'AM5', 'ramType', 'DDR5', 'formFactor', 'mATX')),
  (2, 'Gigabyte B760M DS3H', 'gigabyte-b760m-ds3h', 'mATX, LGA1700, DDR4.', 4199.00, 18, 'https://images.unsplash.com/photo-1694857887769-6ff4c0ef9372?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('socket', 'LGA1700', 'ramType', 'DDR4', 'formFactor', 'mATX')),
  (2, 'MSI Z790-P WIFI', 'msi-z790-p-wifi', 'ATX, LGA1700, DDR5, Wi‑Fi.', 8999.00, 7, 'https://images.unsplash.com/photo-1511415932124-42efedd2eacf?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('socket', 'LGA1700', 'ramType', 'DDR5', 'formFactor', 'ATX')),

  (3, 'Kingston Fury 32GB DDR5 6000', 'kingston-fury-32-ddr5-6000', '2×16 ГБ, kit для AM5 / Intel 12–14 gen.', 3899.00, 30, 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('ramType', 'DDR5', 'sizeGb', 32, 'speedMhz', 6000)),
  (3, 'Corsair Vengeance 32GB DDR4 3200', 'corsair-vengeance-32-ddr4-3200', '2×16 ГБ, універсальний DDR4.', 2999.00, 40, 'https://images.unsplash.com/photo-1760708626495-91e1415be067?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('ramType', 'DDR4', 'sizeGb', 32, 'speedMhz', 3200)),

  (4, 'NVIDIA GeForce RTX 4060 8GB', 'nvidia-rtx-4060-8gb', '1080p Ultra, низьке споживання.', 11299.00, 10, 'https://images.unsplash.com/photo-1555618254-84e2cf498b01?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('vramGb', 8, 'tdpW', 115)),
  (4, 'AMD Radeon RX 7800 XT 16GB', 'amd-rx-7800-xt-16gb', '1440p, 16 ГБ VRAM.', 15499.00, 5, 'https://images.unsplash.com/photo-1634672350437-f9632adc9c3f?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('vramGb', 16, 'tdpW', 263)),

  (5, 'Samsung 990 PRO 1TB NVMe', 'samsung-990-pro-1tb', 'PCIe 4.0, швидкий системний SSD.', 5499.00, 25, 'https://images.unsplash.com/photo-1686705562930-4f3e46f620d8?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('interface', 'NVMe', 'capacityGb', 1000)),
  (5, 'WD Blue 2TB HDD', 'wd-blue-2tb-hdd', '2.5", 5400 RPM, для архіву.', 2199.00, 35, 'https://images.unsplash.com/photo-1581725645226-92ad3b4c16d8?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('interface', 'SATA', 'capacityGb', 2000)),

  (6, 'DeepCool PK750D 750W', 'deepcool-pk750d-750w', '80+ Bronze, надійний бюджетний БП.', 2499.00, 20, 'https://images.unsplash.com/photo-1753557346289-7f7bd0576d05?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('wattage', 750, 'cert', '80+ Bronze')),
  (6, 'Seasonic Focus GX-850', 'seasonic-focus-gx-850', '850W, 80+ Gold, модульний.', 6299.00, 9, 'https://images.unsplash.com/photo-1756576170672-1123237f1d77?w=800&q=80&auto=format&fit=crop&ixlib=rb-4.0.0', JSON_OBJECT('wattage', 850, 'cert', '80+ Gold'))
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  price = VALUES(price),
  stock = VALUES(stock),
  image_url = VALUES(image_url),
  specs = VALUES(specs);
