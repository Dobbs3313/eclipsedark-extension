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
  rules: [] // { id, pattern, mode: "exclude"|"include", isRegex: boolean }
};

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get("ed_settings");
  if (!existing.ed_settings) {
    await chrome.storage.sync.set({ ed_settings: DEFAULT_SETTINGS });
  }
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "eclipsedark-toggle-site",
      title: "EclipseDark: Toggle dark mode for this site",
      contexts: ["page"]
    });
  });
});

async function toggleHostRule(urlStr) {
  try {
    const u = new URL(urlStr);
    const host = u.hostname;
    const { ed_settings } = await chrome.storage.sync.get("ed_settings");
    const settings = { ...DEFAULT_SETTINGS, ...(ed_settings || {}) };
    const idx = settings.rules.findIndex(r => !r.isRegex && r.pattern === host);
    if (idx >= 0) {
      settings.rules.splice(idx, 1);
    } else {
      settings.rules.unshift({
        id: `r_${Date.now()}`,
        pattern: host,
        mode: "exclude",
        isRegex: false
      });
    }
    await chrome.storage.sync.set({ ed_settings: settings });
  } catch {
    // Ignore non-http URLs
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "eclipsedark-toggle-site" && tab?.url) {
    await toggleHostRule(tab.url);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-dark-mode") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) await toggleHostRule(tab.url);
  }
});
