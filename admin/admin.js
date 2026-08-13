/* ============================================================
   Creator Hub — Admin panel client
   Login, dashboard stats, channels, trends.
   ============================================================ */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);

  function show(view) {
    $("#loginView").style.display = view === "login" ? "flex" : "none";
    $("#dashView").style.display = view === "dash" ? "block" : "none";
  }

  async function api(url, opts = {}) {
    const res = await fetch(url, {
      credentials: "same-origin",
      headers: opts.body ? { "Content-Type": "application/json" } : {},
      ...opts,
    });
    return { status: res.status, json: await res.json().catch(() => ({})) };
  }

  // ---------- Login ----------
  async function tryLogin() {
    const username = $("#loginUser").value.trim();
    const password = $("#loginPass").value;
    const err = $("#loginErr");
    if (!username || !password) { err.textContent = "Enter username and password."; err.hidden = false; return; }
    err.hidden = true;
    const { status, json } = await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (status === 200) { show("dash"); loadDash(); }
    else { err.textContent = json.error || "Login failed."; err.hidden = false; }
  }
  $("#loginBtn").addEventListener("click", tryLogin);
  $("#loginPass").addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); });
  $("#logoutBtn").addEventListener("click", () => {
    document.cookie = "ych_admin=; Path=/; Max-Age=0";
    show("login");
  });

  // ---------- Dashboard ----------
  async function loadDash() {
    const { status, json } = await api("/api/admin/dashboard");
    if (status !== 200) {
      if (status === 401) { show("login"); return; }
      $("#statCards").innerHTML = `<div class="card">Could not load: ${json.error || "error"}</div>`;
      return;
    }
    renderStats(json);
    renderTopTools(json.topTools || []);
    renderDays(json.recentDays || []);
    loadChannels();
    loadTrends();
    loadNotifSettings();
    loadNotifHistory();
  }

  function renderStats(d) {
    const cards = [
      { n: d.totalVisits, l: "Total Visits" },
      { n: d.uniqueVisitors, l: "Unique Visitors" },
      { n: d.todayVisits, l: "Visits Today" },
      { n: d.totalToolUses, l: "Total Tool Uses" },
    ];
    $("#statCards").innerHTML = cards
      .map((c) => `<div class="stat"><b>${c.n}</b><span>${c.l}</span></div>`)
      .join("");
  }

  function renderTopTools(tools) {
    const max = Math.max(...tools.map((t) => t.count), 1);
    $("#topTools").innerHTML = tools.length
      ? tools.map((t, i) => `<div class="row"><span class="rank">${i + 1}</span><span class="name">${t.toolTitle || t.toolId}</span><span class="val">${t.count}</span><div class="mini-bar"><i style="width:${(t.count / max) * 100}%"></i></div></div>`).join("")
      : '<p class="muted small">No tool usage recorded yet.</p>';
  }

  function renderDays(days) {
    const max = Math.max(...days.map((d) => d.count), 1);
    $("#recentDays").innerHTML = days.length
      ? [...days].reverse().map((d) => `<div class="row"><span class="name small">${d.date}</span><div class="mini-bar"><i style="width:${(d.count / max) * 100}%"></i></div><span class="val">${d.count}</span></div>`).join("")
      : '<p class="muted small">No visits recorded yet.</p>';
  }

  // ---------- Channels ----------
  async function loadChannels() {
    const { status, json } = await api("/api/admin/channels");
    if (status !== 200) return;
    const list = $("#chanList");
    list.innerHTML = json.length
      ? json.map((c) => `<div class="row"><span class="name">${c.name}</span><button class="btn ghost" data-del="${c.id}">Remove</button></div>`).join("")
      : '<p class="muted small">No tracked channels.</p>';
    list.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        await api("/api/admin/channels", { method: "DELETE", body: JSON.stringify({ id: +b.dataset.del }) });
        loadChannels();
      })
    );
  }
  $("#chanAdd").addEventListener("click", async () => {
    const name = $("#chanInput").value.trim();
    if (!name) return;
    await api("/api/admin/channels", { method: "POST", body: JSON.stringify({ name }) });
    $("#chanInput").value = "";
    loadChannels();
  });

  // ---------- Trends ----------
  async function loadTrends() {
    const { status, json } = await api("/api/admin/trends");
    if (status !== 200) return;
    const list = $("#trendList");
    list.innerHTML = json.length
      ? `<div style="display:flex;flex-wrap:wrap;gap:4px">${json.map((t) => `<span class="chip">${t.item_type}: ${t.value}<button data-del="${t.id}">&#10005;</button></span>`).join("")}</div>`
      : '<p class="muted small">No saved trends yet.</p>';
    list.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        await api("/api/admin/trends", { method: "DELETE", body: JSON.stringify({ id: +b.dataset.del }) });
        loadTrends();
      })
    );
  }

  // ---------- Notification Center ----------
  async function loadNotifHistory() {
    const { status, json } = await api("/api/admin/notifications");
    const box = $("#notifHistory");
    if (status !== 200) { box.innerHTML = `<p class="muted small">${json.error || "Could not load"}</p>`; return; }
    box.innerHTML = json.length ? json.map(n => `<div class="row">
      <span class="name">${n.title || ""}</span>
      <span class="val small">${(n.message||"").slice(0,60)}</span>
      <span class="val small">${n.sent_count||0} sent</span>
      <span class="status ${n.status||""}">${n.status||""}</span>
      <span class="val small">${n.sent_at || n.created_at || ""}</span>
    </div>`).join("") : '<p class="muted small">No notifications sent yet.</p>';
  }

  async function loadNotifSettings() {
    const { status, json } = await api("/api/admin/notif-settings");
    const box = $("#notifSettings");
    if (status !== 200) { box.innerHTML = `<p class="muted small">${json.error || "Could not load"}</p>`; return; }
    const fields = [
      ["global_enabled","Global Notifications"],
      ["new_videos","New Video Notifications"],
      ["new_tools","New Tool Notifications"],
      ["new_templates","New Template Notifications"],
      ["new_updates","New Update Notifications"],
      ["announcements","Admin Announcement Notifications"],
      ["sound","Notification Sound"]
    ];
    box.innerHTML = fields.map(([k,label]) => `<div class="toggle-row"><label>${label}</label><input type="checkbox" data-skey="${k}" ${json[k] ? "checked" : ""}></div>`).join("");
    box.querySelectorAll("input[type=checkbox]").forEach(cb => cb.addEventListener("change", () => {
      const payload = {};
      payload[cb.dataset.skey] = cb.checked;
      api("/api/admin/notif-settings", { method: "POST", body: JSON.stringify(payload) }).then(() => {
        // update the result span via toast
      });
    }));
  }

  function sendNotif(scheduleAt) {
    const payload = {
      title: $("#notifTitle").value.trim(),
      message: $("#notifMsg").value.trim(),
      url: $("#notifUrl").value.trim() || "/",
      target: $("#notifTarget").value,
      icon: $("#notifIcon").value.trim() || "",
      image: $("#notifImage").value.trim() || "",
      scheduleAt: scheduleAt || null
    };
    const err = $("#notifResult");
    if (!payload.title) { err.textContent = "Title is required."; err.hidden = false; return; }
    err.hidden = true;
    api("/api/admin/notifications", { method: "POST", body: JSON.stringify(payload) }).then(({ status, json }) => {
      if (status === 200) {
        err.hidden = true;
        if (json.duplicate) { err.textContent = json.message; err.hidden = false; }
        else {
          $("#notifTitle").value = ""; $("#notifMsg").value = ""; $("#notifUrl").value = "/";
          loadNotifHistory();
          alert(json.message || "Notification sent.");
        }
      } else {
        err.textContent = json.error || "Failed to send."; err.hidden = false;
      }
    });
  }

  $("#notifSend").addEventListener("click", () => { sendNotif($("#notifSchedule").value || null); });
  $("#notifNow").addEventListener("click", () => { sendNotif(null); });

  // ---------- Init ----------
  show("login");
})();
