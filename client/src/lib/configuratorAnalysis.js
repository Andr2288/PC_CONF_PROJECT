import { isSameBuild } from "./configurator.js";

const CAT = {
  CPU: "cpu",
  MB: "motherboard",
  RAM: "ram",
  GPU: "gpu",
  STORAGE: "storage",
  PSU: "psu",
};

function firstByCategory(items, slug) {
  return items.find((x) => x.category_slug === slug) || null;
}

export function checkCompatibility(items) {
  const pos = [];
  const neg = [];
  const cpu = firstByCategory(items, CAT.CPU);
  const mb = firstByCategory(items, CAT.MB);
  const ram = firstByCategory(items, CAT.RAM);

  if (cpu && mb) {
    const cSock = cpu.specs && cpu.specs.socket;
    const mSock = mb.specs && mb.specs.socket;
    if (cSock && mSock) {
      if (String(cSock) !== String(mSock)) {
        neg.push("Процесор і материнська плата не підходять одна до одної (різна «посадка»).");
      } else {
        pos.push("Процесор і плата підходять одна до одної — в одній збірці вони можуть разом.");
      }
    } else {
      pos.push("У карток товарів мало деталей — автоперевірка неповна, перегляньте опис на сайті.");
    }
  } else if (cpu || mb) {
    pos.push(cpu ? "Щоб перевірити пару «процесор + плата», додайте в список материнську плату." : "Щоб перевірити, додайте в список процесор.");
  }

  if (ram && mb) {
    const rT = ram.specs && ram.specs.ramType;
    const mT = mb.specs && mb.specs.ramType;
    if (rT && mT) {
      if (String(rT) !== String(mT)) {
        neg.push("Пам’ять не пасує до плати: у товару плати й у пам’яті має бути один і той самий тип, що в картці товару (подивіться в опис).");
      } else {
        pos.push("Пам’ять і плата: один тип — підходить разом.");
      }
    } else {
      pos.push("Типу пам’яті в картці не видно — підказка з пам’яттю обмежена.");
    }
  } else {
    if (ram && !mb) pos.push("Щоб перевірити пару «пам’ять + плата», додайте в список материнську плату.");
    if (mb && !ram) pos.push("Щоб перевірити пам’ять, додайте в список модулі ОЗП.");
  }

  if (!cpu && !mb && !ram) {
    return {
      ok: true,
      level: "info",
      lines: ["Щоб отримати поради щодо сумісності, додайте хоча б процесор, материнську плату й модулі пам’яті."],
    };
  }

  if (neg.length) {
    return { ok: false, level: "warn", lines: [...neg, ...pos] };
  }

  const hasOkHint = pos.some((l) => l.includes("в одній збірці") || l.includes("підходить разом"));
  return {
    ok: true,
    level: hasOkHint ? "ok" : "info",
    lines: pos.length ? pos : ["Додайте процесор, материнську плату й пам’ять, щоб з’явились підказки."],
  };
}

function metricsFromItems(items) {
  const cpu = firstByCategory(items, CAT.CPU);
  const rams = items.filter((i) => i.category_slug === CAT.RAM);
  const gpus = items.filter((i) => i.category_slug === CAT.GPU);
  const storage = items.filter((i) => i.category_slug === CAT.STORAGE);

  const vram = Math.max(0, ...gpus.map((g) => Number(g.specs && g.specs.vramGb) || 0));
  const ramGb = rams.reduce((s, r) => s + (Number(r.specs && r.specs.sizeGb) || 0), 0);
  const ramMhz = Math.max(0, ...rams.map((r) => Number(r.specs && r.specs.speedMhz) || 0));
  const cpuTdp = Number((cpu && cpu.specs && cpu.specs.tdpW) || 0);
  const hasNvme = storage.some(
    (s) => String((s.specs && s.specs.interface) || "").toLowerCase().includes("nvme")
  );
  const total = items.reduce((s, i) => s + Number(i.price || 0), 0);

  return { vram, ramGb, ramMhz, cpuTdp, hasNvme, total };
}

function scores(m) {
  return {
    games: m.vram * 120 + m.ramMhz * 0.15 + m.cpuTdp * 0.4,
    dev: m.ramGb * 22 + m.cpuTdp * 0.2 + (m.hasNvme ? 80 : 0),
    video: m.ramGb * 18 + m.vram * 100 + (m.hasNvme ? 50 : 0),
  };
}

export function compareBuilds(itemsA, itemsB) {
  const empty = !itemsA.length && !itemsB.length;
  if (empty) {
    return { title: "Порівняння", body: ["Заповніть A і B кнопками «Поточне → A / B»."] };
  }
  if (!itemsA.length) {
    return { title: "Порівняння", body: ["Слот A порожній."] };
  }
  if (!itemsB.length) {
    return { title: "Порівняння", body: ["Слот B порожній."] };
  }

  if (isSameBuild(itemsA, itemsB)) {
    return {
      title: "Порівняння",
      body: ["A і B однакові. Змініть одну зі збірок, щоб порівняти."],
    };
  }

  const ma = metricsFromItems(itemsA);
  const mb = metricsFromItems(itemsB);
  const sa = scores(ma);
  const sb = scores(mb);
  const body = [`A: ${ma.total.toFixed(0)} грн · B: ${mb.total.toFixed(0)} грн`];

  function line(key, forWhat) {
    const d = sa[key] - sb[key];
    if (Math.abs(d) < 1) {
      return `Для ${forWhat} — варіанти близькі.`;
    }
    const w = d > 0 ? "A" : "B";
    return `Варіант ${w} краще підходить для ${forWhat}.`;
  }

  body.push(line("games", "ігор"));
  body.push(line("dev", "програмування"));
  body.push(line("video", "відео та монтажу"));

  if (mb.total < ma.total) {
    body.push("B дешевший — варіант, коли важлива ціна чи вистачає такої простішої збірки.");
  } else if (ma.total < mb.total) {
    body.push("A дешевший — варіант, коли важлива ціна чи вистачає такої простішої збірки.");
  }

  return { title: "Порівняння A і B", body };
}
