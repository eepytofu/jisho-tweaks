const DEFAULT_SETTINGS = {
  translate: true,
  hideOtherLangs: true,
  moveReadings: true,
  includeNanori: true,
  includePinyin: true,
  includeKorean: true,
  includeUnicode: true,
};

let settings = { ...DEFAULT_SETTINGS };

chrome.storage.sync.get(DEFAULT_SETTINGS, (cfg) => {
  settings = cfg;
  init();
});

function onSettingsChanged(changes) {
  settings = { ...settings, ...changes };
  process(document, { force: true });
}

function init() {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
      const diff = {};
      for (const k of Object.keys(DEFAULT_SETTINGS)) {
        if (k in changes) diff[k] = changes[k].newValue;
      }
      onSettingsChanged(diff);
    }
  });

  process(document);

  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) process(n);
      });
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

const djb2 = (str) => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
};
const cacheKey = (t) => `jisho:id:${djb2(t)}`;
const getCached = (t) => {
  try {
    const raw = localStorage.getItem(cacheKey(t));
    return raw ? JSON.parse(raw).t : null;
  } catch {
    return null;
  }
};
const setCached = (t, v) => {
  try {
    localStorage.setItem(cacheKey(t), JSON.stringify({ t: v, ts: Date.now() }));
  } catch {}
};
const clearTranslationCache = () => {
  let removed = 0;
  const prefix = "jisho:id:";
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach((k) => {
    try {
      localStorage.removeItem(k);
      removed++;
    } catch {}
  });
  return removed;
};

const compact = (txt) =>
  txt
    .replace(/\s+/g, " ")
    .replace(/\s*([、，,;:])\s*/g, "$1 ")
    .trim();

const themeColors = () => {
  const htmlTheme = (document.documentElement.getAttribute("data-color-theme") || "")
    .trim()
    .toLowerCase();
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  let isDark;
  if (htmlTheme === "dark") isDark = true;
  else if (htmlTheme === "light") isDark = false;
  else isDark = !!prefersDark;
  return {
    accent: isDark ? "#9cbedf" : "#0b7285",
    subtleBg: isDark ? "rgba(255,255,255,0.08)" : "#eef6ff",
    text: isDark ? "#e5e7eb" : "#0f172a",
  };
};

const toneMap = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  o: ["ō", "ó", "ǒ", "ò"],
  u: ["ū", "ú", "ǔ", "ù"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
};
function numberToTone(syllable) {
  const m = syllable.match(/^([a-züv]+)([1-5])$/i);
  if (!m) return syllable;
  let base = m[1].replace("v", "ü");
  const tone = parseInt(m[2], 10);
  if (tone === 5) return base;
  const vowels = ["a", "o", "e", "i", "u", "ü"];
  for (const v of vowels) {
    const idx = base.indexOf(v);
    if (idx !== -1) {
      const rep = toneMap[v] ? toneMap[v][tone - 1] : v;
      base = base.slice(0, idx) + rep + base.slice(idx + 1);
      return base;
    }
  }
  return base;
}
function pinyinNumbersToTones(pinyinText) {
  return pinyinText
    .split(/(\s+|[,;，；])/)
    .map((tok) => {
      if (/^\s+$/.test(tok) || /^[,;，；]$/.test(tok)) return tok;
      return tok
        .replace(/([a-züv]+[1-5])/gi, (m) => numberToTone(m))
        .replace(/[1-5]/g, "");
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

async function process(root = document, { force = false } = {}) {
  applyLanguageVisibility();

  if (settings.moveReadings || force) moveReadings(root);
  else restoreReadings(root);

  addUnicodeCodepoint(root);

  if (settings.translate) await translateGlosses(root);
}

function applyLanguageVisibility() {
  const STYLE_ID = "jisho-lang-block-style";
  const LANG_SELECTORS = ".spanish_meanings, .portuguese_meanings, .french_meanings";
  let styleEl = document.getElementById(STYLE_ID);

  if (settings.hideOtherLangs) {
    if (!styleEl && document.head) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      styleEl.textContent = `
        ${LANG_SELECTORS} {
          display: none !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
    document.querySelectorAll(LANG_SELECTORS).forEach((el) => {
      const col = el.closest(".columns") || el;
      col.style.display = "";
      col.style.width = "";
      col.style.flex = "";
      col.style.verticalAlign = "";
      el.style.display = "";
    });
  } else {
    if (styleEl) {
      styleEl.remove();
    }
    document.querySelectorAll(LANG_SELECTORS).forEach((el) => {
      const col = el.closest(".columns") || el;
      col.style.display = "";
      col.style.width = "";
      col.style.flex = "";
      col.style.verticalAlign = "";
      el.style.display = "";
    });
  }
}

function moveReadings(root) {
  const mainReadings = root.querySelector(".kanji-details__main-readings");
  if (!mainReadings) return;

  mainReadings.querySelectorAll(".jisho-extra-reading").forEach((el) => el.remove());

  const lower = root.querySelector(".kanji-details__readings");
  const lowerCol = lower?.closest(".columns");

  const anchor =
    mainReadings.querySelector("dl.on_yomi, dl.dictionary_entry.on_yomi") ||
    mainReadings.querySelector("dl.kun_yomi, dl.dictionary_entry.kun_yomi");

  const createDl = (label, text, langAttr) => {
    if (!text) return null;
    const dl = document.createElement("dl");
    dl.className = "dictionary_entry jisho-extra-reading";
    const dt = document.createElement("dt");
    dt.textContent = label;
    dt.style.fontWeight = "700";
    const dd = document.createElement("dd");
    dd.className = "kanji-details__main-readings-list";
    dd.style.marginLeft = "6px";
    if (langAttr) dd.setAttribute("lang", langAttr);
    dd.textContent = text;
    dl.appendChild(dt);
    dl.appendChild(dd);
    return dl;
  };

  const pullText = (selector) => {
    const dl = root.querySelector(selector);
    if (!dl) return "";
    const dd = dl.querySelector("dd");
    if (!dd) return "";
    return compact(dd.textContent || "");
  };

  const hideSource = (selector, shouldHide) => {
    const dl = root.querySelector(selector);
    if (!dl) return false;
    dl.style.display = shouldHide ? "none" : "";
    return !shouldHide;
  };

  let lowerVisibleAny = false;

  if (settings.includeNanori) {
    const txt = pullText("dl.nanori, dl.dictionary_entry.nanori");
    const node = createDl("Nanori:", txt, "ja");
    if (node && anchor) anchor.insertAdjacentElement("afterend", node);
    else if (node) mainReadings.appendChild(node);
    hideSource("dl.nanori, dl.dictionary_entry.nanori", true);
  } else {
    lowerVisibleAny = hideSource("dl.nanori, dl.dictionary_entry.nanori", false) || lowerVisibleAny;
  }

  if (settings.includePinyin) {
    const txtRaw = pullText("dl.pinyin, dl.dictionary_entry.pinyin");
    const txt = txtRaw ? pinyinNumbersToTones(txtRaw) : "";
    const node = createDl("Pinyin:", txt, "zh");
    const targetAnchor =
      mainReadings.querySelector("dl.jisho-extra-reading:last-of-type") || anchor;
    if (node && targetAnchor) targetAnchor.insertAdjacentElement("afterend", node);
    else if (node) mainReadings.appendChild(node);
    hideSource("dl.pinyin, dl.dictionary_entry.pinyin", true);
  } else {
    lowerVisibleAny = hideSource("dl.pinyin, dl.dictionary_entry.pinyin", false) || lowerVisibleAny;
  }

  if (settings.includeKorean) {
    const txt = pullText("dl.korean, dl.dictionary_entry.korean");
    const node = createDl("Korean:", txt, "ko");
    const targetAnchor =
      mainReadings.querySelector("dl.jisho-extra-reading:last-of-type") || anchor;
    if (node && targetAnchor) targetAnchor.insertAdjacentElement("afterend", node);
    else if (node) mainReadings.appendChild(node);
    hideSource("dl.korean, dl.dictionary_entry.korean", true);
  } else {
    lowerVisibleAny = hideSource("dl.korean, dl.dictionary_entry.korean", false) || lowerVisibleAny;
  }

  if (lower) {
    lower.style.display = lowerVisibleAny ? "" : "none";
  }
  if (lowerCol) {
    lowerCol.style.display = lowerVisibleAny ? "" : "none";
  }
}

function restoreReadings(root) {
  root.querySelectorAll(".jisho-extra-reading").forEach((el) => el.remove());
  const lower = root.querySelector(".kanji-details__readings");
  const lowerCol = lower?.closest(".columns");
  if (lower) lower.style.display = "";
  if (lowerCol) lowerCol.style.display = "";
  [
    "dl.nanori, dl.dictionary_entry.nanori",
    "dl.pinyin, dl.dictionary_entry.pinyin",
    "dl.korean, dl.dictionary_entry.korean",
  ].forEach((sel) => {
    root.querySelectorAll(sel).forEach((dl) => (dl.style.display = ""));
  });
}

function addUnicodeCodepoint(root) {
  root.querySelectorAll(".jisho-ucode").forEach((el) => el.remove());

  if (!settings.includeUnicode) return;

  const nameCell = Array.from(root.querySelectorAll("#codepoints td.dic_name")).find((td) =>
    /unicode hex code/i.test(td.textContent || "")
  );
  if (!nameCell) return;
  const hexCell = nameCell.previousElementSibling;
  if (!hexCell) return;

  const raw = (hexCell.textContent || "").trim().toUpperCase();
  if (!raw) return;
  const formatted = raw.startsWith("U+") ? raw : `U+${raw}`;

  const variantsDl = root.querySelector("dl.dictionary_entry.variants");
  const partsDl = root.querySelector("div.radicals:last-of-type dl.dictionary_entry");
  const anchor = variantsDl || partsDl;
  if (!anchor) return;

  const dl = document.createElement("dl");
  dl.className = "dictionary_entry jisho-ucode";

  const dt = document.createElement("dt");
  dt.textContent = "Unicode:";
  dt.style.fontWeight = "700";

  const dd = document.createElement("dd");
  dd.textContent = formatted;
  dd.style.marginLeft = "6px";

  dl.appendChild(dt);
  dl.appendChild(dd);

  anchor.insertAdjacentElement("afterend", dl);
}

async function translateGlosses(root) {
  const colors = themeColors();
  const targets = [];
  targets.push(...root.querySelectorAll(".kanji-details__main-meanings"));
  targets.push(...root.querySelectorAll(".compounds li"));
  targets.push(
    ...root.querySelectorAll(".meaning-meaning, .concept_gloss, .meanings-wrapper .meaning-meaning")
  );

  for (const el of targets) {
    if (el.dataset.idTranslated) continue;
    const raw = compact(el.textContent);
    if (!raw) continue;
    el.dataset.idTranslated = "pending";
    try {
      const idText = await translateEnToId(raw);
      const span = document.createElement("div");
      span.textContent = idText;
      span.style.cssText = `color:${colors.accent}; font-style:italic; margin-top:2px;`;
      el.after(span);
      el.dataset.idTranslated = "done";
    } catch {
      el.dataset.idTranslated = "error";
    }
  }
}

async function translateEnToId(text) {
  const cached = getCached(text);
  if (cached) return cached;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(
    text
  )}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("translate failed");
  const data = await resp.json();
  const translated = data?.[0]?.map((p) => p?.[0]).join("") || text;
  setCached(text, translated);
  return translated;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "CLEAR_TRANSLATION_CACHE") {
    const removed = clearTranslationCache();
    sendResponse({ removed });
  }
});