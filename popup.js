import { BillingManager } from "./lib/billing.js";
import { BILLING_CONFIG } from "./lib/billing-config.js";

const FREE_RULE_LIMIT = 5;
const DEFAULT_SETTINGS = {
  enabled: true,
  osSync: false,
  smartSkipNativeDark: true,
  preset: "slate",
  brightness: 100,
  contrast: 96,
  sepia: 6,
  scheduleEnabled: false,
  scheduleStart: "20:00",
  scheduleEnd: "07:00",
  customCss: "",
  rules: []
};

const PRESET_VALUES = {
  oled: { brightness: 96, contrast: 104, sepia: 0 },
  slate: { brightness: 100, contrast: 96, sepia: 6 },
  warm: { brightness: 98, contrast: 94, sepia: 24 }
};

const billing = new BillingManager(BILLING_CONFIG);
let settings = { ...DEFAULT_SETTINGS };
let activeUrl = null;
let toastTimer = null;

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

function switchTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tabName));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === `panel-${tabName}`));
}

async function save() {
  await chrome.storage.sync.set({ ed_settings: settings });
  render();
}

function requirePro(featureLabel) {
  if (billing.isPro()) return true;
  showToast(`${featureLabel} is a Pro feature — unlock in the Pro tab.`);
  switchTab("pro");
  return false;
}

function render() {
  const pill = document.getElementById("tierPill");
  pill.textContent = billing.isPro() ? "PRO" : "FREE";
  pill.classList.toggle("pro", billing.isPro());

  document.getElementById("enabledToggle").checked = !!settings.enabled;
  document.getElementById("osSyncToggle").checked = !!settings.osSync;
  document.getElementById("smartSkipToggle").checked = !!settings.smartSkipNativeDark;
  document.getElementById("scheduleToggle").checked = !!settings.scheduleEnabled;
  document.getElementById("scheduleStart").value = settings.scheduleStart || "20:00";
  document.getElementById("scheduleEnd").value = settings.scheduleEnd || "07:00";

  document.getElementById("brightnessRange").value = settings.brightness;
  document.getElementById("contrastRange").value = settings.contrast;
  document.getElementById("sepiaRange").value = settings.sepia;
  document.getElementById("brightnessVal").textContent = `${settings.brightness}%`;
  document.getElementById("contrastVal").textContent = `${settings.contrast}%`;
  document.getElementById("sepiaVal").textContent = `${settings.sepia}%`;

  document.querySelectorAll("[data-preset]").forEach(btn => {
    btn.classList.toggle("btn-primary", btn.dataset.preset === settings.preset);
  });

  if (activeUrl) {
    const host = activeUrl.hostname;
    const exactPath = `${host}${activeUrl.pathname}`;
    const hostExcluded = settings.rules.some(r => !r.isRegex && r.pattern === host && r.mode === "exclude");
    const pathExcluded = settings.rules.some(r => !r.isRegex && r.pattern === exactPath && r.mode === "exclude");
    document.getElementById("toggleSiteBtn").textContent = hostExcluded ? "Re-enable Domain" : "Exclude Domain";
    document.getElementById("togglePathBtn").textContent = pathExcluded ? "Re-enable Path" : "Exclude Path";
  }

  const list = document.getElementById("rulesList");
  document.getElementById("ruleCount").textContent = String(settings.rules.length);
  if (!settings.rules.length) {
    list.innerHTML = `<div class="muted" style="text-align:center;padding:12px;">No custom site or URL-path rules yet.</div>`;
  } else {
    list.innerHTML = "";
    for (const rule of settings.rules) {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div class="list-item-main">
          <div class="truncate" style="font-weight:600;">${rule.pattern}</div>
          <div class="muted">${rule.mode === "exclude" ? "Keep Light" : "Force Dark"}${rule.isRegex ? " · Regex" : ""}</div>
        </div>
        <button class="btn btn-danger btn-sm">Remove</button>
      `;
      item.querySelector("button").addEventListener("click", async () => {
        settings.rules = settings.rules.filter(r => r.id !== rule.id);
        await save();
        showToast("Rule removed.");
      });
      list.appendChild(item);
    }
  }
}

async function init() {
  await billing.init();
  const stored = await chrome.storage.sync.get("ed_settings");
  settings = { ...DEFAULT_SETTINGS, ...(stored.ed_settings || {}) };

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    if (tab?.url && /^https?:/.test(tab.url)) {
      activeUrl = new URL(tab.url);
      document.getElementById("siteHost").textContent = activeUrl.hostname;
    } else {
      document.getElementById("siteHost").textContent = "Chrome internal page";
    }
  } catch {
    document.getElementById("siteHost").textContent = "Ready";
  }

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  document.getElementById("tierPill").addEventListener("click", () => switchTab("pro"));

  billing.mountProPanel(document.getElementById("panel-pro"), {
    onToast: showToast,
    onTierChange: () => render()
  });

  document.getElementById("enabledToggle").addEventListener("change", e => {
    settings.enabled = e.target.checked;
    save();
  });
  document.getElementById("osSyncToggle").addEventListener("change", e => {
    settings.osSync = e.target.checked;
    save();
  });
  document.getElementById("smartSkipToggle").addEventListener("change", e => {
    settings.smartSkipNativeDark = e.target.checked;
    save();
  });
  document.getElementById("scheduleToggle").addEventListener("change", e => {
    if (e.target.checked && !requirePro("Auto Schedule")) {
      e.target.checked = false;
      return;
    }
    settings.scheduleEnabled = e.target.checked;
    save();
  });
  ["scheduleStart", "scheduleEnd"].forEach(id => {
    document.getElementById(id).addEventListener("change", e => {
      settings[id] = e.target.value;
      save();
    });
  });

  document.querySelectorAll("[data-preset]").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = btn.dataset.preset;
      settings.preset = p;
      Object.assign(settings, PRESET_VALUES[p]);
      save();
      showToast(`Applied ${p.toUpperCase()} preset`);
    });
  });

  ["brightness", "contrast", "sepia"].forEach(key => {
    const el = document.getElementById(`${key}Range`);
    el.addEventListener("input", () => {
      document.getElementById(`${key}Val`).textContent = `${el.value}%`;
    });
    el.addEventListener("change", () => {
      if (!requirePro("Custom color sliders")) {
        render();
        return;
      }
      settings[key] = Number(el.value);
      save();
    });
  });

  async function toggleQuickPattern(pattern) {
    if (!pattern) return;
    const exists = settings.rules.find(r => !r.isRegex && r.pattern === pattern);
    if (exists) {
      settings.rules = settings.rules.filter(r => r.id !== exists.id);
      await save();
      showToast(`Re-enabled ${pattern}`);
    } else {
      if (!billing.isPro() && settings.rules.length >= FREE_RULE_LIMIT) {
        requirePro(`More than ${FREE_RULE_LIMIT} rules`);
        return;
      }
      settings.rules.unshift({ id: `r_${Date.now()}`, pattern, mode: "exclude", isRegex: false });
      await save();
      showToast(`Excluded ${pattern}`);
    }
  }

  document.getElementById("toggleSiteBtn").addEventListener("click", () => {
    if (!activeUrl) return showToast("Open an HTTP/HTTPS tab first.");
    toggleQuickPattern(activeUrl.hostname);
  });
  document.getElementById("togglePathBtn").addEventListener("click", () => {
    if (!activeUrl) return showToast("Open an HTTP/HTTPS tab first.");
    toggleQuickPattern(`${activeUrl.hostname}${activeUrl.pathname}`);
  });

  document.getElementById("addRuleBtn").addEventListener("click", async () => {
    const pattern = document.getElementById("rulePattern").value.trim();
    const mode = document.getElementById("ruleMode").value;
    const isRegex = document.getElementById("ruleRegex").checked;
    if (!pattern) return showToast("Enter a domain, URL path, or regex.");
    if (isRegex && !requirePro("Regex URL rules")) return;
    if (!billing.isPro() && settings.rules.length >= FREE_RULE_LIMIT) {
      return requirePro(`More than ${FREE_RULE_LIMIT} rules`);
    }
    if (isRegex) {
      try { new RegExp(pattern); } catch { return showToast("Invalid regular expression."); }
    }
    settings.rules.unshift({ id: `r_${Date.now()}`, pattern, mode, isRegex });
    document.getElementById("rulePattern").value = "";
    await save();
    showToast("Rule added.");
  });

  document.getElementById("exportRulesBtn").addEventListener("click", () => {
    if (!requirePro("JSON profile export")) return;
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eclipsedark-profile.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported profile JSON.");
  });

  render();
}

init();
