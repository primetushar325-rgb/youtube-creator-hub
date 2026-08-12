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

  // ---------- Init ----------
  show("login");
})();
