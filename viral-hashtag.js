/* ============================================================
   Viral Hashtag Intelligence Tool
   Floating "#" icon + premium black/gold dashboard.
   Self-contained IIFE — does not collide with the main app.

   CORE RULE (single-hashtag detection):
   - Keeps ONLY videos with EXACTLY ONE hashtag in the description.
   - Ignores hashtags that appear only in the title.
   - Rejects multiple-hashtag videos (#a #b #c) and title-as-hashtag spam.
   Applies everywhere: scanner, channel monitor, analyzer, AI score.
   ============================================================ */
(function(){
  "use strict";
  const LS = {
    pos: "vh_fab_pos",
    channels: "vh_tracked_channels",
    watchlist: "vh_watchlist",
    seen: "vh_notif_seen"
  };
  const lsGet = (k,d)=>{ try{ return JSON.parse(localStorage.getItem(k)) ?? d; }catch(e){ return d; } };
  const lsSet = (k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };

  // ---------- Sample dataset (representative; swap with live API) ----------
  const SAMPLE_VIDEOS = (function(){
    const V = (id,ch,title,desc,tags,views,hrsAgo)=>{
      return { id, channel:ch, title, desc, tags:tags||[], views, hoursAgo:hrsAgo, ts:Date.now()-hrsAgo*3600000 };
    };
    const D = "#animal"; const F = "#fitness"; const C = "#cooking"; const T = "#tech"; const R = "#retro";
    return [
      V("a1","AnimalWorld","Best #animal moments today","Watch these amazing creatures. #animal",[D],120000,3),
      V("a2","WildKingdom","Shocking animal facts","Every day a new fact. #animal",[D],98000,6),
      V("a3","Paws&Claws","Cute animal rescue story","Don't miss this. #animal",[D],210000,2),
      V("a4","ZooDaily","10 amazing animals","Join us! #animal",[D],76000,9),
      V("a5","NatureLens","Relaxing animal compilation","For your calm day. #animal",[D],310000,1),
      // multi-hashtag — MUST be rejected
      V("x1","SpamChannel","#animal #viral #shorts","pushing all tags #animal #viral #shorts",[D,"#viral","#shorts"],5000,1),
      V("x2","TagJunkie","#animal as title only","no desc hashtag",[],4000,2),
      // other single-hashtag niches
      V("f1","FitWithSam","Home #fitness in 5 min","Quick routine. #fitness",[F],150000,2),
      V("f2","GymDaily","#fitness morning routine","Start strong. #fitness",[F],88000,5),
      V("c1","ChefRana","One-pan #cooking hack","Easy recipe. #cooking",[C],260000,1),
      V("c2","TastyBites","#cooking for beginners","Simple steps. #cooking",[C],92000,7),
      V("t1","TechTea","#tech unboxing","Check this gadget. #tech",[T],170000,3),
      V("t2","GadgetGuru","#tech review you need","Honest review. #tech",[T],134000,4),
      V("r1","RetroClub","#retro gaming night","Nostalgia. #retro",[R],60000,8)
    ];
  })();

  // ---------- STRICT single-hashtag detection ----------
  function extractDescHashtags(v){
    const re = /#[\w\u0980-\u09FF]+/g;
    const desc = v.desc || "";
    return (desc.match(re) || []).map(h=>h.toLowerCase());
  }
  function isPureSingleHashtag(video){
    const tags = extractDescHashtags(video);
    return tags.length === 1;
  }
  function applySingleHashtagFilter(videos){
    return videos.filter(v => isPureSingleHashtag(v));
  }

  // ---------- Derived metrics ----------
  function viralScore(videos){
    if(!videos.length) return 0;
    const avgViews = videos.reduce((a,v)=>a+v.views,0)/videos.length;
    const recency = videos.reduce((a,v)=>a+(1/(v.hoursAgo+4)),0)/videos.length; // freshness
    const growth = avgViews * (0.4 + recency*0.6);
    const cap = 500000;
    return Math.min(100, Math.round((growth/cap)*100));
  }
  function growthPct(v){
    // fake "recent growth" derived from recency & views
    return Math.min(99, Math.round((v.views/(v.hoursAgo+8))*0.5));
  }
  function groupByHashtag(videos){
    const map = {};
    videos.forEach(v=>{
      const h = extractDescHashtags(v)[0];
      if(!h) return;
      if(!map[h]) map[h] = [];
      map[h].push(v);
    });
    // build stats
    return Object.entries(map).map(([h,list])=>{
      const avg = list.reduce((a,v)=>a+v.views,0)/list.length;
      return { hashtag:h, videos:list, count:list.length, avgViews:Math.round(avg),
        score:Math.min(100,Math.round((avg/500000)*100 + list.length*4)),
        fastest:[...list].sort((a,b)=>b.views-a.views).slice(0,3),
        topCreators:[...new Set(list.map(v=>v.channel))].slice(0,5) };
    }).sort((a,b)=>b.score-a.score);
  }

  // ---------- Floating FAB ----------
  function buildFab(){
    if(document.querySelector(".vh-fab")) return;
    const fab=document.createElement("button");
    fab.className="vh-fab"; fab.setAttribute("aria-label","Viral Hashtag Intelligence");
    fab.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>';
    const pos=lsGet(LS.pos,{x:16,y:null});
    fab.style.left=pos.x+"px";
    fab.style.top=(pos.y!==null?pos.y:(typeof window!=="undefined"?window.innerHeight-110:110))+"px";
    fab.style.bottom=pos.y!==null?"auto":"16px";
    document.body.appendChild(fab);
    makeDraggable(fab);
    fab.addEventListener("click",(e)=>{
      if(fab._dragged){ fab._dragged=false; return; }
      openDashboard();
    });
    // re-check position on resize (keep on screen)
    return fab;
  }
  function makeDraggable(fab){
    let sx,sy,ox,oy,started=false;
    const start=(e)=>{
      const pt = (e.touches?e.touches[0]:e);
      sx=pt.clientX; sy=pt.clientY; ox=fab.offsetLeft; oy=fab.offsetTop;
      started=false; fab.classList.add("dragging");
      document.addEventListener("mousemove",move); document.addEventListener("mouseup",end);
      document.addEventListener("touchmove",move,{passive:true}); document.addEventListener("touchend",end);
    };
    const move=(e)=>{
      const pt=(e.touches?e.touches[0]:e);
      const dx=pt.clientX-sx, dy=pt.clientY-sy;
      if(!started && Math.abs(dx)+Math.abs(dy)>6) started=true;
      if(!started) return;
      fab._dragged=true;
      fab.style.left=(ox+dx)+"px"; fab.style.top=(oy+dy)+"px"; fab.style.bottom="auto";
      // Prevent the page from scrolling while dragging
      if(e.cancelable) e.preventDefault();
    };
    const end=()=>{
      fab.classList.remove("dragging");
      document.removeEventListener("mousemove",move); document.removeEventListener("mouseup",end);
      document.removeEventListener("touchmove",move); document.removeEventListener("touchend",end);
      if(fab._dragged){ lsSet(LS.pos,{x:fab.offsetLeft,y:fab.offsetTop}); }
    };
    fab.addEventListener("mousedown",start);
    fab.addEventListener("touchstart",start,{passive:true});
  }

  // ---------- Dashboard ----------
  let overlay;
  function openDashboard(){
    if(!overlay){ buildOverlay(); }
    overlay.classList.add("open");
    renderTab("scanner");
  }
  function closeDashboard(){ if(overlay) overlay.classList.remove("open"); }

  function buildOverlay(){
    overlay=document.createElement("div"); overlay.className="vh-overlay";
    overlay.innerHTML=`
      <div class="vh-dash">
        <div class="vh-head">
          <div>
            <h2>Viral Hashtag Intelligence</h2>
            <div class="vh-sub">Pure single-hashtag trend detection</div>
          </div>
          <button class="vh-close" aria-label="Close">&#10005;</button>
        </div>
        <div class="vh-tabs" id="vhTabs">
          <button data-tab="scanner" class="active">Scanner</button>
          <button data-tab="channels">Creators</button>
          <button data-tab="analyzer">Analyzer</button>
          <button data-tab="score">AI Score</button>
          <button data-tab="watchlist">Watchlist</button>
        </div>
        <div class="vh-body" id="vhBody"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click",(e)=>{ if(e.target===overlay) closeDashboard(); });
    overlay.querySelector(".vh-close").addEventListener("click",closeDashboard);
    overlay.querySelectorAll("#vhTabs button").forEach(b=>b.addEventListener("click",()=>{
      overlay.querySelectorAll("#vhTabs button").forEach(x=>x.classList.remove("active"));
      b.classList.add("active"); renderTab(b.dataset.tab);
    }));
  }

  function showLoading(){ const b=$("#vhBody"); b.innerHTML='<div class="vh-loading"><span class="vh-spin"></span><br>Analyzing trends…</div>'; }
  function showEmpty(msg){ const b=$("#vhBody"); b.innerHTML=`<div class="vh-empty">${msg||"No data yet."}</div>`; }

  // ---------- Tab renderers ----------
  function renderTab(tab){
    const body=$("#vhBody"); if(!body) return;
    if(tab==="scanner") renderScanner(body);
    else if(tab==="channels") renderChannels(body);
    else if(tab==="analyzer") renderAnalyzer(body);
    else if(tab==="score") renderScore(body);
    else if(tab==="watchlist") renderWatchlist(body);
  }

  function renderScanner(body){
    const pure=applySingleHashtagFilter(SAMPLE_VIDEOS);
    const grouped=groupByHashtag(pure);
    const filterBar=`<div class="vh-filter">
      <input id="vhSearch" placeholder="Search hashtags / topics…">
      <select id="vhSort">
        <option value="score">Sort: Viral Score</option>
        <option value="count">Sort: Video count</option>
        <option value="avg">Sort: Avg views</option>
      </select>
    </div>`;
    const stats=`<div class="vh-stats">
      <div class="vh-stat"><div class="vhs-num">${pure.length}</div><div class="vhs-lab">Pure single-hashtag videos</div></div>
      <div class="vh-stat"><div class="vhs-num">${grouped.length}</div><div class="vhs-lab">Trending hashtags</div></div>
      <div class="vh-stat"><div class="vhs-num">${Math.round(pure.reduce((a,v)=>a+v.views,0)/Math.max(1,pure.length)).toLocaleString()}</div><div class="vhs-lab">Avg views</div></div>
      <div class="vh-stat"><div class="vhs-num">${Math.max(...grouped.map(g=>g.score),0)}</div><div class="vhs-lab">Top viral score</div></div>
    </div>`;
    body.innerHTML = stats + filterBar + `<div id="vhList"></div>`;
    const listEl=$("#vhList");
    function draw(){
      const q=($("#vhSearch").value||"").toLowerCase();
      const sort=$("#vhSort").value;
      let arr=grouped.filter(g=>!q||g.hashtag.includes(q)||g.topCreators.join(" ").toLowerCase().includes(q));
      if(sort==="count") arr=[...arr].sort((a,b)=>b.count-a.count);
      else if(sort==="avg") arr=[...arr].sort((a,b)=>b.avgViews-a.avgViews);
      else arr=[...arr].sort((a,b)=>b.score-a.score);
      listEl.innerHTML=arr.map(g=>{
        const cls=g.score>=70?"hot":g.score>=40?"warm":"cold";
        return `<div class="vh-row" data-h="${g.hashtag}">
          <span class="vh-hash">${g.hashtag}</span>
          <div class="vh-row-body">
            <div class="vh-row-t"><span>${g.count} videos</span><span>${g.avgViews.toLocaleString()} avg</span><span>Top: ${g.topCreators.slice(0,2).join(", ")}</span></div>
            <div class="vh-bar"><i style="width:${Math.min(100,g.score)}%"></i></div>
          </div>
          <span class="vh-score ${cls}">${g.score}</span>
        </div>`;
      }).join("")||`<div class="vh-empty">No hashtags match your filter.</div>`;
      listEl.querySelectorAll(".vh-row").forEach(r=>r.addEventListener("click",()=>{
        renderAnalyzer($("#vhBody"), r.dataset.h); activateTab("analyzer");
      }));
    }
    $("#vhSearch").addEventListener("input",draw);
    $("#vhSort").addEventListener("change",draw);
    draw();
    checkNotifications();
  }

  function renderChannels(body){
    const tracked=lsGet(LS.channels,[]);
    const add=`<div class="vh-add"><input id="vhChanInput" placeholder="Add a YouTube channel name (e.g. MrBeast)"><button class="vh-btn" id="vhChanAdd">+ Track</button></div>`;
    body.innerHTML=add+`<div id="vhChanList"></div>`;
    const list=$("#vhChanList");
    function draw(){
      if(!tracked.length){ list.innerHTML='<div class="vh-empty">No tracked creators yet. Add one above to monitor their single-hashtag usage.</div>'; return; }
      list.innerHTML=tracked.map((ch,i)=>{
        const vids=SAMPLE_VIDEOS.filter(v=>v.channel.toLowerCase()===ch.toLowerCase());
        if(!vids.length){ return `<div class="vh-glass-card"><div class="vh-card-head"><h3>${ch}</h3><button class="vh-btn ghost" data-delc="${i}">Remove</button></div><div class="vh-empty">No single-hashtag videos detected for this channel yet.</div></div>`; }
        const pure=applySingleHashtagFilter(vids);
        const tags=[...new Set(pure.map(extractDescHashtags).map(a=>a[0]).filter(Boolean))];
        const growth=pure.reduce((a,v)=>a+growthPct(v),0)/pure.length;
        return `<div class="vh-glass-card">
          <div class="vh-card-head"><h3>${ch}</h3><button class="vh-btn ghost" data-delc="${i}">Remove</button></div>
          <div class="vh-row-t" style="margin-bottom:8px"><span>${pure.length} pure videos</span><span>${tags.length} hashtag(s)</span><span>growth +${growth.toFixed(0)}%</span></div>
          <div class="vh-bar"><i style="width:${Math.min(100,growth)}%"></i></div>
          ${pure.slice(0,3).map(v=>`<div class="vh-row" style="margin-top:8px"><div class="vh-row-body"><div class="vh-row-t"><b>${v.title}</b></div><div class="vh-row-t"><span>${v.views.toLocaleString()} views</span><span>${v.hoursAgo}h ago</span><span>${v.tags.join(", ")}</span></div></div><span class="vh-score ${growth>=60?"hot":"warm"}">+${growthPct(v)}%</span></div>`).join("")}
          <div class="vh-row-t" style="margin-top:10px">Most used: ${tags.slice(0,4).map(t=>`<span class="vh-wl-chip">${t}</span>`).join(" ")||"none"}</div>
        </div>`;
      }).join("");
      list.querySelectorAll("[data-delc]").forEach(b=>b.addEventListener("click",()=>{
        tracked.splice(+b.dataset.delc,1); lsSet(LS.channels,tracked); draw();
      }));
    }
    $("#vhChanAdd").addEventListener("click",()=>{
      const v=$("#vhChanInput").value.trim(); if(!v) return;
      tracked.push(v); lsSet(LS.channels,tracked); $("#vhChanInput").value=""; draw(); notify(`Now tracking <b>${v}</b>`);
    });
    draw();
  }

  function renderAnalyzer(body, preset){
    const search=preset?"":"#";
    body.innerHTML=`<div class="vh-filter"><input id="vhAnalyzerIn" value="${search}" placeholder="Search a hashtag (e.g. #animal)"><button class="vh-btn" id="vhAnalyze">Analyze</button></div><div id="vhAnalyzeOut"></div>`;
    function analyze(){
      const h=($("#vhAnalyzerIn").value||"").trim().toLowerCase().replace(/^#/,"#")||"#";
      const pure=applySingleHashtagFilter(SAMPLE_VIDEOS);
      const match=pure.filter(v=>extractDescHashtags(v)[0]===h);
      const out=$("#vhAnalyzeOut");
      if(!match.length){ out.innerHTML=`<div class="vh-empty">No pure single-hashtag videos for <b>${h}</b>. This may mean it's used with other tags (spam) or not yet trending.</div>`; return; }
      const avg=Math.round(match.reduce((a,v)=>a+v.views,0)/match.length);
      const growth=Math.min(99,Math.round(match.reduce((a,v)=>a+growthPct(v),0)/match.length));
      const score=viralScore(match);
      const creators=[...new Set(match.map(v=>v.channel))];
      const gaugeDeg=(score/100)*360;
      out.innerHTML=`
        <div class="vh-glass-card" style="text-align:center">
          <div class="vh-gauge">
            <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="10"/><circle cx="60" cy="60" r="52" fill="none" stroke="#ffd60a" stroke-width="10" stroke-linecap="round" stroke-dasharray="${gaugeDeg} 360"/></svg>
            <div class="vh-g-num"><b>${score}</b><span>Viral Score</span></div>
          </div>
          <h3 style="color:var(--vh-gold)">${h}</h3>
          <div class="vh-stats" style="margin-top:12px">
            <div class="vh-stat"><div class="vhs-num">${match.length}</div><div class="vhs-lab">Shorts count</div></div>
            <div class="vh-stat"><div class="vhs-num">${avg.toLocaleString()}</div><div class="vhs-lab">Avg views</div></div>
            <div class="vh-stat"><div class="vhs-num">+${growth}%</div><div class="vhs-lab">Growth</div></div>
            <div class="vh-stat"><div class="vhs-num">${creators.length}</div><div class="vhs-lab">Top creators</div></div>
          </div>
          <button class="vh-btn watch ${isWatched(h)?"active":""}" data-watch="${h}">${isWatched(h)?"&#10003; In Watchlist":"&#9733; Add to Watchlist"}</button>
        </div>
        <div class="vh-card-head"><h3>Top creators using this method</h3></div>
        ${creators.slice(0,4).map(c=>`<div class="vh-row"><div class="vh-row-body"><b>${c}</b><div class="vh-row-t">${match.filter(v=>v.channel===c).length} videos</div></div></div>`).join("")}
        <div class="vh-card-head"><h3>Fastest growing</h3></div>
        ${match.sort((a,b)=>b.views-a.views).slice(0,3).map(v=>`<div class="vh-row"><div class="vh-row-body"><b>${v.title}</b><div class="vh-row-t"><span>${v.views.toLocaleString()} views</span><span>${v.hoursAgo}h ago</span></div></div><span class="vh-score hot">+${growthPct(v)}%</span></div>`).join("")}
      `;
      const w=$("[data-watch]",out); if(w) w.addEventListener("click",()=>toggleWatch(h,w));
    }
    $("#vhAnalyze").addEventListener("click",analyze);
    if(preset) analyze();
  }

  function renderScore(body){
    const pure=applySingleHashtagFilter(SAMPLE_VIDEOS);
    const grouped=groupByHashtag(pure);
    body.innerHTML=`<div class="vh-glass-card">
      <div class="vh-card-head"><h3>AI Trend Score</h3><span class="vh-tag">0-100</span></div>
      <div class="vh-stats">
        <div class="vh-stat"><div class="vhs-num">${pure.length}</div><div class="vhs-lab">Creator usage</div></div>
        <div class="vh-stat"><div class="vhs-num">+${Math.max(...grouped.map(g=>g.score),0)}</div><div class="vhs-lab">Recent growth</div></div>
        <div class="vh-stat"><div class="vhs-num">${Math.round(pure.reduce((a,v)=>a+v.views,0)/pure.length).toLocaleString()}</div><div class="vhs-lab">Views speed</div></div>
        <div class="vh-stat"><div class="vhs-num">${grouped.length}</div><div class="vhs-lab">Competition</div></div>
      </div>
    </div>
    <div class="vh-card-head"><h3>Top scored hashtags</h3></div>`
    + grouped.slice(0,8).map(g=>{
        const cls=g.score>=70?"hot":g.score>=40?"warm":"cold";
        return `<div class="vh-row" data-h="${g.hashtag}"><span class="vh-hash">${g.hashtag}</span><div class="vh-row-body"><div class="vh-row-t"><span>${g.count} pure videos</span><span>${g.avgViews.toLocaleString()} avg views</span></div><div class="vh-bar"><i style="width:${g.score}%"></i></div></div><span class="vh-score ${cls}">${g.score}</span></div>`;
      }).join("");
    body.querySelectorAll(".vh-row[data-h]").forEach(r=>r.addEventListener("click",()=>{ renderAnalyzer($("#vhBody"),r.dataset.h); activateTab("analyzer"); }));
  }

  function renderWatchlist(body){
    const wl=lsGet(LS.watchlist,[]);
    body.innerHTML=`<div class="vh-card-head"><h3>Your Watchlist</h3><button class="vh-btn ghost" id="vhWlClear">Clear</button></div>`;
    if(!wl.length){ body.innerHTML+=`<div class="vh-empty">Save hashtags, channels or trends here to track them.</div>`; }
    else {
      body.innerHTML+=`<div class="vh-wl">${wl.map((item,i)=>`<span class="vh-wl-chip">${item}<button data-delwl="${i}" title="Remove">&#10005;</button></span>`).join("")}</div>`;
      body.querySelectorAll("[data-delwl]").forEach(b=>b.addEventListener("click",()=>{ wl.splice(+b.dataset.delwl,1); lsSet(LS.watchlist,wl); renderWatchlist(body); }));
    }
    const clear=$("#vhWlClear"); if(clear) clear.addEventListener("click",()=>{ lsSet(LS.watchlist,[]); renderWatchlist(body); });
  }

  function isWatched(h){ return (lsGet(LS.watchlist,[])).includes(h); }
  function toggleWatch(h,btn){
    const wl=lsGet(LS.watchlist,[]);
    const i=wl.indexOf(h);
    if(i>-1){ wl.splice(i,1); if(btn){btn.classList.remove("active");btn.innerHTML="&#9733; Add to Watchlist";} notify(`Removed <b>${h}</b> from watchlist`); }
    else { wl.push(h); if(btn){btn.classList.add("active");btn.innerHTML="&#10003; In Watchlist";} notify(`Added <b>${h}</b> to watchlist`); }
    lsSet(LS.watchlist,wl);
  }

  // ---------- Notifications ----------
  function notify(html){
    let n=$(".vh-notif"); if(!n){ n=document.createElement("div"); n.className="vh-notif"; document.body.appendChild(n); }
    n.innerHTML=html; n.classList.add("show");
    clearTimeout(n._t); n._t=setTimeout(()=>n.classList.remove("show"),2600);
  }
  function checkNotifications(){
    // new trend alert: a hashtag crossed a high score
    const pure=applySingleHashtagFilter(SAMPLE_VIDEOS);
    const grouped=groupByHashtag(pure);
    const top=grouped[0];
    if(top && top.score>=70){ notify(`Trend alert: <b>${top.hashtag}</b> is spiking (score ${top.score})`); }
  }

  // ---------- Helpers ----------
  function $(s,r){ return (r||document).querySelector(s); }
  function activateTab(name){ const b=$(`#vhTabs button[data-tab="${name}"]`); if(b){ overlay.querySelectorAll("#vhTabs button").forEach(x=>x.classList.remove("active")); b.classList.add("active"); } }

  // ---------- Init on load ----------
  function init(){
    if(!document.body) { document.addEventListener("DOMContentLoaded",init); return; }
    buildFab();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
  else init();

  // Expose for potential API integration / testing
  window.VH = { applySingleHashtagFilter, extractDescHashtags, isPureSingleHashtag, openDashboard };
})();
