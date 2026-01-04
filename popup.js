const DEFAULT_SETTINGS = {
  translate: true,
  hideOtherLangs: true,
  moveReadings: true,
  includeNanori: true,
  includePinyin: true,
  includeKorean: true,
  includeUnicode: true,
};

document.addEventListener("DOMContentLoaded", () => {
  const els = {
    translate: document.getElementById("translate"),
    hideOtherLangs: document.getElementById("hideOtherLangs"),
    moveReadings: document.getElementById("moveReadings"),
    includeNanori: document.getElementById("includeNanori"),
    includePinyin: document.getElementById("includePinyin"),
    includeKorean: document.getElementById("includeKorean"),
    includeUnicode: document.getElementById("includeUnicode"),
    clearBtn: document.getElementById("clearCacheBtn"),
    cacheStatus: document.getElementById("cacheStatus"),
  };

  if (!els.translate || !els.clearBtn) {
    console.warn("Popup elements not ready");
    return;
  }

  chrome.storage.sync.get(DEFAULT_SETTINGS, (cfg) => {
    for (const k of Object.keys(els)) {
      if (els[k] && "checked" in els[k]) {
        els[k].checked = cfg[k];
      }
    }
    toggleSuboptions();
  });

  const settingKeys = [
    "translate",
    "hideOtherLangs",
    "moveReadings",
    "includeNanori",
    "includePinyin",
    "includeKorean",
    "includeUnicode",
  ];

  settingKeys.forEach((k) => {
    if (!els[k]) return;
    els[k].addEventListener("change", () => {
      chrome.storage.sync.set({ [k]: els[k].checked });
      if (k === "moveReadings") toggleSuboptions();
    });
  });

  function toggleSuboptions() {
    const enabled = els.moveReadings?.checked;
    ["includeNanori", "includePinyin", "includeKorean"].forEach((k) => {
      if (els[k]) els[k].disabled = !enabled;
    });
  }

  els.clearBtn.addEventListener("click", () => {
    const ok = window.confirm("Clear translation cache now?");
    if (!ok) return;

    if (els.cacheStatus) els.cacheStatus.textContent = "Clearing…";
    sendClearMessage()
      .then((removed) => {
        if (els.cacheStatus) els.cacheStatus.textContent = `Cleared ${removed} cached item(s).`;
      })
      .catch((err) => {
        if (els.cacheStatus) els.cacheStatus.textContent = `Failed: ${err.message || err}`;
      });
  });

  function sendClearMessage() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs && tabs[0];
        if (!tab || !tab.id) {
          reject(new Error("No active tab"));
          return;
        }
        chrome.tabs.sendMessage(tab.id, { type: "CLEAR_TRANSLATION_CACHE" }, (resp) => {
          if (chrome.runtime.lastError) {
            reject(new Error("Please open a Jisho page first"));
            return;
          }
          resolve((resp && resp.removed) || 0);
        });
      });
    });
  }
});