/* ============================================================
   YouTube Creator Hub — Application
   Router + tool grid + per-tool dynamic forms + AI integration.
   ============================================================ */
(function(){
  "use strict";
  const D = window.YTHUB_DATA;
  const $ = (sel, root) => (root||document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root||document).querySelectorAll(sel));
  const app = $("#app");

  $("#year").textContent = new Date().getFullYear();

  // ---------- Analytics tracking (fire-and-forget) ----------
  function getVisitorId(){
    try{ let id=localStorage.getItem("ych_visitor_id"); if(!id){ id="v_"+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem("ych_visitor_id",id);} return id; }catch(e){ return ""; }
  }
  function trackVisit(){
    try{ fetch("/api/track/visit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({visitorId:getVisitorId(),pagePath:location.pathname+location.hash,referrer:document.referrer||""}),keepalive:true}).catch(()=>{}); }catch(e){}
  }
  function trackToolUse(toolId, toolTitle, action){
    try{ fetch("/api/track/use",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({toolId,toolTitle,visitorId:getVisitorId(),action}),keepalive:true}).catch(()=>{}); }catch(e){}
  }

  // ---------- Utilities ----------
  function esc(s){ return (s==null?"":String(s)).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
  function toast(msg, type){ const el=$("#toast"); el.textContent=msg; el.className="toast "+(type||"success"); el.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>{el.hidden=true;},2200); }
  function copyText(text){ if(!text){toast("Nothing to copy","error");return;} const p=navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(text):Promise.reject(); p.then(()=>toast("Copied to clipboard")).catch(()=>{ const ta=document.createElement("textarea"); ta.value=text; document.body.appendChild(ta); ta.select(); try{document.execCommand("copy");toast("Copied");}catch(e){toast("Copy failed","error");} ta.remove(); }); }

  // ---------- Router ----------
  const routes = { "/": renderTools, "/tools": renderTools, "/tool": renderToolPage, "/ask-ai": renderAskAI, "/favorites": ()=>renderList("favorites") };
  function parseRoute(){
    let h = location.hash.replace(/^#/,"") || "/";
    const query={}; const qm=h.indexOf("?"); if(qm>-1){ h.slice(qm+1).split("&").forEach(kv=>{ const [k,v]=kv.split("="); if(k) query[decodeURIComponent(k)]=decodeURIComponent((v||"").replace(/\+/g," ")); }); h=h.slice(0,qm); }
    return { path:"/"+h.split("/").filter(Boolean)[0], query };
  }
  function navigate(hash){ location.hash=hash; }
  window.addEventListener("hashchange", render);
  function render(){ window.scrollTo({top:0}); app.innerHTML=""; closeModal(); const r=parseRoute(); (routes[r.path]||renderTools)(r); trackVisit(); }
  const askBtn=$("#askBtn"); if(askBtn) askBtn.addEventListener("click",()=>navigate("#/ask-ai"));
  const favBtn=$("#favBtn"); if(favBtn) favBtn.addEventListener("click",()=>navigate("#/favorites"));

  // ---------- Tool grid ----------
  function getCat(id){ return D.categories.find(c=>c.id===id); }
  const CAT_TINTS = { titles:"#ffd60a", script:"#f0b400", audio:"#e0a200", visual:"#ffcf2e", growth:"#ffe066", community:"#f5a623", money:"#ffdf6b", repurpose:"#e6b400", calc:"#f2c14e", production:"#fcc200", translate:"#ffd60a", ai:"#0f0f10" };
  function catTint(id){ const c=getCat(id); return (c&&c.color)||CAT_TINTS[id]||"#ffd60a"; }
  function toolCardHTML(t){
    const fav=D.favorites.includes(t.id); const cat=getCat(t.cat);
    return `<article class="tool-card-mini" data-id="${t.id}" data-cat-color style="--cat:${catTint(t.cat)}">
      <button class="tc-fav ${fav?"active":""}" data-fav="${t.id}" aria-label="Favorite">&#10084;</button>
      <div class="tc-icon">${t.icon}</div>
      <h3>${esc(t.title)}</h3>
      <p class="bangla">${esc(t.bangla||"")}</p>
    </article>`;
  }
  function bindToolCards(root){
    $$(".tool-card-mini", root).forEach(card=>{ card.addEventListener("click", e=>{ if(e.target.closest("[data-fav]")) return; navigate("#/tool?id="+card.dataset.id); }); });
    $$("[data-fav]", root).forEach(btn=>{ btn.addEventListener("click", e=>{ e.stopPropagation(); const id=btn.dataset.fav; toggleFav(id); const is=D.favorites.includes(id); btn.classList.toggle("active",is); }); });
  }
  function toggleFav(id){ const i=D.favorites.indexOf(id); if(i>-1){D.favorites.splice(i,1);toast("Removed from favorites");} else {D.favorites.push(id);toast("Added to favorites");} }

  // ---------- Recently used + usage stat + onboarding ----------
  function logToolUse(id){
    try{
      let used=JSON.parse(localStorage.getItem("ych_recent")||"[]");
      used=used.filter(x=>x!==id); used.unshift(id); used=used.slice(0,8);
      localStorage.setItem("ych_recent",JSON.stringify(used));
      let week=JSON.parse(localStorage.getItem("ych_week")||"[]");
      week.push(Date.now()); week=week.filter(ts=>Date.now()-ts<7*86400000);
      localStorage.setItem("ych_week",JSON.stringify(week));
    }catch(e){}
  }
  function getRecentTools(){
    try{ const used=JSON.parse(localStorage.getItem("ych_recent")||"[]");
      return used.map(id=>D.tools.find(t=>t.id===id)).filter(Boolean);
    }catch(e){ return []; }
  }
  function usageStat(){
    try{ const week=JSON.parse(localStorage.getItem("ych_week")||"[]");
      const n=week.filter(ts=>Date.now()-ts<7*86400000).length;
      return n>0 ? String(n) : "";
    }catch(e){ return ""; }
  }
  function maybeShowOnboarding(){
    try{ if(localStorage.getItem("ych_onboard_done")) return;
      const slides=[
        {t:"Welcome", d:"Pick any of the 48 AI tools from the grid to get started."},
        {t:"Ask AI", d:"Tap Ask AI in the top bar to ask any YouTube-strategy question."},
        {t:"Favorites & History", d:"Heart your favorite tools and revisit past results anytime."}
      ];
      let i=0;
      const root=document.createElement("div"); root.className="onboard";
      const render=()=>{ root.innerHTML=`<div class="ob-head"><b>${slides[i].t}</b><button class="ob-close">✕</button></div><div class="ob-body">${slides[i].d}</div><div class="ob-dots">${slides.map((_,x)=>`<div class="ob-dot${x===i?" active":""}"></div>`).join("")}</div><div class="ob-nav">${i>0?'<button class="tb-btn" data-ob-prev>Back</button>':'<span></span>'}<button class="ob-btn" data-ob-next>${i<slides.length-1?"Next":"Done"}</button></div>`;
        root.querySelector(".ob-close").onclick=close; root.querySelector(".ob-btn").onclick=()=>{ if(i<slides.length-1){i++;render();}else close(); };
        const pv=root.querySelector("[data-ob-prev]"); if(pv) pv.onclick=()=>{i--;render();};
      };
      function close(){ root.remove(); try{localStorage.setItem("ych_onboard_done","1");}catch(e){} }
      render(); document.body.appendChild(root);
    }catch(e){}
  }
  window.addEventListener("load", ()=>{ maybeShowOnboarding(); });

  function renderTools(){
    const tpl=$("#tpl-tools").content.cloneNode(true); app.appendChild(tpl);
    const grid=$("#toolsGrid"), chips=$("#catChips");
    // Usage stat
    const usage=usageStat();
    if(usage){ const head=$(".page-head", app); head.insertAdjacentHTML("afterbegin", `<div class="usage-stat">&#9889; ${usage} used this week</div>`); }
    // Recently used
    const recent=getRecentTools();
    if(recent.length){
      const sec=document.createElement("div"); sec.className="recent-section container"; sec.style.padding="16px 0 4px";
      sec.innerHTML=`<h2>Recently Used</h2><div class="recent-grid">${recent.map(t=>{const c=getCat(t.cat);return `<button class="recent-chip" data-rid="${t.id}"><span class="tc-icon" style="--cat:${catTint(t.cat)}">${t.icon}</span>${esc(t.title)}</button>`;}).join("")}</div>`;
      app.insertBefore(sec, app.firstChild);
      $$("[data-rid]",sec).forEach(b=>b.addEventListener("click",()=>navigate("#/tool?id="+b.dataset.rid)));
    }
    function draw(){
      const active=chips.dataset.active||"all";
      const list=D.tools.filter(t=>active==="all"||t.cat===active);
      grid.innerHTML=list.map(toolCardHTML).join(""); bindToolCards(grid);
      animateCards(grid);
    }
    chips.innerHTML=`<button class="chip active" data-cat="all">All</button>`+D.categories.map(c=>`<button class="chip" data-cat="${c.id}">${esc(c.name)}</button>`).join("");
    chips.dataset.active="all";
    $$(".chip",chips).forEach(c=>c.addEventListener("click",()=>{ $$(".chip",chips).forEach(x=>x.classList.remove("active")); c.classList.add("active"); chips.dataset.active=c.dataset.cat; draw(); }));
    draw();
  }
  function animateCards(root){
    const cards=$$(".tool-card-mini",root);
    if(!("IntersectionObserver" in window)){
      cards.forEach(c=>c.classList.add("in-view")); return;
    }
    const io=new IntersectionObserver((es)=>{
      es.forEach((e,i)=>{ if(e.isIntersecting){ setTimeout(()=>e.target.classList.add("in-view"), Math.min(i*60,360)); io.unobserve(e.target); } });
    },{rootMargin:"0px 0px -40px 0px"});
    cards.forEach(c=>io.observe(c));
  }

  // ---------- Dynamic field builder ----------
  function buildFieldHTML(f){
    const k=f.key;
    switch(f.type){
      case "textarea": return `<label class="label">${esc(f.label)}${f.required?' <b style="color:var(--danger)">*</b>':""}</label><textarea data-field="${k}" class="textarea" rows="${f.rows||4}" placeholder="${esc(f.ph||"")}"></textarea>`;
      case "select": return `<label class="label">${esc(f.label)}</label><select data-field="${k}" class="select">${(f.options||[]).map(o=>`<option value="${esc(o.v)}">${esc(o.l)}</option>`).join("")}</select>`;
      case "number": return `<label class="label">${esc(f.label)}</label><input data-field="${k}" type="number" class="select" value="${f.def!==undefined?f.def:""}" min="${f.min!==undefined?f.min:""}" max="${f.max!==undefined?f.max:""}" step="${f.step!==undefined?f.step:"any"}" style="padding:12px"/>`;
      case "range": return `<label class="label">${esc(f.label)}: <b class="range-val" id="rv_${k}">${f.def!==undefined?f.def:""}</b></label><input data-field="${k}" type="range" class="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${f.def!==undefined?f.def:""}" oninput="document.getElementById('rv_${k}').textContent=this.value"/>`;
      case "toggle": return `<label class="toggle"><input data-field="${k}" type="checkbox" ${f.def?"checked":""}/><span>${esc(f.label)}</span></label>`;
      case "voice": return `<label class="label">${esc(f.label)}</label><select data-field="${k}" class="select"><option value="auto">Default voice</option></select>`;
      case "file": return `<label class="label">${esc(f.label)}</label><input data-field="${k}" type="file" class="select" accept="audio/*"/>`;
      case "mic": return `<button data-field="${k}" class="btn btn-primary" type="button">&#127908; ${esc(f.label)}</button>`;
      default: return `<label class="label">${esc(f.label)}${f.required?' <b style="color:var(--danger)">*</b>':""}</label><input data-field="${k}" class="select" placeholder="${esc(f.ph||"")}" style="padding:12px"/>`;
    }
  }
  function readField(f, el){ if(!el) return ""; if(f.type==="toggle") return !!el.checked; if(f.type==="range"||f.type==="number") return parseFloat(el.value); return el.value; }
  function readAll(spec, els){ const o={}; spec.forEach(f=>{ o[f.key]=readField(f, els[f.key]); }); return o; }

  // ---------- Tool page ----------
  function renderToolPage(r){
    const tool=D.tools.find(t=>t.id===r.query.id)||D.tools[0];
    const tpl=$("#tpl-tool").content.cloneNode(true); app.appendChild(tpl);
    $("#toolTitle").textContent=tool.title; $("#toolDesc").textContent=tool.bangla||""; $("#toolIcon").innerHTML=tool.icon;
    const output=$("#toolOutput"), genBtn=$("#generateBtn"), copyBtn=$("#copyBtn"), clearBtn=$(".tb-btn[data-act='clear']"), errBox=$("#errBox"), fieldsRoot=$("#toolFields");
    logToolUse(tool.id);
    trackToolUse(tool.id, tool.title, "open");

    const specDef=window.YTHUB_SPEC.get(tool); const spec=specDef.fields||[]; const els={};
    fieldsRoot.innerHTML=spec.map(buildFieldHTML).join("");
    spec.forEach(f=>{ els[f.key]=$("[data-field='"+f.key+"']", fieldsRoot); if(els[f.key]&&els[f.key].addEventListener&&f.type!=="file"&&f.type!=="mic"){ els[f.key].addEventListener("input",()=>{}); if(f.type==="toggle") els[f.key].addEventListener("change",()=>{}); } });
    if(specDef.speech) setupSpeech(tool, spec, els);

    function setOutput(html,isRaw){ output.innerHTML=html; output.classList.toggle("has-content", !!(isRaw?output.innerText.trim():true)); }
    function showError(m){ errBox.textContent=m; errBox.hidden=false; }
    function hideError(){ errBox.hidden=true; errBox.textContent=""; }
    function setBtnState(st){
      // st: idle | loading | success
      genBtn.disabled = st==="loading";
      genBtn.classList.toggle("loading", st==="loading");
      const lab=$(".btn-label",genBtn);
      const btnText = specDef.speech ? "Listen" : (tool.id==="ask-ai"?"Get Answer":"Generate");
      if(lab){
        if(st==="loading") lab.textContent = "Generating"+"<span class='btn-dots'>…</span>";
        else if(st==="success") lab.textContent = "✓ Done";
        else lab.textContent = btnText;
      }
      const sp=$(".spinner",genBtn); if(sp) sp.hidden = st!=="loading";
      if(st==="success"){ genBtn.classList.add("success"); setTimeout(()=>genBtn.classList.remove("success"),900); }
    }
    function loadingHTML(){ return `<div class="empty-state"><div class="empty-illus"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/></svg></div><p class="muted small">Generating<span class="dots">…</span></p></div>`; }

    function runGenerate(){
      const vals=readAll(spec, els);
      for(const f of spec){ if(f.required){ const v=vals[f.key]; if(!v||(typeof v==="string"&&!v.trim())){ showError("Please fill in: "+f.label); return; } } }
      hideError();
      if(specDef.calc){ setOutput(runCalc(specDef.calc, vals)); return; }
      if(specDef.speech) return;
      trackToolUse(tool.id, tool.title, "generate");
      setOutput(loadingHTML(), true);
      setBtnState("loading");
      let done=false;
      const cbs={
        chunk:(t)=>{ output.classList.add("streaming"); setOutput(renderMarkdown(t)+'<span class="caret"></span>',true); },
        done:(t)=>{ output.classList.remove("streaming"); const formatted=formatResult(tool.id, t); setOutput(formatted+outputActionsHTML(tool,t),true); addHistory(tool,t); setBtnState("success"); bindOutputActions(tool,t); },
        error:(m)=>{ setBtnState("idle"); showError(m||"Couldn't generate — try again"); }
      };
      if(done) return; done=true;
      generate(tool, vals, specDef, cbs);
    }

    genBtn.addEventListener("click", runGenerate);

    copyBtn.addEventListener("click",()=>copyText(output.innerText.replace(/\s+/g," ").trim()));
    clearBtn.addEventListener("click",()=>{ output.innerHTML='<div class="empty-state"><div class="empty-illus"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><p>Your result will appear here.</p></div>'; output.classList.remove("has-content"); toast("Cleared"); });
    $(".tb-btn[data-act='fav']").addEventListener("click",()=>{ const b=$(".tb-btn[data-act='fav']"); b.classList.toggle("active"); toggleFav(tool.id); });
    if(D.favorites.includes(tool.id)) $(".tb-btn[data-act='fav']").classList.add("active");
    $(".tb-btn[data-act='save']").addEventListener("click",()=>{ const t=output.innerText.trim(); if(!t||t.startsWith("Your generated result")||t.startsWith("Your result")){toast("Generate something first","error");return;} D.saved.unshift({id:uid(),toolId:tool.id,title:tool.title,output:t,ts:Date.now()}); toast("Saved"); });
    $(".tb-btn[data-act='history']").addEventListener("click",()=>openHistoryModal(tool));
    $(".tb-btn[data-act='share']").addEventListener("click",()=>{ copyText(location.href); toast("Link copied — share it anywhere"); });

    // Regenerate: reuses the same inputs
    const regen = document.createElement("button");
    regen.className="tb-btn"; regen.style.marginTop="6px"; regen.innerHTML="&#8635; Regenerate";
    regen.addEventListener("click", runGenerate);
    const inputCol = $(".input-col"); if(inputCol && !specDef.speech && !specDef.calc) inputCol.appendChild(regen);
  }

  // ---------- Per-tool result formatting ----------
  function formatResult(toolId, text){
    if(!text) return renderMarkdown(text);
    const clean = text.replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
    // Tag / hashtag generators -> tag chips
    if(toolId==="tag-gen" || toolId==="hashtag-gen"){
      const items = text.split(/[\n,]+/).map(s=>s.trim()).filter(s=>s && !/^#?\d/.test(s) && !/^tags|hashtags|generate|relevant|broad|niche|hyper/i.test(s));
      const tags = items.slice(0,30);
      if(tags.length) return `<div class="result-tags">${tags.map(t=>`<span class="result-tag">${esc(t.replace(/^#/,""))}</span>`).join("")}</div>`;
    }
    // Numbered list tools (titles, ideas, hooks, prompts)
    if(["title-gen","ab-title","video-ideas","hook-gen","trending-finder","image-prompt","banner-concepts","merch-ideas","poll-gen","live-title","pinned-comment","comment-reply"].includes(toolId)){
      const lines = text.split(/\n/).map(s=>s.trim()).filter(Boolean);
      const numbered = lines.filter(l=>/^\d+[.)]/.test(l));
      if(numbered.length>=3) return `<div class="result-list">${numbered.map(l=>{ const m=l.match(/^(\d+)[.)]\s*(.*)$/); return `<div class="r-item"><span class="r-num">${m[1]}.</span><span>${esc(m[2])}</span></div>`; }).join("")}</div>`;
    }
    // Chapter generator -> timestamp-aligned
    if(toolId==="chapter-gen"){
      const lines = text.split(/\n/).map(s=>s.trim()).filter(Boolean);
      const ts = lines.filter(l=>/^\d{1,2}:\d{2}/.test(l));
      if(ts.length) return `<div class="result-list">${ts.map(l=>{ const m=l.match(/^(\d{1,2}:\d{2})\s*(.*)$/); return `<div class="r-item"><span class="r-num" style="min-width:52px;font-family:ui-monospace,monospace">${m[1]}</span><span>${esc(m[2])}</span></div>`; }).join("")}</div>`;
    }
    // Script tools -> script block with scene breaks
    if(["long-script","shorts-script","outline-gen","cta-gen","shot-list"].includes(toolId)){
      const scene = text.split(/\n{2,}/).map(b=>`<div class="result-block">${esc(b.trim())}</div>`).join("");
      if(scene) return `<div class="prose">${scene}</div>`;
    }
    // TTS is not AI text; skip. Calculators handled separately.
    return renderMarkdown(text);
  }

  // ---------- Output actions (Copy / Save / Share / Use in tool) ----------
  function outputActionsHTML(tool, text){
    return `<div class="output-actions">
      <button class="out-act primary" data-oa="copy">&#128203; Copy</button>
      <button class="out-act" data-oa="save">&#128190; Save</button>
      <button class="out-act" data-oa="share">&#8644; Share</button>
      <button class="out-act" data-oa="use">&#128279; Use in another tool</button>
    </div>`;
  }
  function bindOutputActions(tool, text){
    $$(".output-actions [data-oa]", $("#toolOutput")).forEach(b=>{
      b.addEventListener("click",()=>{
        const a=b.dataset.oa;
        if(a==="copy"){ copyText(text); b.classList.add("done"); b.textContent="✓ Copied"; setTimeout(()=>{b.classList.remove("done");b.innerHTML="&#128203; Copy";},1200); }
        else if(a==="save"){ D.saved.unshift({id:uid(),toolId:tool.id,title:tool.title,output:text,ts:Date.now()}); toast("Saved"); b.classList.add("done"); }
        else if(a==="share"){ copyText(text); toast("Result copied — share it anywhere"); }
        else if(a==="use"){ openUseInTool(tool, text); }
      });
    });
  }
  function openUseInTool(fromTool, text){
    const others=D.tools.filter(t=>t.id!==fromTool.id).slice(0,8);
    const html=`<div class="modal-backdrop" id="useModal"><div class="modal"><div class="modal-head"><h3>Send to another tool</h3><button class="icon-btn" data-close>&times;</button></div><div class="modal-body"><p class="muted small" style="margin-bottom:10px">Choose a tool to send this output into:</p>${others.map(t=>`<button class="list-item" data-ut="${t.id}" style="width:100%;text-align:left;display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--line);border-radius:10px;margin-bottom:8px;cursor:pointer"><span class="tc-icon" style="width:28px;height:28px;display:grid;place-items:center;border-radius:8px">${t.icon}</span><span>${esc(t.title)}</span></button>`).join("")}</div></div></div>`;
    $("#modalRoot").innerHTML=html; const m=$("#useModal");
    m.addEventListener("click",e=>{
      if(e.target.closest("[data-close]")||e.target===m){closeModal();return;}
      const row=e.target.closest("[data-ut]"); if(row){ navigate("#/tool?id="+row.dataset.ut); setTimeout(()=>{ const fi=$("[data-field='topic']")||$("[data-field='text']")||$("[data-field='idea']"); if(fi) fi.value=text; },150); closeModal(); }
    });
  }

  function uid(){ return "id_"+Math.random().toString(36).slice(2,10); }
  function addHistory(tool,text){ D.history.unshift({id:uid(),toolId:tool.id,title:tool.title,output:(text||"").slice(0,2000),ts:Date.now()}); if(D.history.length>200)D.history.length=200; }

  // ---------- Calculators ----------
  function runCalc(type, v){
    if(type==="earnings"){ const views=+v.views||0, cpm=+v.cpm||0; const rev=(views/1000)*cpm; return `<div class="prose"><h3>Estimated Earnings</h3><p>Monthly views: <b>${views.toLocaleString()}</b></p><p>CPM: <b>$${cpm.toFixed(2)}</b></p><p style="font-size:24px;font-weight:800">Estimated revenue: $${rev.toLocaleString()}</p><p class="muted small">Rough estimate. Actual RPM varies by niche and region.</p></div>`; }
    if(type==="watchtime"){ const views=+v.views||0, avg=+v.avgdur||0; const sec=views*avg; const hrs=sec/3600; return `<div class="prose"><h3>Watch Time</h3><p>Views: <b>${views.toLocaleString()}</b></p><p>Avg duration: <b>${avg}s</b></p><p style="font-size:22px;font-weight:800">${hrs.toFixed(1)} hours of watch time</p><p class="muted small">${hrs>=4000?"✔ You exceed the 4,000h monetization threshold.":"You need "+(4000-hrs).toFixed(0)+" more hours for the 4,000h threshold."}</p></div>`; }
    if(type==="growth"){ const s=+v.start||0,e=+v.end||0,d=+v.days||1; const pct=e&&s?((e-s)/s)*100:0; const daily=((e-s)/d).toFixed(1); return `<div class="prose"><h3>Subscriber Growth</h3><p>Growth: <b>${(e-s).toLocaleString()} subs</b> (${pct.toFixed(1)}%)</p><p>Daily avg: <b>+${daily}/day</b></p></div>`; }
    if(type==="lengthopt"){ const fmt=v.format||"long"; const rec = fmt==="shorts" ? "15-60 seconds" : "8-12 minutes (or 10-20 min for tutorials)"; return `<div class="prose"><h3>Recommended Length</h3><p>Topic: <b>${esc(v.topic||"—")}</b></p><p>Format: <b>${fmt==="shorts"?"Shorts":"Long-form"}</b></p><p style="font-size:22px;font-weight:800">${rec}</p><p class="muted small">Match the format to the topic: tutorials can be longer, vlogs shorter, Shorts stay under 60s.</p></div>`; }
    if(type==="length"){ const words=(v.script||"").trim().split(/\s+/).filter(Boolean).length; const wpm=v.lang==="bn"?130:150; const mins=words/wpm; const mm=Math.floor(mins), ss=Math.round((mins-mm)*60); return `<div class="prose"><h3>Pacing Estimate</h3><p>Word count: <b>${words}</b></p><p>Speaking rate: <b>${wpm} wpm</b></p><p style="font-size:24px;font-weight:800">~${mm} min ${ss} sec</p></div>`; }
    return "";
  }

  // ---------- Speech (TTS + STT) ----------
  function setupSpeech(tool, spec, els){
    if(spec.some(f=>f.type==="voice")){
      const sel=els.voice; const fill=()=>{ if(!sel)return; const voices=window.speechSynthesis?window.speechSynthesis.getVoices():[]; const cur=sel.value; sel.innerHTML='<option value="auto">Default voice</option>'+voices.map(v=>`<option value="${esc(v.name)}">${esc(v.name)}</option>`).join(""); sel.value=cur; };
      if(window.speechSynthesis){ fill(); window.speechSynthesis.onvoiceschanged=fill; }
      const btn=$("#generateBtn"), lab=$(".btn-label",btn); if(lab) lab.textContent="Listen";
      btn.addEventListener("click",()=>{ const text=(els.text&&els.text.value)||""; if(!text.trim()){toast("Enter text to speak","error");return;} speakText(text, els.voice?els.voice.value:"auto", els.speed?parseFloat(els.speed.value):1, els.pitch?parseFloat(els.pitch.value):1); });
    }
    if(spec.some(f=>f.type==="file")){ els.file.addEventListener("change",()=>{ const file=els.file.files[0]; if(!file)return; const out=$("#toolOutput"); out.innerHTML='<div class="empty-state"><div class="spinner"></div><p>Transcribing…</p></div>'; out.classList.add("has-content"); transcribeFile(file).then(t=>{ out.innerHTML=renderMarkdown(t||"No transcription."); out.classList.add("has-content"); }).catch(()=>showErr("Transcription failed — check file or API key.")); }); }
    if(spec.some(f=>f.type==="mic")){ els.mic.addEventListener("click",()=>{ const Rec=window.SpeechRecognition||window.webkitSpeechRecognition; if(!Rec){toast("Not supported in this browser","error");return;} const r=new Rec(); r.lang="en-US"; r.interimResults=true; r.continuous=false; let text=""; els.mic.textContent="Listening…"; r.onresult=ev=>{ text=Array.prototype.map.call(ev.results,x=>x[0].transcript).join(" "); }; r.onend=()=>{ els.mic.textContent="&#127908; Start live recording"; if(text){ const out=$("#toolOutput"); out.innerHTML=renderMarkdown(text); out.classList.add("has-content"); } }; r.onerror=()=>toast("Mic error","error"); r.start(); }); }
  }
  function speakText(text,voiceName,rate,pitch){ if(!window.speechSynthesis){toast("TTS not supported","error");return;} window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); if(voiceName&&voiceName!=="auto"){ const v=window.speechSynthesis.getVoices().filter(x=>x.name===voiceName)[0]; if(v)u.voice=v; } u.rate=rate||1; u.pitch=pitch||1; u.lang="en-US"; window.speechSynthesis.speak(u); }

  // ---------- AI generation ----------
  async function generate(tool, vals, specDef, cbs){
    const sys=specDef.sys||"You are a senior YouTube strategist. Produce useful, structured content.";
    const inputs=Object.keys(vals).map(k=>{ const v=vals[k]; if(v instanceof File) return ""; return k+": "+v; }).filter(s=>s).join("\n");
    const prompt=(sys+"\n\nINPUT:\n"+(inputs||"(none)"));
    const fast = ["tag-gen","hashtag-gen","hook-gen"].includes(tool.id);
    try{
      const res=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,fast})});
      if(!res.ok){ const e=await res.json().catch(()=>({})); if(e.fallback){ cbs.done(localFallback(tool)); return; } throw new Error(e.error||"Server error"); }
      const reader=res.body.getReader(); const dec=new TextDecoder(); let acc="";
      for(;;){ const {done,value}=await reader.read(); if(done)break; acc+=dec.decode(value,{stream:true}); cbs.chunk(acc); }
      cbs.done(acc||"No output returned.");
    }catch(e){ cbs.done(localFallback(tool)); }
  }
  function localFallback(tool){
    // Graceful degradation when no AI key is configured.
    return `**${tool.title}**\n\nYour AI provider isn't configured yet.\n\nTo enable real AI output:\n1. Get a free key at console.groq.com (Groq) or aistudio.google.com (Gemini).\n2. Add it in Vercel → Settings → Environment Variables.\n3. Redeploy.\n\nUntil then, add your details in the form above and the AI will generate tailored results once connected.`;
  }

  async function transcribeFile(file){
    const fd=new FormData(); fd.append("file",file);
    const res=await fetch("/api/transcribe",{method:"POST",body:fd});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||"failed");
    return data.text;
  }

  // ---------- Markdown renderer ----------
  function renderMarkdown(txt){ if(!txt) return '<p class="muted">No output.</p>'; let h=esc(txt);
    h=h.replace(/```([\s\S]*?)```/g,(m,c)=>`<pre>${c}</pre>`);
    h=h.replace(/^### (.*)$/gm,"<h3>$1</h3>"); h=h.replace(/^## (.*)$/gm,"<h2>$1</h2>"); h=h.replace(/^# (.*)$/gm,"<h1>$1</h1>");
    h=h.replace(/\*\*(.*?)\*\*/g,"<b>$1</b>");
    h=h.replace(/^[-*] (.*)$/gm,"<li>$1</li>"); h=h.replace(/^\d+\. (.*)$/gm,"<li>$1</li>");
    h=h.replace(/\n{2,}/g,"<br>"); h=h.replace(/\n/g,"<br>");
    return '<div class="prose">'+h+'</div>';
  }

  // ---------- History modal ----------
  function openHistoryModal(tool){ const items=D.history.filter(h=>h.toolId===tool.id).slice(0,30);
    const html=`<div class="modal-backdrop" id="histModal"><div class="modal"><div class="modal-head"><h3>History — ${esc(tool.title)}</h3><button class="icon-btn" data-close>&times;</button></div><div class="modal-body">${items.length?items.map(h=>`<div class="list-item" data-txt="${esc(h.output)}" style="cursor:pointer"><p>${esc(h.output.slice(0,120))}</p></div>`).join(""):'<p class="muted">No history.</p>'}</div><div class="modal-foot"><button class="tb-btn" data-clear>Clear</button><button class="tb-btn" data-close>Close</button></div></div></div>`;
    $("#modalRoot").innerHTML=html; const m=$("#histModal");
    m.addEventListener("click",e=>{ if(e.target.closest("[data-close]")||e.target===m)closeModal(); if(e.target.closest("[data-clear]")){D.history=D.history.filter(h=>h.toolId!==tool.id);closeModal();toast("Cleared");} const row=e.target.closest("[data-txt]"); if(row){ const out=$("#toolOutput"); out.innerHTML=renderMarkdown(row.dataset.txt); out.classList.add("has-content"); closeModal(); } }); }
  function closeModal(){ $("#modalRoot").innerHTML=""; }

  // ---------- Favorites list ----------
  function renderList(type){ const tpl=$("#tpl-tools").content.cloneNode(true); app.appendChild(tpl); $("#catChips").style.display="none"; $("#toolsGrid").innerHTML=D.tools.filter(t=>D.favorites.includes(t.id)).map(toolCardHTML).join(""); bindToolCards($("#toolsGrid")); const head=$(".page-head h1"); if(head) head.textContent="Favorites"; }

  // ---------- Ask AI ----------
  function renderAskAI(){ const tpl=$("#tpl-askai").content.cloneNode(true); app.appendChild(tpl);
    const out=$("#aiOut"), btn=$("#aiSubmit"), err=$("#aiErr");
    btn.addEventListener("click",()=>{ const q=$("#aiQ").value.trim(); if(!q){err.textContent="Enter a question.";err.hidden=false;return;} err.hidden=true; out.innerHTML='<div class="empty-state"><div class="spinner"></div><p>Analyzing…</p></div>'; generate({id:"ask-ai",title:"Ask AI"},{question:q},{sys:"You are a senior YouTube growth strategist. Answer with clear structured advice: problem analysis, reasons, step-by-step solution, and tips."},{chunk:t=>{out.innerHTML=renderMarkdown(t);},done:t=>{out.innerHTML=renderMarkdown(t);},error:()=>{out.innerHTML='<p class="muted">Could not reach AI.</p>';}}); });
  }

  // ---------- Init ----------
  render();
  window.addEventListener("load", ()=>{});
})();
// deploy marker 1786567699
