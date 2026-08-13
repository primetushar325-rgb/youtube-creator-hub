/* ============================================================
   PWA install banner + Web Push subscription + notification
   permission UX. Self-contained, does not break existing app.
   ============================================================ */
(function () {
  "use strict";
  const ls = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const $ = (s, r) => (r || document).querySelector(s);

  // ---------- PWA detection ----------
  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      window.matchMedia("(display-mode: window-controls-overlay)").matches
    );
  }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }

  // ---------- Service Worker registration ----------
  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }

  // ---------- Install banner ----------
  let deferredPrompt = null;

  function buildInstallBanner() {
    if (isStandalone()) return;            // already installed
    if (ls.get("ych_installed", false)) return; // installed before
    if (sessionStorage.getItem("ych_banner_closed")) return; // closed this session

    const banner = document.createElement("div");
    banner.className = "ych-install-banner";
    banner.innerHTML =
      '<div class="ych-install-ic">📱</div>' +
      '<div class="ych-install-txt"><b>Install Our App</b><span>Install this website as an app for a faster experience.</span></div>' +
      '<button class="ych-install-btn" id="ychInstallBtn">Install App</button>' +
      '<button class="ych-install-x" id="ychInstallX">×</button>';
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add("show"));

    const close = () => { banner.classList.remove("show"); setTimeout(() => banner.remove(), 300); };

    $("#ychInstallX").addEventListener("click", () => {
      sessionStorage.setItem("ych_banner_closed", "1");
      close();
    });

    $("#ychInstallBtn").addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice.catch(() => ({}));
        if (choice && choice.outcome === "accepted") {
          ls.set("ych_installed", true);
          close();
        }
        deferredPrompt = null;
      } else if (isIOS()) {
        // iOS fallback
        showInstallToast("Tap Share → Add to Home Screen to install.");
        sessionStorage.setItem("ych_banner_closed", "1");
        close();
      } else {
        // Not installable here -> fallback message
        showInstallToast("Automatic install isn't supported here. Use browser menu → Add to Home Screen.");
        sessionStorage.setItem("ych_banner_closed", "1");
        close();
      }
    });
  }

  function showInstallToast(msg) {
    let t = $("#ychInstallToast");
    if (!t) { t = document.createElement("div"); t.id = "ychInstallToast"; t.className = "ych-install-toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove("show"), 4000);
  }

  // Listen for the native install prompt
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Show banner now (if not suppressed)
    buildInstallBanner();
  });
  window.addEventListener("appinstalled", () => {
    ls.set("ych_installed", true);
    const b = $(".ych-install-banner");
    if (b) b.remove();
  });

  // ---------- Notification permission UX ----------
  function notifSupported() { return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window; }

  function buildNotifPrompt() {
    if (!notifSupported()) return;
    if (ls.get("ych_notif_done", false)) return; // already asked
    if (Notification.permission === "granted" || Notification.permission === "denied") {
      ls.set("ych_notif_done", true);
      return;
    }
    // Show after a short delay so it's not aggressive on first load
    setTimeout(() => {
      if (ls.get("ych_notif_done", false)) return;
      const prompt = document.createElement("div");
      prompt.className = "ych-notif-prompt";
      prompt.innerHTML =
        '<div class="ych-notif-ic">🔔</div>' +
        '<h3>Stay Updated</h3>' +
        '<p>Get notifications about new videos, tools, updates and announcements.</p>' +
        '<div class="ych-notif-actions">' +
        '<button class="ych-notif-allow">Allow Notifications</button>' +
        '<button class="ych-notif-later">Not Now</button>' +
        '</div>';
      document.body.appendChild(prompt);

      const dismiss = (done) => { if (done) ls.set("ych_notif_done", true); prompt.classList.add("hide"); setTimeout(() => prompt.remove(), 300); };

      prompt.querySelector(".ych-notif-later").addEventListener("click", () => { ls.set("ych_notif_done", true); dismiss(false); });
      prompt.querySelector(".ych-notif-allow").addEventListener("click", async () => {
        ls.set("ych_notif_done", true);
        try {
          const perm = await Notification.requestPermission();
          if (perm === "granted") subscribePush();
        } catch (e) {}
        dismiss(false);
      });
    }, 2500);
  }

  // ---------- Web Push subscription ----------
  async function subscribePush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(await getVapidKey())
      });
      await fetch("/api/push?type=subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          prefs: { videos: true, tools: true, templates: true, updates: true, announcements: true },
          device: { ua: navigator.userAgent, isIOS: isIOS(), isStandalone: isStandalone() }
        }),
        keepalive: true
      }).catch(() => {});
    } catch (e) { /* ignore — never break the site */ }
  }

  async function getVapidKey() {
    try {
      const res = await fetch("/api/push?type=vapid-public");
      const d = await res.json();
      return d.key || "";
    } catch (e) { return ""; }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  // ---------- User notification settings UI (opens from a small control) ----------
  function buildNotifSettingsControl() {
    // A small bell button in the top nav area
    const bell = document.createElement("button");
    bell.className = "ych-bell";
    bell.setAttribute("aria-label", "Notification settings");
    bell.innerHTML = "🔔";
    const navActions = $(".nav-actions");
    if (navActions) { navActions.appendChild(bell); }
    else { document.body.appendChild(bell); bell.classList.add("ych-bell-fixed"); }

    bell.addEventListener("click", () => openNotifSettings());
  }

  function openNotifSettings() {
    const existing = $("#ychNotifModal");
    if (existing) existing.remove();
    const m = document.createElement("div");
    m.id = "ychNotifModal";
    m.className = "ych-notif-modal";
    m.innerHTML =
      '<div class="ych-notif-modal-card">' +
      '<div class="ych-notif-modal-head"><b>Notification Settings</b><button class="ych-notif-modal-x">×</button></div>' +
      '<div class="ych-notif-modal-body">' +
      '<label class="ych-setting"><span><b>Notifications</b></span><input type="checkbox" id="ychPrefGlobal" checked></label>' +
      '<label class="ych-setting"><span>New Videos</span><input type="checkbox" id="ychPrefVideos" checked></label>' +
      '<label class="ych-setting"><span>New Tools</span><input type="checkbox" id="ychPrefTools" checked></label>' +
      '<label class="ych-setting"><span>Templates</span><input type="checkbox" id="ychPrefTemplates" checked></label>' +
      '<label class="ych-setting"><span>Updates</span><input type="checkbox" id="ychPrefUpdates" checked></label>' +
      '<label class="ych-setting"><span>Announcements</span><input type="checkbox" id="ychPrefAnnouncements" checked></label>' +
      '<button class="ych-notif-save">Save Preferences</button>' +
      '</div></div>';
    document.body.appendChild(m);
    m.querySelector(".ych-notif-modal-x").addEventListener("click", () => m.remove());
    m.addEventListener("click", (e) => { if (e.target === m) m.remove(); });
    m.querySelector(".ych-notif-save").addEventListener("click", async () => {
      const prefs = {
        global: $("#ychPrefGlobal").checked,
        videos: $("#ychPrefVideos").checked,
        tools: $("#ychPrefTools").checked,
        templates: $("#ychPrefTemplates").checked,
        updates: $("#ychPrefUpdates").checked,
        announcements: $("#ychPrefAnnouncements").checked
      };
      ls.set("ych_notif_prefs", prefs);
      try {
        await fetch("/api/push?type=prefs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefs }) }).catch(() => {});
      } catch (e) {}
      m.remove();
      // simple toast
      showInstallToast("Notification preferences saved.");
    });
  }

  // ---------- Init ----------
  function init() {
    if (!document.body) { document.addEventListener("DOMContentLoaded", init); return; }
    registerSW();
    buildInstallBanner();       // will also be triggered by beforeinstallprompt
    buildNotifPrompt();
    buildNotifSettingsControl();
    // Detect existing installs
    if (isStandalone()) ls.set("ych_installed", true);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.YCH_PWA = { isStandalone, subscribePush };
})();
