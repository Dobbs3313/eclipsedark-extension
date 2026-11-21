(() => {
  const STYLE_ID = "eclipsedark-injected-style";
  const PRESETS = {
    oled: { invert: 0.98, brightness: 96, contrast: 104, sepia: 0, bg: "#000000" },
    slate: { invert: 0.91, brightness: 100, contrast: 96, sepia: 6, bg: "#0f172a" },
    warm: { invert: 0.90, brightness: 98, contrast: 94, sepia: 24, bg: "#1c1917" }
  };

  let currentSettings = null;
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function inSchedule(startStr, endStr) {
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = String(startStr || "20:00").split(":").map(Number);
    const [eh, em] = String(endStr || "07:00").split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (start <= end) return cur >= start && cur < end;
    return cur >= start || cur < end;
  }

  function matchRule(rule, href, host) {
    if (!rule?.pattern) return false;
    try {
      if (rule.isRegex) {
        return new RegExp(rule.pattern, "i").test(href);
      }
      const p = rule.pattern.trim().toLowerCase();
      if (p.includes("/")) {
        return href.toLowerCase().includes(p);
      }
      return host.toLowerCase() === p || host.toLowerCase().endsWith(`.${p}`);
    } catch {
      return false;
    }
  }

  function pageHasNativeDark() {
    try {
      const cs = getComputedStyle(document.documentElement);
      const bg = cs.backgroundColor;
      if (cs.colorScheme && cs.colorScheme.includes("dark")) {
        const m = bg.match(/\d+/g);
        if (m && m.length >= 3) {
          const lum = 0.2126 * Number(m[0]) + 0.7152 * Number(m[1]) + 0.0722 * Number(m[2]);
          if (lum < 70 && !(m[3] !== undefined && Number(m[3]) === 0)) return true;
        }
      }
    } catch {
      // ignore early DOM errors
    }
    return false;
  }

  function shouldApply(settings) {
    if (!settings) return false;
    const href = location.href;
    const host = location.hostname;
    const rules = Array.isArray(settings.rules) ? settings.rules : [];

    for (const rule of rules) {
      if (matchRule(rule, href, host)) {
        return rule.mode === "include";
      }
    }

    if (!settings.enabled) return false;
    if (settings.osSync && !mediaQuery.matches) return false;
    if (settings.scheduleEnabled && !inSchedule(settings.scheduleStart, settings.scheduleEnd)) return false;
    if (settings.smartSkipNativeDark && document.readyState !== "loading" && pageHasNativeDark()) return false;
    return true;
  }

  function removeStyle() {
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
    document.documentElement.removeAttribute("data-eclipsedark");
  }

  function applyStyle(settings) {
    if (!shouldApply(settings)) {
      removeStyle();
      return;
    }
    const preset = PRESETS[settings.preset] || PRESETS.slate;
    const brightness = Number(settings.brightness ?? preset.brightness) / 100;
    const contrast = Number(settings.contrast ?? preset.contrast) / 100;
    const sepia = Number(settings.sepia ?? preset.sepia) / 100;

    const css = `
      html[data-eclipsedark="on"] {
        background-color: ${preset.bg} !important;
        filter: invert(${preset.invert}) hue-rotate(180deg) brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)}) sepia(${sepia.toFixed(2)}) !important;
        color-scheme: dark !important;
      }
      html[data-eclipsedark="on"] img,
      html[data-eclipsedark="on"] picture,
      html[data-eclipsedark="on"] video,
      html[data-eclipsedark="on"] canvas,
      html[data-eclipsedark="on"] iframe,
      html[data-eclipsedark="on"] embed,
      html[data-eclipsedark="on"] object,
      html[data-eclipsedark="on"] [data-eclipsedark-preserve="true"],
      html[data-eclipsedark="on"] .html5-video-player video {
        filter: invert(1) hue-rotate(180deg) !important;
      }
      html[data-eclipsedark="on"] img[src$=".svg"] {
        filter: invert(0.15) !important;
      }
      ${settings.customCss || ""}
    `;

    let styleEl = document.getElementById(STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(styleEl);
    }
    styleEl.textContent = css;
    document.documentElement.setAttribute("data-eclipsedark", "on");
  }

  function loadAndApply() {
    chrome.storage.sync.get("ed_settings", ({ ed_settings }) => {
      currentSettings = ed_settings || {
        enabled: true, osSync: false, smartSkipNativeDark: true,
        preset: "slate", brightness: 100, contrast: 96, sepia: 6, rules: []
      };
      applyStyle(currentSettings);
    });
  }

  loadAndApply();
  document.addEventListener("DOMContentLoaded", () => {
    if (currentSettings) applyStyle(currentSettings);
  });
  mediaQuery.addEventListener("change", () => {
    if (currentSettings) applyStyle(currentSettings);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.ed_settings) {
      currentSettings = changes.ed_settings.newValue;
      applyStyle(currentSettings);
    }
  });
})();
