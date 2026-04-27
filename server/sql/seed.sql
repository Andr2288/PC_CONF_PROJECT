SET NAMES utf8mb4;

INSERT INTO categories (id, name, slug, sort_order) VALUES
  (1, 'Процесори', 'cpu', 1),
  (2, 'Материнські плати', 'motherboard', 2),
  (3, 'ОЗП', 'ram', 3),
  (4, 'Відеокарти', 'gpu', 4),
  (5, 'SSD / HDD', 'storage', 5),
  (6, 'Блоки живлення', 'psu', 6)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);

INSERT INTO products (category_id, name, slug, description, price, stock, image_url, specs) VALUES
  (1, 'AMD Ryzen 5 7600', 'amd-ryzen-5-7600', '6 ядер / 12 потоків, AM5, з графікою RDNA2.', 8299.00, 15, 'https://placehold.co/480x360/e85d04/ffffff?text=Ryzen+7600', JSON_OBJECT('socket', 'AM5', 'tdpW', 65)),
  (1, 'AMD Ryzen 7 7800X3D', 'amd-ryzen-7-7800x3d', '8C/16T, AM5, 3D V-Cache — топ для ігор.', 15299.00, 8, 'https://placehold.co/480x360/e85d04/ffffff?text=7800X3D', JSON_OBJECT('socket', 'AM5', 'tdpW', 120)),
  (1, 'Intel Core i5-13400F', 'intel-i5-13400f', '10 ядер (6P+4E), LGA1700, без вбудованої графіки.', 7199.00, 22, 'https://placehold.co/480x360/1a73e8/ffffff?text=i5-13400F', JSON_OBJECT('socket', 'LGA1700', 'tdpW', 65)),
  (1, 'Intel Core i7-13700K', 'intel-i7-13700k', '16 ядер, LGA1700, розгін.', 14499.00, 6, 'https://placehold.co/480x360/1a73e8/ffffff?text=i7-13700K', JSON_OBJECT('socket', 'LGA1700', 'tdpW', 125)),

  (2, 'ASUS B650M-PLUS WIFI', 'asus-b650m-plus-wifi', 'mATX, AM5, DDR5, Wi‑Fi 6E.', 6299.00, 12, 'https://placehold.co/480x360/2e7d32/ffffff?text=B650M', JSON_OBJECT('socket', 'AM5', 'ramType', 'DDR5', 'formFactor', 'mATX')),
  (2, 'Gigabyte B760M DS3H', 'gigabyte-b760m-ds3h', 'mATX, LGA1700, DDR4.', 4199.00, 18, 'https://placehold.co/480x360/2e7d32/ffffff?text=B760M', JSON_OBJECT('socket', 'LGA1700', 'ramType', 'DDR4', 'formFactor', 'mATX')),
  (2, 'MSI Z790-P WIFI', 'msi-z790-p-wifi', 'ATX, LGA1700, DDR5, Wi‑Fi.', 8999.00, 7, 'https://placehold.co/480x360/2e7d32/ffffff?text=Z790', JSON_OBJECT('socket', 'LGA1700', 'ramType', 'DDR5', 'formFactor', 'ATX')),

  (3, 'Kingston Fury 32GB DDR5 6000', 'kingston-fury-32-ddr5-6000', '2×16 ГБ, kit для AM5 / Intel 12–14 gen.', 3899.00, 30, 'https://placehold.co/480x360/6a1b9a/ffffff?text=DDR5+32', JSON_OBJECT('ramType', 'DDR5', 'sizeGb', 32, 'speedMhz', 6000)),
  (3, 'Corsair Vengeance 32GB DDR4 3200', 'corsair-vengeance-32-ddr4-3200', '2×16 ГБ, універсальний DDR4.', 2999.00, 40, 'https://placehold.co/480x360/6a1b9a/ffffff?text=DDR4+32', JSON_OBJECT('ramType', 'DDR4', 'sizeGb', 32, 'speedMhz', 3200)),

  (4, 'NVIDIA GeForce RTX 4060 8GB', 'nvidia-rtx-4060-8gb', '1080p Ultra, низьке споживання.', 11299.00, 10, 'https://placehold.co/480x360/222222/76b900?text=RTX+4060', JSON_OBJECT('vramGb', 8, 'tdpW', 115)),
  (4, 'AMD Radeon RX 7800 XT 16GB', 'amd-rx-7800-xt-16gb', '1440p, 16 ГБ VRAM.', 15499.00, 5, 'https://placehold.co/480x360/222222/ed1c24?text=RX+7800XT', JSON_OBJECT('vramGb', 16, 'tdpW', 263)),

  (5, 'Samsung 990 PRO 1TB NVMe', 'samsung-990-pro-1tb', 'PCIe 4.0, швидкий системний SSD.', 5499.00, 25, 'https://placehold.co/480x360/1428a0/ffffff?text=990+PRO', JSON_OBJECT('interface', 'NVMe', 'capacityGb', 1000)),
  (5, 'WD Blue 2TB HDD', 'wd-blue-2tb-hdd', '2.5", 5400 RPM, для архіву.', 2199.00, 35, 'https://placehold.co/480x360/1565c0/ffffff?text=WD+2TB', JSON_OBJECT('interface', 'SATA', 'capacityGb', 2000)),

  (6, 'DeepCool PK750D 750W', 'deepcool-pk750d-750w', '80+ Bronze, надійний бюджетний БП.', 2499.00, 20, 'https://placehold.co/480x360/455a64/ffffff?text=750W', JSON_OBJECT('wattage', 750, 'cert', '80+ Bronze')),
  (6, 'Seasonic Focus GX-850', 'seasonic-focus-gx-850', '850W, 80+ Gold, модульний.', 6299.00, 9, 'https://placehold.co/480x360/455a64/ffffff?text=850W+Gold', JSON_OBJECT('wattage', 850, 'cert', '80+ Gold'))
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  price = VALUES(price),
  stock = VALUES(stock),
  image_url = VALUES(image_url),
  specs = VALUES(specs);
