/* YouTube Creator Hub — Application */
(function(){
  "use strict";
  const D = window.YTHUB_DATA;
  const $ = (sel, root) => (root||document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root||document).querySelectorAll(sel));
  const app = $("#app");

  // Year in footer
  $("#year").textContent = new Date().getFullYear();

  // ========== Utilities ==========
  function uid(){ return "id_"+Math.random().toString(36).slice(2,10); }
  function esc(s){ return (s==null?"":String(s))
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
  function fmtTime(ts){
    const d = new Date(ts);
    const now = Date.now();
    const diff = (now-ts)/1000;
    if(diff<60) return "just now";
    if(diff<3600) return Math.floor(diff/60)+"m ago";
    if(diff<86400) return Math.floor(diff/3600)+"h ago";
    return d.toLocaleString();
  }
  function toast(msg, type){
    const el = $("#toast");
    el.textContent = msg;
    el.className = "toast "+(type||"success");
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(()=>{ el.hidden = true; }, 2200);
  }
  function copyText(text){
    if(!text){ toast("Nothing to copy","error"); return; }
    const p = navigator.clipboard && navigator.clipboard.writeText
      ? navigator.clipboard.writeText(text)
      : new Promise((res,rej)=>{
          const ta = document.createElement("textarea");
          ta.value = text; document.body.appendChild(ta); ta.select();
          try{ document.execCommand("copy"); res(); }catch(e){ rej(e); }
          ta.remove();
        });
    p.then(()=>toast("Copied to clipboard")).catch(()=>toast("Copy failed","error"));
  }
  function shareThing({title, text, url}){
    const shareData = { title:title||"YouTube Creator Hub", text:text||"", url:url||location.href };
    if(navigator.share){
      navigator.share(shareData).catch(()=>{});
    } else {
      copyText(url||location.href);
      toast("Link copied — share it anywhere");
    }
  }

  function loadingHTML(){
    return `<div class="empty-state" style="min-height:220px">
      <div class="spinner" style="width:28px;height:28px;border-width:3px;border-color:rgba(0,0,0,.15);border-top-color:#000"></div>
      <p>Generating<span class="dots"></span></p>
    </div>`;
  }

  // ========== Simple Router ==========
  // "/" now shows the tools grid directly (no fancy landing page).
  const routes = {
    "/": renderTools,
    "/tools": renderTools,
    "/tool": renderToolPage,
    "/ask-ai": renderAskAI,
    "/favorites": ()=>renderList("favorites"),
    "/history": ()=>renderList("history"),
    "/saved": ()=>renderList("saved"),
    "/admin": renderAdmin,
    "/category": renderCategory
  };
  function parseRoute(){
    let h = location.hash.replace(/^#/,"") || "/";
    // Strip query string BEFORE splitting path
    const query = {};
    const qm = h.indexOf("?");
    if(qm>-1){
      h.slice(qm+1).split("&").forEach(kv=>{
        const [k,v] = kv.split("=");
        if(k) query[decodeURIComponent(k)] = decodeURIComponent((v||"").replace(/\+/g," "));
      });
      h = h.slice(0, qm);
    }
    const parts = h.split("/").filter(Boolean);
    const path = "/"+(parts[0]||"");
    // Also support path/key/value style
    const rest = parts.slice(1);
    rest.forEach((seg,i)=>{
      if(i%2===0) query[seg] = rest[i+1] || "";
    });
    return { path, query };
  }
  function navigate(hash){ location.hash = hash; }
  window.addEventListener("hashchange", render);

  // ========== Mobile Menu + Search ==========
  const menuBtn = $("#moreBtn"), mobileMenu = $("#mobileMenu");
  // Start hidden
  mobileMenu.classList.remove("show");
  function setMenu(open){
    mobileMenu.classList.toggle("show", !!open);
    if(menuBtn) menuBtn.setAttribute("aria-expanded", String(!!open));
  }
  setMenu(false);
  if(menuBtn) menuBtn.addEventListener("click", (e)=>{
    e.stopPropagation();
    const open = !mobileMenu.classList.contains("show");
    setMenu(open);
    if(open) setSearch(false);
  });
  mobileMenu.addEventListener("click", e=>{
    const a = e.target.closest("a");
    if(a){ setMenu(false); }
  });
  // Close menu when clicking outside
  document.addEventListener("click", e=>{
    if(mobileMenu.classList.contains("show") && !e.target.closest("#mobileMenu") && !e.target.closest("#moreBtn")){
      setMenu(false);
    }
  });
  // Quick nav buttons
  const askBtn = $("#askBtn");
  if(askBtn) askBtn.addEventListener("click", ()=>navigate("#/ask-ai"));
  const favBtn = $("#favBtn");
  if(favBtn) favBtn.addEventListener("click", ()=>navigate("#/favorites"));
  const searchBtn = $("#searchBtn"), searchDrawer = $("#searchDrawer"),
        searchInput = $("#searchInput"), searchResults = $("#searchResults"), closeSearch = $("#closeSearch");
  searchDrawer.classList.remove("show");
  function setSearch(open){
    searchDrawer.classList.toggle("show", open);
    if(open){ setTimeout(()=>searchInput.focus(), 50); runSearch(searchInput.value); }
    else { searchResults.innerHTML = ""; }
  }
  setSearch(false);
  searchBtn.addEventListener("click", (e)=>{
    e.stopPropagation();
    setSearch(!searchDrawer.classList.contains("show"));
    if(searchDrawer.classList.contains("show")) setMenu(false);
  });
  closeSearch.addEventListener("click", ()=>setSearch(false));
  searchInput.addEventListener("input", ()=>runSearch(searchInput.value));
  function runSearch(q){
    q = (q||"").trim().toLowerCase();
    if(!q){ searchResults.innerHTML = ""; return; }
    const matches = D.tools.filter(t =>
      (t.title||"").toLowerCase().includes(q) ||
      (t.bangla||"").toLowerCase().includes(q) ||
      getCatName(t.cat).toLowerCase().includes(q)
    ).slice(0,20);
    searchResults.innerHTML = matches.length
      ? matches.map(t=>`<li data-id="${t.id}"><span class="tc-icon" style="width:32px;height:32px;display:grid;place-items:center;border:1px solid var(--line);border-radius:8px">${t.icon}</span><div><div class="tt">${esc(t.title)}</div><div class="tc">${esc(getCatName(t.cat))}</div></div></li>`).join("")
      : `<li class="muted" style="padding:14px">No tools found for "${esc(q)}"</li>`;
    $$("li[data-id]", searchResults).forEach(li=>{
      li.addEventListener("click", ()=>{
        searchDrawer.hidden = true; searchInput.value=""; searchResults.innerHTML="";
        navigate("#/tool?id="+li.dataset.id);
      });
    });
  }
  // Close search with Escape
  document.addEventListener("keydown", e=>{
    if(e.key==="Escape"){
      if(searchDrawer.classList.contains("show")) setSearch(false);
      if(mobileMenu.classList.contains("show")) setMenu(false);
      closeModal();
    }
  });

  function getCatName(id){
    const c = D.categories.find(c=>c.id===id); return c?c.name:"Tools";
  }
  function getCat(id){ return D.categories.find(c=>c.id===id); }

  // ========== Render dispatcher ==========
  function render(){
    window.scrollTo({top:0,behavior:"instant"});
    app.innerHTML = "";
    // Close mobile menu / search on render
    if(mobileMenu){ setMenu(false); }
    if(searchDrawer){ setSearch(false); }
    closeModal();
    const r = parseRoute();
    const handler = routes[r.path] || renderHome;
    handler(r);
  }

  // ========== Home ==========
  function renderHome(){
    const tpl = $("#tpl-home").content.cloneNode(true);
    app.appendChild(tpl);

    // Stats
    $("#statTools").textContent = D.tools.length;
    $("#statCats").textContent = D.categories.length;

    // Featured tools
    const feat = D.tools.filter(t=>t.featured).slice(0,8);
    const fg = $("#featuredGrid");
    fg.innerHTML = feat.map(toolCardHTML).join("");
    bindToolCards(fg);

    // Categories
    const cg = $("#categoriesGrid");
    cg.innerHTML = D.categories.map(c=>`
      <a class="cat-card" href="#/category?id=${esc(c.id)}">
        <span class="cc-icon">${c.icon}</span>
        <div><h4>${esc(c.name)}</h4>
        <small>${D.tools.filter(t=>t.cat===c.id).length} tools</small></div>
      </a>`).join("");
  }

  function toolCardHTML(t){
    const fav = D.favorites.includes(t.id);
    const cat = getCat(t.cat);
    return `<article class="tool-card-mini fade-in" data-id="${t.id}">
      <div class="tc-icon">${t.icon}</div>
      <div class="tc-body">
        <div class="tc-cat">${esc(cat?cat.name:"")}</div>
        <h3>${esc(t.title)}</h3>
        <p class="bangla">${esc(t.bangla||"")}</p>
      </div>
      <button class="tc-fav ${fav?"active":""}" data-fav="${t.id}" aria-label="Favorite">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="${fav?"var(--yellow)":"none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
      </button>
    </article>`;
  }
  function bindToolCards(root){
    $$(".tool-card-mini", root).forEach(card=>{
      card.addEventListener("click", e=>{
        if(e.target.closest("[data-fav]")) return;
        navigate("#/tool?id="+card.dataset.id);
      });
    });
    $$("[data-fav]", root).forEach(btn=>{
      btn.addEventListener("click", e=>{
        e.stopPropagation();
        const id = btn.dataset.fav;
        toggleFav(id);
        // re-render just icon state
        const isFav = D.favorites.includes(id);
        btn.classList.toggle("active", isFav);
        btn.querySelector("svg").setAttribute("fill", isFav?"var(--yellow)":"none");
      });
    });
  }
  function toggleFav(id){
    const i = D.favorites.indexOf(id);
    if(i>-1){ D.favorites.splice(i,1); toast("Removed from favorites"); }
    else{ D.favorites.push(id); toast("Added to favorites"); }
    D.persist();
  }

  // ========== All Tools page ==========
  function renderTools(){
    const tpl = $("#tpl-tools").content.cloneNode(true);
    app.appendChild(tpl);
    const grid = $("#toolsGrid");
    const chips = $("#catChips");
    const search = $("#toolsSearch");
    const empty = $("#toolsEmpty");

    function draw(){
      const q = (search.value||"").toLowerCase();
      const active = chips.dataset.active || "all";
      const list = D.tools.filter(t=>{
        const catOk = active==="all" || t.cat===active;
        const qOk = !q || t.title.toLowerCase().includes(q) || (t.bangla||"").toLowerCase().includes(q);
        return catOk && qOk;
      });
      grid.innerHTML = list.map(toolCardHTML).join("");
      bindToolCards(grid);
      empty.hidden = list.length>0;
    }

    chips.innerHTML =
      `<button class="chip yellow active" data-cat="all">All</button>`+
      D.categories.map(c=>`<button class="chip yellow" data-cat="${c.id}">${esc(c.name)}</button>`).join("");
    chips.dataset.active = "all";
    $$(".chip", chips).forEach(c=>{
      c.addEventListener("click", ()=>{
        $$(".chip", chips).forEach(x=>x.classList.remove("active"));
        c.classList.add("active");
        chips.dataset.active = c.dataset.cat;
        draw();
      });
    });
    search.addEventListener("input", draw);
    draw();
  }

  // ========== Category page ==========
  function renderCategory(r){
    const cat = getCat(r.query.id);
    const wrap = document.createElement("section");
    wrap.className = "container section";
    wrap.innerHTML = `
      <div class="page-head">
        <a href="#/tools" class="back-link">&larr; All tools</a>
        <h1>${esc(cat?cat.name:"Category")}</h1>
        <p class="muted">Browse all tools in this category.</p>
      </div>
      <div id="cg" class="grid grid-4"></div>`;
    app.appendChild(wrap);
    const list = D.tools.filter(t=>t.cat===(r.query.id));
    $("#cg").innerHTML = list.map(toolCardHTML).join("");
    bindToolCards($("#cg"));
  }

  // ========== Individual Tool Page ==========
  function renderToolPage(r){
    const id = r.query.id;
    const tool = D.tools.find(t=>t.id===id) || D.tools[0];
    const tpl = $("#tpl-tool").content.cloneNode(true);
    app.appendChild(tpl);

    $("#toolTitle").textContent = tool.title;
    $("#toolDesc").textContent = tool.bangla || "";
    $("#toolIcon").innerHTML = tool.icon;
    $("#inputLabel").textContent = inputLabelFor(tool);

    // Special-case: tools that have calculator inputs
    if(tool.id==="earn-calc"){ setupEarningsCalc(); }
    if(tool.id==="notes"){ setupNotes(); }
    if(tool.id==="length-est"){ setupLengthEstimator(); }
    if(tool.id==="dashboard"){ setupDashboard(); }

    const input = $("#toolInput");
    const output = $("#toolOutput");
    const toneSel = $("#toolTone");
    const langSel = $("#toolLang");
    const genBtn = $("#generateBtn");
    const copyBtn = $("#copyBtn");
    const clearBtn = $(".tb-btn[data-act='clear']");
    const errBox = $("#errBox");

    // Load last input if any
    const cached = lastForTool(tool.id);
    if(cached){ input.value = cached.input||""; if(cached.output){ setOutput(cached.output); } }

    genBtn.addEventListener("click", ()=>{
      const val = input.value.trim();
      if(tool.id!=="notes" && tool.id!=="dashboard" && !val){
        showError("Please enter a topic, keyword or idea to generate content.");
        return;
      }
      hideError();
      setOutput(loadingHTML(), true);
      setBtnLoading(genBtn, true);

      // Simulate async generation (350-700ms) for realistic UX
      const t0 = 350 + Math.random()*350;
      setTimeout(()=>{
        try{
          const content = generateFor(tool, val, toneSel.value, langSel.value);
          setOutput(content);
          addHistory(tool, val, content);
          setBtnLoading(genBtn, false);
        }catch(e){
          setBtnLoading(genBtn, false);
          showError("Something went wrong while generating. Please try again.");
        }
      }, t0);
    });

    copyBtn.addEventListener("click", ()=>{
      copyText(output.innerText.trim());
    });
    clearBtn.addEventListener("click", ()=>{
      input.value = "";
      setOutput(`<div class="empty-state">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>
        <p>Your generated result will appear here.</p></div>`);
      output.classList.remove("has-content");
      toast("Cleared");
    });

    // Toolbar actions
    $(".tb-btn[data-act='fav']").addEventListener("click", e=>{
      e.currentTarget.classList.toggle("active");
      toggleFav(tool.id);
    });
    if(D.favorites.includes(tool.id)) $(".tb-btn[data-act='fav']").classList.add("active");

    $(".tb-btn[data-act='save']").addEventListener("click", ()=>{
      const outText = output.innerText.trim();
      if(!outText || outText.startsWith("Your generated result")){
        toast("Generate something first to save","error"); return;
      }
      D.saved.unshift({ id:uid(), toolId:tool.id, title:tool.title, input:input.value, output:outText, ts:Date.now() });
      D.persist();
      toast("Saved to your collection");
      $(".tb-btn[data-act='save']").classList.add("active");
      setTimeout(()=>$(".tb-btn[data-act='save']").classList.remove("active"), 800);
    });

    $(".tb-btn[data-act='history']").addEventListener("click", ()=>{
      openHistoryModal(tool);
    });

    $(".tb-btn[data-act='share']").addEventListener("click", ()=>{
      shareThing({ title:tool.title, text:tool.bangla, url:location.href });
    });

    function setOutput(html, isRaw){
      output.innerHTML = html;
      output.classList.toggle("has-content", !!(isRaw ? output.innerText.trim() : true));
    }
    function showError(msg){ errBox.textContent = msg; errBox.hidden = false; }
    function hideError(){ errBox.hidden = true; errBox.textContent=""; }
  }

  function setBtnLoading(btn, on){
    const label = $(".btn-label", btn);
    const sp = $(".spinner", btn);
    if(!label || !sp) return;
    if(on){ btn.disabled = true; label.textContent = "Generating..."; sp.hidden = false; }
    else{ btn.disabled = false; label.textContent = "Generate"; sp.hidden = true; }
  }

  function inputLabelFor(tool){
    switch(tool.id){
      case "bn2en": return "Paste Bangla text";
      case "en2bn": return "Paste English text";
      case "earn-calc": return "Enter values below";
      case "notes": return "Your notes";
      case "dashboard": return "Dashboard overview";
      case "seo-score": return "Paste your title, description and tags";
      case "stt": return "Paste audio transcript draft or audio notes";
      case "subtitle": return "Paste your transcript / script";
      case "length-est": return "Paste your script to estimate length";
      default: return "Enter your topic / idea / keyword";
    }
  }

  function lastForTool(toolId){
    return D.history.find(h=>h.toolId===toolId) || null;
  }
  function addHistory(tool, input, outputHTML){
    const outText = (typeof outputHTML==="string") ? outputHTML.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim() : "";
    D.history.unshift({ id:uid(), toolId:tool.id, title:tool.title, input:(input||"").slice(0,300), output:outText.slice(0,2000), ts:Date.now() });
    if(D.history.length>200) D.history.length = 200;
    D.persist();
  }

  // ========== Generation engine ==========
  // Generates structured, good-looking outputs for each tool.
  function generateFor(tool, topic, tone, lang){
    topic = (topic||"your video").trim() || "your video";
    const isBn = lang==="bn";
    const isMix = lang==="mix";
    const t = (en,bn)=> isBn?bn : (isMix? en+" — "+bn : en);

    switch(tool.id){
      case "ai-title": return genTitles(topic, tone, isBn);
      case "ai-desc":  return genDescription(topic, tone, isBn);
      case "ai-tags":  return genTags(topic, isBn);
      case "ai-hashtag": return genHashtags(topic, isBn);
      case "thumb-prompt": return genThumbPrompts(topic, isBn);
      case "thumb-text": return genThumbText(topic, isBn);
      case "thumb-color": return genColors(isBn);
      case "thumb-style": return genThumbStyles(topic, isBn);
      case "thumb-idea": return genThumbIdeas(topic, isBn);
      case "hook": return genHooks(topic, tone, isBn);
      case "outro":
      case "video-outro-gen": return genOutro(topic, isBn);
      case "cta": return genCTAs(topic, isBn);
      case "shorts-script": return genShortsScript(topic, tone, isBn);
      case "long-script": return genLongScript(topic, tone, isBn);
      case "story": return genStory(topic, "story", isBn);
      case "horror-story": return genStory(topic, "horror", isBn);
      case "islamic-story": return genStory(topic, "islamic", isBn);
      case "funny-story": return genStory(topic, "funny", isBn);
      case "motivation-story": return genStory(topic, "motivation", isBn);
      case "video-idea": return genVideoIdeas(topic, isBn);
      case "trending-topic": return genTrending(topic, isBn);
      case "keyword-research": return genKeywords(topic, isBn);
      case "seo-analyzer": return genSeoAnalyzer(topic, isBn);
      case "seo-score": return genSeoScore(topic, isBn);
      case "yt-checklist": return genChecklist(isBn);
      case "upload-planner": return genUploadPlanner(topic, isBn);
      case "content-cal": return genContentCal(topic, isBn);
      case "playlist-plan": return genPlaylistPlan(topic, isBn);
      case "chapters": return genChapters(topic, isBn);
      case "summary": return genSummary(topic, isBn);
      case "community-post": return genCommunityPosts(topic, isBn);
      case "pinned-comment": return genPinned(topic, isBn);
      case "channel-bio": return genBios(topic, isBn);
      case "about": return genAbout(topic, isBn);
      case "intro": return genIntros(topic, isBn);
      case "copyright-tips": return genCopyrightTips(isBn);
      case "ai-prompt-gen": return genAIPrompts(topic, isBn);
      case "image-prompt": return genImagePrompts(topic, isBn);
      case "img2vid-prompt": return genImg2VidPrompts(topic, isBn);
      case "voice-script": return genVoiceScript(topic, tone, isBn);
      case "subtitle": return genSubtitles(topic, isBn);
      case "stt": return genSTTTemplate(topic, isBn);
      case "tts": return genTTSTemplate(topic, isBn);
      case "bn2en": return `English Translation\n\n${pseudoTranslate(topic,"bn2en")}\n\n(Tip: For longer or accurate translation, paste larger paragraphs.)`;
      case "en2bn": return `বাংলা অনুবাদ\n\n${pseudoTranslate(topic,"en2bn")}\n\n(দ্রষ্টব্য: ভালো মানের অনুবাদের জন্য বড় প্যারাগ্রাফ পেস্ট করুন।)`;
      case "earn-calc": return earningsCalcOutput();
      case "length-est": return lengthEstOutput(topic);
      case "notes": return topic; // notes free-form
      case "dashboard": return dashboardOutput();
      default: return `Generated content for: ${topic}.\n\n(This is a ready-to-edit draft. Customize before publishing.)`;
    }
  }

  // ===== Generator helpers (smart, realistic template + topic insertion) =====
  function wrap(title, items){
    return `<div><span class="section-title">${esc(title)}</span>\n<ul>${items.map(i=>`<li>${i}</li>`).join("")}</ul></div>`;
  }
  function headlines(arr){ return arr.map(h=>`<div><span class="section-title">${esc(h.t)}</span><p>${h.p}</p></div>`).join(""); }

  // Titles
  function genTitles(topic, tone, bn){
    const adj = {
      professional:["Proven","Ultimate","Complete","Essential","Powerful"],
      casual:["You Won't Believe","I Tried","Wait Till You See","Let's Talk About"],
      exciting:["Insane","Crazy","Shocking","Mind-Blowing","Unbelievable"],
      educational:["Step-by-Step","Beginner's Guide","How to","Everything You Need to Know"],
      funny:["Hilarious","The Truth About","Why Nobody Talks About"],
      motivational:["Stop Wasting Time","This Will Change How You","Never Give Up on"]
    }[tone] || ["Best","Ultimate","Top","Complete"];
    const patterns = [
      `${pick(adj)} ${topic} — ${bn?"আপনার যা জানা দরকার":"Here's What You Need to Know"}`,
      `How to Master ${topic} in 2026 (${bn?"সহজ গাইড":"Simple Guide"})`,
      `${pick(adj)} ${topic} Tips That Actually Work`,
      `I Spent 30 Days Testing ${topic} ${bn?"— ফলাফল":"— Results Shocked Me"}`,
      `${bn?"৫টি ভুল":"5 Mistakes"} Almost Everyone Makes with ${topic}`,
      `Why ${topic} is Changing Everything Right Now`,
      `${bn?"শুরুতেই যে ভুলগুলো":"The Biggest Beginner Mistakes"} in ${topic}`,
      `${bn?"সেরা ৭ টিপস":"Top 7 Tips"} for ${topic} in 2026`,
      `${topic} ${bn?": শুরু থেকে শেষ পর্যন্ত":": Zero to Pro"} (${bn?"সম্পূর্ণ টিউটোরিয়াল":"Full Tutorial"})`,
      `${bn?"সত্যটা জানুন":"The Truth About"} ${topic} (${bn?"কেউ বলে না":"No One Tells You This"})`
    ];
    return wrap(bn?"১০টি ক্লিকযোগ্য টাইটেল":"10 Clickable Titles", patterns) +
           wrap(bn?"সেরা ৩টি সুপারিশ":"Top 3 Picks", patterns.slice(0,3));
  }
  function genDescription(topic, tone, bn){
    return [
      `<span class="section-title">${esc(bn?"ভিডিও বিবরণ (Description)":"Video Description")}</span>`,
      `<p>${bn?`আজকের ভিডিওতে আমরা <b>${esc(topic)}</b> সম্পর্কে বিস্তারিত আলোচনা করেছি। আপনি যদি এই টপিকে নতুন হয়ে থাকেন বা প্রফেশনালি কাজ করতে চান—এই ভিডিও আপনার জন্য।`:`In this video we dive deep into <b>${esc(topic)}</b>. Whether you're a beginner or already working in this niche, you'll walk away with actionable steps you can use today.`}</p>`,
      wrap(bn?"আপনি যা শিখবেন":"What You'll Learn", [
        bn?"মূল কনসেপ্ট পরিষ্কার ব্যাখ্যা":"Clear explanation of the core concepts",
        bn?"বাস্তব উদাহরণ ও কেস স্টাডি":"Real examples and case studies",
        bn?"সাধারণ ভুল ও সেগুলো এড়ানোর উপায়":"Common mistakes and how to avoid them",
        bn?"প্রো টিপস যা এগিয়ে রাখবে":"Pro tips that give you an edge"
      ]),
      `<span class="section-title">${esc(bn?"টাইমস্ট্যাম্প (নমুনা)":"Timestamps (sample)")}</span>`,
      `<p>0:00 ${bn?"ইন্ট্রো ও আজকের টপিক":"Intro & today's topic"}<br>
           1:15 ${bn?"মূল বিষয় শুরু":"The basics"}<br>
           4:30 ${bn?"অ্যাডভান্সড অংশ":"Advanced section"}<br>
           8:00 ${bn?"কমন মিস্টেক":"Common mistakes"}<br>
           10:45 ${bn?"ফাইনাল টিপস ও আউটরো":"Final tips & outro"}</p>`,
      wrap(bn?"আমাদের সাথে থাকুন":"Connect & Subscribe", [
        bn?"লাইক করুন, কমেন্ট করুন, শেয়ার করুন":"Like, comment and share if this helps",
        bn?"সাবস্ক্রাইব করুন এবং বেল বাটনে ক্লিক রাখুন":"Subscribe and ring the bell for new videos",
        bn?"নিচে আপনার মতামত জানান":"Drop your questions below"
      ]),
      `<p class="muted small">${bn?"কী-ওয়ার্ড": "Keywords"}: ${esc(topic)}, ${bn?"সেরা টিপস":"best tips"}, ${bn?"টিউটোরিয়াল":"tutorial"}, ${bn?"গাইড ২০২৬":"2026 guide"}</p>`
    ].join("");
  }
  function genTags(topic, bn){
    const words = (topic+"").toLowerCase().split(/\s+/).filter(Boolean);
    const base = words.slice(0,4);
    const tags = new Set([
      topic,
      ...base.map(w=>topic+" "+w),
      ...["tutorial","tips","how to","guide","2026","for beginners","bangla","best",
         bn?"টিউটোরিয়াল":"pro tips",
         bn?"বাংলা":"ultimate guide"
        ].map(x=>topic+" "+x),
      bn ? topic+" কিভাবে শিখবেন" : topic+" explained",
      bn ? topic+" বাংলা" : topic+" bangla"
    ]);
    const arr = Array.from(tags).slice(0,25);
    return wrap(bn?"ট্যাগ (কপি করুন)":"Tags (copy-ready)", arr.map(t=>esc(t))) +
           `<p class="muted small">${bn?"সংখ্যা":"Count"}: ${arr.length} ${bn?"টি ট্যাগ। প্রাসঙ্গিকতা অনুযায়ী ক্রমানুসারে সাজানো।":"tags, ordered by relevance."}</p>`;
  }
  function genHashtags(topic, bn){
    const base = topic.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g,"");
    const baseBn = topic.replace(/\s+/g,"");
    const generic = ["#shorts","#viral","#youtubeshorts","#trending","#fyp","#youtube",bn?"#bangla":"#creator"];
    const niche = Array.from(new Set([
      "#"+base,
      "#"+base+"tips",
      "#"+base+"tutorial",
      "#"+base+"2026",
      "#"+baseBn,
      bn?"#"+baseBn+"টিপস":"#learn"+base,
    ]));
    return wrap(bn?"ব্রড হ্যাশট্যাগ":"Broad Hashtags", generic) +
           wrap(bn?"নিচ হ্যাশট্যাগ":"Niche Hashtags", niche) +
           `<p class="muted small">${bn?"সর্বোচ্চ ৮–১৫টি হ্যাশট্যাগ ব্যবহার করুন।":"Use 8-15 hashtags total for best results."}</p>`;
  }
  function genThumbPrompts(topic, bn){
    const styles = ["cinematic close-up","high-contrast reaction face","split-screen before/after","minimalist bold graphic","hyper-stylized 3D render"];
    const prompts = styles.map((s,i)=>{
      return `<b>#${i+1} — ${esc(s)}</b><br>
        <i>Subject:</i> ${esc(topic)} creator face with ${i%2?"shocked":"determined"} expression, ${i<2?"shallow depth of field":"clean background"}.<br>
        <i>Lighting:</i> ${i%2?"hard rim light + warm key":"soft studio light with yellow accent"}.<br>
        <i>Composition:</i> subject left, big bold text right, negative space top-right.<br>
        <i>Style:</i> ${s}, 8K, YouTube thumbnail, ultra HD, eye-level.<br>
        <i>Colors:</i> black background, yellow (#ffd60a) text, white highlight.<br>
        <i>Negative:</i> blurry, low contrast, watermark, extra fingers, distorted face.<br><br>`;
    }).join("");
    return `<span class="section-title">${esc(bn?"৫টি AI থাম্বনেইল প্রম্পট":"5 AI Thumbnail Prompts")}</span><p>${prompts}</p>`;
  }
  function genThumbText(topic, bn){
    const arr = [
      "YOU WON'T BELIEVE",
      "I TRIED IT",
      "STOP DOING THIS",
      "THE TRUTH",
      "5 SECONDS",
      "BANNED?!",
      "DO THIS NOW",
      "SECRET REVEALED",
      "PROVEN",
      "BEST METHOD"
    ];
    const bnArr = [
      "বিশ্বাস করবেন না",
      "আমি করলাম",
      "এটা করবেন না",
      "সত্যটা কী",
      "৫ সেকেন্ডে",
      "ব্যান?!",
      "এখনই করুন",
      "রহস্য ফাঁস",
      "প্রমাণিত",
      "সেরা উপায়"
    ];
    const list = bn?bnArr:arr;
    return wrap(bn?"১০টি পাঞ্চি থাম্ব টেক্সট":"10 Punchy Thumbnail Texts", list.map(x=>esc(x)))+
           `<p class="muted small">${bn?"টিপস: ২–৩টি শব্দ, বড় বোল্ড ফন্ট, হাই কনট্রাস্ট ব্যবহার করুন।":"Tips: 2-3 words, bold font, high contrast, leave space for the face."}</p>`;
  }
  function genColors(bn){
    const palettes = [
      { name:"High-Contrast Yellow", colors:["#0f0f10","#ffffff","#ffd60a"], why:bn?"ক্লাসিক ব্ল্যাক অ্যান্ড হোয়াইটের সাথে ইয়েলো — যেকোনো ফিডে চোখে পড়ে":"Classic black/white with yellow accent — maximum contrast in feeds." },
      { name:"Bold Danger",          colors:["#111111","#ffffff","#ff3b30","#ffd60a"], why:bn?"লাল রং জরুরি/ঝুঁকির অনুভূতি দেয়, ভয়-কিউরিওসিটি টাইটেলের জন্য পারফেক্ট":"Red creates urgency — perfect for fear-curiosity thumbnails." },
      { name:"Neon Pop",             colors:["#0a0a0a","#f7f7f7","#00e5ff","#ffd60a"], why:bn?"টেক/ফিউচারিস্টিক নিচে সাই-ফাই ফিল":"Neon cyan on black for tech/futuristic niches." },
      { name:"Warm Gold",            colors:["#1a1410","#fff8e7","#f5c400","#ffffff"], why:bn?"প্রিমিয়াম ও লাক্সারি ভাব দেয়":"Premium luxury feel for finance/business content." },
      { name:"Clean Minimal",        colors:["#ffffff","#0f0f10","#ffd60a","#e7e7ea"], why:bn?"পরিষ্কার, এডুকেশন/টিউটোরিয়ালের জন্য":"Clean, educational look — easy to read." }
    ];
    return palettes.map((p,i)=>`<div style="margin-bottom:14px"><b>${i+1}. ${esc(p.name)}</b>
      <div style="display:flex;gap:6px;margin:6px 0">${p.colors.map(c=>`<div style="width:36px;height:36px;border-radius:8px;border:1px solid var(--line);background:${c}"></div>`).join("")}</div>
      <p class="muted small">${p.why}</p></div>`).join("");
  }
  function genThumbStyles(topic, bn){
    const arr = [
      {n:"Face + Arrow", d:bn?"বড় চেহেরা + বড় তীর, টেক্সট সাথে — রিঅ্যাকশন/হাউ-টু-এর জন্য সেরা।":"Big reaction face with bold red/yellow arrow pointing to text — best for reactions and how-tos."},
      {n:"Before / After", d:bn?"স্প্লিট স্ক্রিন—আগে vs পরে, কিউরিওসিটি জাগায়।":"Split screen showing before and after — instant visual proof."},
      {n:"Big Object", d:bn?"একটি প্রডাক্ট/অবজেক্ট বড় করে ক্লোজ-আপ, প্রোডাক্ট রিভিউতে কাজে লাগে।":"Extreme close-up of an object/product — great for reviews."},
      {n:"Minimal Text Only", d:bn?"শুধু বড় টেক্সট ও ব্র্যান্ড কালার — মিনিমাল ভিডিওর জন্য।":"Huge bold text on solid color with small logo — for minimal niches."},
      {n:"Collage / Stack", d:bn?"একাধিক ছবি কোলাজ — লিস্ট-টাইপ ভিডিওর জন্য।":"Stacked images or collage — perfect for listicles."}
    ];
    return arr.map((s,i)=>`<p><b>${i+1}. ${esc(s.n)}</b> — ${s.d}</p>`).join("");
  }
  function genThumbIdeas(topic, bn){
    const arr = [
      bn?"আপনার চোখ বড় করে অবাক চেহেরা + “এটা কী?!” টেক্সট":"Shocked face close-up with text 'WHAT?!' in yellow",
      bn?"প্রডাক্ট হাতে ধরে “আগে vs পরে” স্প্লিট স্ক্রিন":"Holding product with before/after split screen",
      bn?"কালো ব্যাকগ্রাউন্ডে একা আপনি + ভাসমান বড় নম্বর":"Solo creator on black background with giant floating number",
      bn?"“ভুল করবেন না” লেখা স্টপ সাইন হাতে ধরে":"Holding a red STOP sign with 'DON'T DO THIS'",
      bn?"দুটি অপশন (A vs B) — দর্শক বাছাই করবে কোনটা সেরা":"Two-option comparison (A vs B) — invites clicks",
      bn?"বড় সবুজ চেক বা লাল ক্রস দিয়ে রেটিং দেওয়া":"Giant checkmark/cross rating visual",
      bn?"বিস্ময়কর সংখ্যা “১০x” বড় ফন্টে":"'10X' or '100X' in massive 3D text",
      bn?"টিয়ার-অফ ক্যালেন্ডার বা “৭ দিনে” ভিজ্যুয়াল":"Tear-off calendar visualizing 'in 7 days'"
    ];
    return wrap(bn?"৮টি ভাইরাল থাম্বনেইল আইডিয়া":"8 Viral Thumbnail Ideas", arr);
  }
  function genHooks(topic, tone, bn){
    const hs = bn
      ? [
        `আজকে আমি আপনাকে ${topic} সম্পর্কে এমন একটা সত্য বলবো যা কেউ বলে না।`,
        `আপনি যদি ${topic} শুরু করার কথা ভাবছেন—এটা না জানলে পস্তাবেন।`,
        `মাত্র ৩ দিনে ${topic} এ রেজাল্ট পেলাম যেভাবে।`,
        `এই একটা ভুলে আমার ${topic} জার্নি ১ বছর পিছিয়ে গেল।`,
        `থামুন! ${topic} নিয়ে আর কোনো ভিডিও দেখার আগে এটা একবার দেখুন।`,
        `${topic} নিয়ে যা বলা হয় তার অর্ধেকই মিথ্যা।`,
        `আজ আমি আমার সেই রহস্য ফাঁস করছি যা দিয়ে আমি ${topic} তে সফল হয়েছি।`,
        `প্রথম ৩০ সেকেন্ডেই আপনি ${topic} এর প্রতি ভুল পথে যাচ্ছেন কিনা বুঝবেন।`,
        `কালকেই আমি ${topic} এ এমন কিছু আবিষ্কার করলাম যা সবকিছু বদলে দেবে।`,
        `সবাই ${topic} বলে—কিন্তু কেউ এই টেকনিকটা বলে না।`,
        `আমার চ্যানেলে ${topic} এর ভিডিও ভাইরাল হয়েছে শুধু এই ১টি কারণে।`,
        `আপনার ফোন/ল্যাপটপ বন্ধ করার আগে ${topic} এর এই সত্যটা জেনে নিন।`
      ]
      : [
        `Stop everything — I'm about to show you the real truth about ${topic}.`,
        `If you're doing ${topic} without this, you're wasting years of your life.`,
        `I tried ${topic} for 30 days — here's what actually happened.`,
        `This single mistake destroyed my first ${topic} journey.`,
        `Wait — before you watch another ${topic} video, see this.`,
        `90% of what you've heard about ${topic} is wrong.`,
        `Today I'm revealing the exact system I used to master ${topic}.`,
        `The first 30 seconds of your ${topic} video will decide everything.`,
        `Last night I discovered a ${topic} trick that changes everything.`,
        `Everyone teaches ${topic} — but nobody shares this one technique.`,
        `My ${topic} video went viral for one reason only.`,
        `Close the tab — but first listen to this truth about ${topic}.`
      ];
    return wrap(bn?"১২টি শক্তিশালী হুক":"12 Powerful Opening Hooks", hs.map(h=>esc(h)));
  }
  function genOutro(topic, bn){
    const arr = bn ? [
      `আজকের ভিডিওটি ভালো লেগেছে একটা লাইক দিয়ে দিন, কমেন্টে আপনার মতামত জানান। ${topic} নিয়ে আরও ভিডিও পেতে চ্যানেলটি সাবস্ক্রাইব করুন এবং বেল আইকনে ক্লিক করুন — পরের ভিডিওতে আমরা আরও প্রাকটিক্যাল টিপস নিয়ে আসবো।`,
      `এই টিপসগুলো একবার ট্রাই করুন, রেজাল্ট আপনার চোখের সামনে হবে। নেক্সট ভিডিওতে আমি ${topic} এর অ্যাডভান্সড ভার্শন নিয়ে আসছি — তাই সাবস্ক্রাইব করে রাখুন।`,
      `আজকের মতো এখানেই শেষ করছি। যে টপিকটা পরবর্তীতে দেখতে চান কমেন্টে লিখুন, লাইক-শেয়ার করুন, আর আমাদের সাথেই থাকুন!`
    ] : [
      `If this video helped you, smash the like button, drop a comment with your biggest takeaway about ${topic}, and subscribe with the bell so you don't miss the next one where I go even deeper.`,
      `Try these tips once — I promise you will see a difference. In the next video I'm breaking down the advanced version of ${topic}, so hit subscribe and the notification bell.`,
      `That's it for today. Tell me which topic I should cover next, like and share this video, and I'll see you in the next one.`
    ];
    return wrap(bn?"৩টি প্রফেশনাল আউটরো":"3 Professional Outros (15-30 sec)", arr.map(a=>esc(a)));
  }
  function genCTAs(topic, bn){
    return wrap(bn?"লাইক CTAs":"Like CTAs", [
      bn?"একটা বিশাল লাইক মেরে দিন যদি এটা উপকারে লেগেছে!":"Smash that like button if you found this useful!",
      bn?"লাইক মারতে ভুলবেন না — এতে ভিডিওটি আরও মানুষের কাছে পৌঁছায়।":"Drop a like so more creators can find this.",
    ].map(esc))+wrap(bn?"কমেন্ট CTAs":"Comment CTAs", [
      bn?"নিচে কমেন্টে আপনার প্রশ্ন বা মতামত জানান।":"Let me know your biggest question about "+topic+" in the comments.",
      bn?"কোন টিপসটি সবচেয়ে কাজে লেগেছে? কমেন্ট করুন।":"Which tip resonated most with you? Tell me below.",
    ].map(esc))+wrap(bn?"সাবস্ক্রাইব CTAs":"Subscribe CTAs", [
      bn?"সাবস্ক্রাইব করুন এবং বেল বাটনে ক্লিক — নতুন ভিডিও প্রথমে পাবেন।":"Subscribe and ring the bell to get new videos first.",
      bn?"চ্যানেলে জয়েন করুন আরও এমন কন্টেন্টের জন্য।":"Join the channel for more content like this.",
    ].map(esc))+wrap(bn?"শেয়ার CTAs":"Share CTAs", [
      bn?"যে বন্ধুটির ${topic} দরকার তাকে ভিডিওটি শেয়ার করুন।":"Share this video with someone who needs help with "+topic+"."
    ].map(esc));
  }
  function genShortsScript(topic, tone, bn){
    return [
      `<span class="section-title">${esc(bn?"শর্টস স্ক্রিপ্ট (৩০–৪৫ সেকেন্ড)":"Shorts Script (30-45 seconds)")}</span>`,
      `<p><b>0–3s ${bn?"(হুক)":"(Hook)"}:</b> ${esc(bn?`আপনি ${topic} করছেন? তাহলে এই একটা ভুল করছেন!`:`Doing ${topic}? You are making this ONE mistake!`)}</p>`,
      `<p><b>3–8s ${bn?"(সমস্যা)":"(Setup)"}:</b> ${esc(bn?`আমিও প্রথমে এই ভুল করেছিলাম — রেজাল্ট জিরো।`:`I did this too — my results were zero.`)}</p>`,
      `<p><b>8–30s ${bn?"(মূল কন্টেন্ট)":"(Main)"}:</b><br>
      1. ${esc(bn?`প্রথমে বিষয়টি বুঝুন: ${topic} এর মূল বিষয় হলো...`:`First understand: the core of ${topic} is...`)}<br>
      2. ${esc(bn?`এই ১টি টেকনিক ট্রাই করুন — একদম সহজ।`:`Try this one simple technique.`)}<br>
      3. ${esc(bn?`রেজাল্ট পেতে ৩–৭ দিন সময় দিন।`:`Wait 3-7 days to see results.`)}</p>`,
      `<p><b>30–40s ${bn?"(পে-অফ)":"(Payoff)"}:</b> ${esc(bn?`মাত্র এইটা করলেই ${topic} এ ২ গুণ রেজাল্ট পাবেন।`:`Just doing this will 2x your ${topic} results.`)}</p>`,
      `<p><b>40–45s ${bn?"(CTA)":"(CTA)"}:</b> ${esc(bn?`ফলো করুন আরও টিপসের জন্য!`:`Follow for more tips like this!`)}</p>`,
      `<span class="section-title">${esc(bn?"স্ক্রিনে টেক্সট":"On-Screen Text Cues")}</span><ul>
        <li>0–3s: ${esc(topic.toUpperCase())}</li>
        <li>8–15s: ${esc(bn?"১ম ধাপ":"STEP 1")}</li>
        <li>15–25s: ${esc(bn?"২য় ধাপ":"STEP 2")}</li>
        <li>30–40s: ${esc(bn?"রেজাল্ট!":"RESULTS!")}</li>
        <li>40–45s: ${esc(bn?"ফলো করুন":"FOLLOW")}</li>
      </ul>`
    ].join("");
  }
  function genLongScript(topic, tone, bn){
    return [
      `<span class="section-title">${esc(bn?"দীর্ঘ ভিডিও স্ক্রিপ্ট (৮–১২ মিনিট)":"Long-form Script (8-12 min)")}</span>`,
      `<p><b>INTRO (0:00–0:45):</b> ${esc(bn?`আজকে আমি ${topic} এর যে পদ্ধতি বছরের পর বছর পরীক্ষা করে বের করেছি, তা আপনাদের সামনে তুলে ধরছি।`:`Today I'm sharing the step-by-step system I've tested for years on ${topic}.`)}</p>`,
      `<p><b>SECTION 1 (0:45–2:30) — ${esc(bn?"ব্যাকগ্রাউন্ড ও মূল বিষয়":"Background")}:</b><br>
      – ${esc(bn?`${topic} কী, কেন গুরুত্বপূর্ণ`:`What ${topic} is and why it matters`)}<br>
      – ${esc(bn?`সাধারণ মাইথ ও ভুল ধারণা`:`Common myths people believe`)}</p>`,
      `<p><b>SECTION 2 (2:30–5:00) — ${esc(bn?"পদ্ধতি ধাপে ধাপে":"The Method")}:</b><br>
      1. ${esc(bn?`প্রথম ধাপ: বেসিক সেটআপ`:`Step 1: Foundation setup`)}<br>
      2. ${esc(bn?`দ্বিতীয় ধাপ: কোর টেকনিক`:`Step 2: Core technique`)}<br>
      3. ${esc(bn?`তৃতীয় ধাপ: কম সময়ে বেশি রেজাল্ট`:`Step 3: Efficiency tweak`)}<br>
      4. ${esc(bn?`চতুর্থ ধাপ: প্রফেশনাল টিপস`:`Step 4: Pro polish`)}</p>`,
      `<p><b>SECTION 3 (5:00–7:30) — ${esc(bn?"বাস্তব উদাহরণ ও কেস স্টাডি":"Case Study")}:</b> ${esc(bn?`আমি নিজে যেভাবে ${topic} প্রয়োগ করেছি — স্ক্রিন-রেকর্ড/ডেমো দেখাই।`:`Walkthrough of how I applied this in real life on ${topic} with on-screen demo.`)}</p>`,
      `<p><b>SECTION 4 (7:30–9:30) — ${esc(bn?"সাধারণ ভুল ও সমাধান":"Common Mistakes")}:</b><br>
      – ${esc(bn?`এই ভুলগুলো করবেন না`:`Mistake #1: skipping the foundation`)}<br>
      – ${esc(bn?`আটকে গেলে করণীয়`:`What to do when you feel stuck`)}</p>`,
      `<p><b>OUTRO (9:30–10:30):</b> ${esc(bn?`লাইক, কমেন্ট, সাবস্ক্রাইব — পরের ভিডিওতে ${topic} এর অ্যাডভান্সড পার্ট নিয়ে আসছি।`:`Like, comment, subscribe — next video is the advanced ${topic} edition.`)}</p>`
    ].join("");
  }
  function genStory(topic, type, bn){
    const variants = {
      story: bn?["এক গ্রামে এক ছেলে","গ্রামের সবাই বলতো পারবি না","সে রাতদিন পরিশ্রম করলো","একদিন সে সফল হলো","মূল বার্তা: লেগে থাকলে সফল হওয়া যায়।"]:["In a small town there lived a boy","Everyone told him he'd never make it","He worked relentlessly every night","One day his breakthrough arrived","Lesson: persistence beats talent."],
      horror: bn?["রাত ২টা — ল্যাপটপের পর্দা একা জ্বলে","একটা অদ্ভুত শব্দ পিছনের রুম থেকে ভেসে এলো","সে তাকালো — কেউ নেই","পর্দায় নিজের ছায়াটা একা নড়ছে","আর কখনোই সে রাত ২টায় একা থাকে না।"]:["It was 2 AM — only the laptop screen was on","A strange whisper came from the back room","He looked — nobody was there","On the screen, his shadow moved by itself","He never stays up alone at 2 AM again."],
      islamic: bn?["এক ব্যক্তি সব সময় অভিযোগ করতো","একদিন এক বুজুর্গ তাকে বললেন — কৃতজ্ঞ হোন","সে সেদিন থেকে প্রতিদিন ৩টি নিয়ামত লিখতো","তার জীবন পুরোপুরি বদলে গেল","শিক্ষা: আল্লাহর প্রতি কৃতজ্ঞতা জীবনকে প্রশস্ত করে।"]:["There was a man who always complained","One day a wise elder told him — be grateful","He began writing three blessings every night","Slowly his entire life changed","Lesson: gratitude opens doors."],
      funny: bn?["আমি জিমে গেলাম প্রথমবার","ট্রেনার বললেন ১ কেজি ডাম্বেল তুলুন","আমি ভাবলাম দেখি কত সহজ","হাতে নিয়ে দেখি ১০ কেজি!","বাকি জীবন আমি সোফাতেই বসে থাকার সিদ্ধান্ত নিলাম।"]:["I walked into the gym for the first time","The trainer said 'try this small dumbbell'","I thought it looked light","I picked it up — it was 20 pounds","From that day on, the couch and I are best friends."],
      motivation: bn?["তার বাবা একটা ছোট চা-স্টল চালাতেন","সে ১০ম শ্রেণিতে ফেল করলো","সবাই বললো তুমি কিছুই করতে পারবে না","সে রাত জেগে পড়ার পর ডাক্তার হলো","বার্তা: অতীত আপনার ভবিষ্যৎ নয়।"]:["His father ran a tiny tea stall","He failed 10th grade","Everyone said he would never succeed","Years of late nights later, he became a doctor","Message: your past does not define you."]
    };
    const lines = variants[type] || variants.story;
    return `<span class="section-title">${esc(bn?"গল্প":"Story")}</span>
      <p><b>${bn?"শুরু":"Once Upon a Time"}:</b> ${esc(lines[0] + (topic?(" — যার বড় স্বপ্ন ছিল "+topic+" নিয়ে।"):"."))}</p>
      <p><b>${bn?"দ্বন্দ্ব":"Conflict"}:</b> ${esc(lines[1])}</p>
      <p><b>${bn?"প্রচেষ্টা":"Journey"}:</b> ${esc(lines[2])}</p>
      <p><b>${bn?"মোড়":"Turning Point"}:</b> ${esc(lines[3])}</p>
      <p><b>${bn?"শিক্ষা":"Moral"}:</b> <i>${esc(lines[4])}</i></p>
      <p class="muted small">${bn?"নিজের অভিজ্ঞতা ও ডিটেইল যোগ করে পার্সোনালাইজ করুন।":"Personalize with your own details, names and setting."}</p>`;
  }
  function genVideoIdeas(topic, bn){
    const ideas = bn?[
      `${topic} কীভাবে শুরু করবেন — সম্পূর্ণ গাইড`,
      `${topic} এর ৫টি ভুল যা সবাই করে`,
      `আমি ৭ দিনে ${topic} করে যা শিখলাম`,
      `${topic} এ ১০ গুণ উন্নতির ৩টি সিক্রেট`,
      `${topic} vs প্রচলিত পদ্ধতি — কোনটা সেরা?`,
      `বাজেটে ${topic} করবেন যেভাবে`,
      `${topic} এর পেছনের বিজ্ঞান`,
      `প্রথমবার ${topic} করলাম — কী ঘটলো?`,
      `${topic} পেশা হিসেবে নিলে কেমন আয় করা যায়?`,
      `${topic} নিয়ে ১০টি প্রশ্নের উত্তর`,
      `মাত্র ১ মিনিটে ${topic} টিপস`,
      `${topic} শুরু করার আগে ৫টি বিষয় জেনে নিন`
    ]:[
      `How to Start ${topic}: Complete Beginner Guide`,
      `5 Mistakes Everyone Makes with ${topic}`,
      `I Tried ${topic} for 7 Days — Here's What Happened`,
      `3 Secrets That 10x Your ${topic} Results`,
      `${topic} vs Traditional Method — Which Wins?`,
      `${topic} on a Budget — Zero-Cost Setup`,
      `The Hidden Science Behind ${topic}`,
      `I Tried ${topic} for the First Time (Raw Reaction)`,
      `Can You Make a Career Out of ${topic}? (Real Numbers)`,
      `Your Top 10 ${topic} Questions — Answered`,
      `${topic} Tips in Under 60 Seconds`,
      `Watch This BEFORE You Start ${topic}`
    ];
    return wrap(bn?"১২টি ভিডিও আইডিয়া":"12 Video Ideas", ideas.map(x=>esc(x)));
  }
  function genTrending(topic, bn){
    const arr = bn?[
      `${topic} নিয়ে ২০২৬-এর সবচেয়ে বড় ট্রেন্ড — AI ইন্টিগ্রেশন`,
      `"${topic}-এর শর্টস ভার্সন" লং-ফর্মের চেয়ে বেশি ভাইরাল হচ্ছে`,
      `${topic} নিয়ে "একদিনে শিখুন" সিরিজ ট্রেন্ডিং`,
      `"আমি কুইট করছি ${topic}" — রিঅ্যাকশন-স্টাইল ভিডিও বেশি ভিউ পাচ্ছে`,
      `${topic} মিথ বাস্টিং (সত্য vs মিথ্যা)`,
      `"৩০ দিনে ${topic}" চ্যালেঞ্জ ফরম্যাট`,
      `${topic}-এর সাথে অটোমেশন টুল যুক্ত করা — নতুন অ্যাঙ্গেল`,
      `"${topic}-তে কত টাকা লাগে?" স্বচ্ছ বাজেট ব্রেকডাউন ভিডিও`,
      `রিয়্যাকশন: ${topic} নিয়ে বিখ্যাত ক্রিয়েটরদের পরামর্শ পরীক্ষা করে দেখা`,
      `${topic}-এর অনটোল্ড স্টোরি — আবেগঘন ডকুমেন্টারি স্টাইল`
    ]:[
      `Biggest ${topic} trend in 2026 — AI integration is changing the game`,
      `"Shorts version of ${topic}" is outperforming long-form`,
      `"Learn ${topic} in a day" series is trending fast`,
      `"Why I quit ${topic}" reaction-style videos are earning massive views`,
      `${topic} myth-busting: truth vs viral lies`,
      `"30 Days of ${topic}" challenge format`,
      `Combining ${topic} with automation tools — a fresh angle`,
      `"How much does ${topic} cost?" transparent budget breakdown videos`,
      `Reacting to famous creators' ${topic} advice (testing it live)`,
      `The untold story of ${topic} — emotional documentary style`
    ];
    return wrap(bn?"১০টি ট্রেন্ডিং অ্যাঙ্গেল":"10 Trending Topic Angles", arr.map(x=>esc(x)));
  }
  function genKeywords(topic, bn){
    const seeds = [topic];
    const words = (topic+"").split(/\s+/);
    const long = [
      `how to ${topic}`,
      `${topic} for beginners`,
      `${topic} tutorial`,
      `${topic} tips`,
      `best ${topic}`,
      `${topic} guide`,
      `${topic} 2026`,
      `${topic} mistakes`,
      `${topic} vs other`,
      `how to start ${topic}`,
      `${topic} step by step`,
      `is ${topic} worth it`,
    ];
    const q = [
      `what is ${topic}`,
      `why is ${topic} important`,
      `how do i start ${topic}`,
      `can i learn ${topic} at home`,
      `how much does ${topic} cost`,
    ];
    const comp = [
      `${topic} free vs paid`,
      `${topic} beginner vs pro`,
      `${topic} 2026 vs 2025`
    ];
    const wrapS = (t,arr)=>wrap(t,arr.map(x=>esc(x)));
    return (bn?
      wrapS("বীজ কী-ওয়ার্ড (উচ্চ ভলিউম)", seeds)+
      wrapS("লং-টেইল (মধ্যম প্রতিযোগিতা)", long)+
      wrapS("প্রশ্ন-ভিত্তিক (ফিচারড স্নিপেট)", q)+
      wrapS("তুলনামূলক (তুলনামূলক ভিডিও)", comp)
      :
      wrapS("Seed Keywords (high volume)", seeds)+
      wrapS("Long-tail (medium competition)", long)+
      wrapS("Question-based (featured snippets)", q)+
      wrapS("Comparison (VS videos)", comp)
    )+`<p class="muted small">${bn?"সাজেশন: কম প্রতিযোগিতার লং-টেইল দিয়ে শুরু করে ধীরে ধীরে বড় কী-ওয়ার্ডে যান।":"Suggestion: start with long-tail, low-competition keywords and build authority."}</p>`;
  }
  function genSeoAnalyzer(topic, bn){
    return [
      `<span class="section-title">${esc(bn?"SEO বিশ্লেষণ (ড্রাফট মেটাডেটার উপর ভিত্তি করে)":"SEO Analysis (based on your input)")}</span>`,
      wrap(bn?"শক্তির দিকসমূহ":"Strengths", [
        bn?"টপিকটি নির্দিষ্ট ও ক্লিয়ার":"Topic is specific and clear",
        bn?"কী-ওয়ার্ড সম্ভাব্য ভালো":"Keyword has decent search potential",
        bn?"স্টোরি/টিউটোরিয়াল অ্যাঙ্গেল কাজে লাগানো যায়":"Story/tutorial angle usable"
      ].map(esc)),
      wrap(bn?"উন্নতির জায়গা":"Weaknesses to Fix", [
        bn?"টাইটেল ৬০ অক্ষরের মধ্যে সংখ্যা/সংবাদ শব্দ যোগ করুন":"Add number/power word to title and keep under 60 chars",
        bn?"প্রথম ২ লাইনে কী-ওয়ার্ড ও হুক রাখুন":"First 2 lines of description must include keyword + hook",
        bn?"ট্যাগ ২০-৩০টি ও রিলেভেন্ট ক্রমানুসারে দিন":"Use 20-30 tags ordered by relevance",
        bn?"চ্যাপ্টার, সাবটাইটেল ও কার্ড যোগ করুন":"Add chapters, subtitles and cards"
      ].map(esc)),
      wrap(bn?"সুপারিশ":"Recommended Metadata", [
        bn?"মূল কী-ওয়ার্ড টাইটেলের শুরুতে":"Primary keyword at the start of title",
        bn?"1-2টি সম্পর্কিত সাব-কী-ওয়ার্ড ট্যাগে":"1-2 secondary keywords in tags",
        bn?"বর্ণনার প্রথম লাইনে কী-ওয়ার্ড + কিউরিওসিটি":"First line of description: keyword + curiosity hook"
      ].map(esc))
    ].join("");
  }
  function genSeoScore(topic, bn){
    // A pseudo-score based on length heuristics.
    const len = (topic||"").length;
    const score = Math.max(55, Math.min(92, 60 + Math.floor(len/5) + (topic.split(/\s+/).length>4?10:0)));
    const items = [
      { ok: score>=85, label: bn?"টাইটেল দৈর্ঘ্য (৫০-৬০ অক্ষর)":"Title length (50-60 chars)" },
      { ok: true,      label: bn?"মূল কী-ওয়ার্ড টাইটেলে আছে":"Primary keyword in title" },
      { ok: score>=75, label: bn?"কী-ওয়ার্ড প্রথম ২ লাইনে আছে":"Keyword in first 2 lines" },
      { ok: score>=80, label: bn?"ট্যাগ সংখ্যা ২০+":"20+ relevant tags" },
      { ok: true,      label: bn?"কাস্টম থাম্বনেইল আছে":"Custom thumbnail present" },
      { ok: score>=70, label: bn?"চ্যাপ্টার যুক্ত আছে":"Chapters added" },
      { ok: score>=70, label: bn?"সাবটাইটেল (CC) যুক্ত আছে":"Captions added" },
      { ok: true,      label: bn?"শক্তিশালী হুক (প্রথম ৩ সেকেন্ড)":"Strong hook in first 3 seconds" },
      { ok: score>=75, label: bn?"এন্ড স্ক্রিন ও কার্ড আছে":"End screen & cards set" },
      { ok: score>=70, label: bn?"প্লে-লিস্টে যুক্ত করা হয়েছে":"Added to playlist" }
    ];
    return `<div style="padding:10px 0 14px"><b>${bn?"আনুমানিক SEO স্কোর":"Estimated SEO Score"}:</b>
      <span style="font-size:28px;font-weight:800;background:var(--yellow);color:#111;padding:4px 12px;border-radius:10px;margin-left:8px">${score}/100</span></div>
      <ul>${items.map(i=>`<li>${i.ok?"<span style='color:var(--ok)'>&#10003;</span>":"<span style='color:var(--danger)'>&#10007;</span>"} ${esc(i.label)}</li>`).join("")}</ul>
      <p class="muted small">${bn?"এই স্কোরটি শুধুমাত্র আপনার দেওয়া তথ্যের উপর ভিত্তি করে। প্রতিটি ফাঁকা বক্স পূরণ করলে স্কোর বাড়বে।":"This is an estimate based on your input. Fill in each missing item to raise the score."}</p>`;
  }
  function genChecklist(bn){
    const before = bn?["স্ক্রিপ্ট ফাইনাল করা হয়েছে","কাস্টম থাম্বনেইল তৈরি","B-roll ও ফুটেজ সংগ্রহ","অডিও কোয়ালিটি চেক","কপিরাইট ফ্রি মিউজিক ব্যবহার","ইন্ট্রো-আউটরো যুক্ত"]:["Script finalized","Custom thumbnail ready","B-roll/footage gathered","Audio quality checked","Royalty-free music cleared","Intro/outro added"];
    const during = bn?["টাইটেল ৬০ অক্ষরের মধ্যে","বিবরণ প্রথম ২ লাইনে হুক","২০-৩০ ট্যাগ","প্লে-লিস্ট নির্বাচন","ভাষা/ক্যাপশন সেট","ভিডিও ক্যাটাগরি নির্ধারণ"]:["Title under 60 chars","Hook in first 2 lines of description","20-30 tags","Playlist selected","Language/captions set","Category selected"];
    const after = bn?["এন্ড স্ক্রিন সেট (২০ সেকেন্ড)","কার্ড যুক্ত","সাবটাইটেল চেক","সম্প্রদায় পোস্ট প্রচার","শর্টস ক্লিপ তৈরি","কমেন্টে পিন করা"]:["End screen (last 20s)","Cards added","Captions reviewed","Community post teaser","Shorts clip cut","Pinned comment ready"];
    return wrap(bn?"আপলোড-পূর্ব চেকলিস্ট":"Pre-Upload Checklist",before.map(esc))+
           wrap(bn?"আপলোডের সময়":"During Upload",during.map(esc))+
           wrap(bn?"পাবলিশের পর":"Post-Publish",after.map(esc));
  }
  function genUploadPlanner(topic, bn){
    const titles = genTitles(topic,"professional",false).replace(/<[^>]+>/g," ");
    return `<span class="section-title">${esc(bn?"আপলোড প্ল্যান":"Upload Plan")}</span>
    <p><b>${bn?"ভিডিও বিষয়":"Topic"}:</b> ${esc(topic)}</p>
    <p><b>${bn?"টাইটেল অপশন":"Title Options"}:</b></p><p class="muted small">${esc(titles.slice(0,400))}...</p>
    <p><b>${bn?"প্রকাশের সময়":"Publish Time"}:</b> ${bn?"সপ্তাহের সকাল ৮টা / বিকাল ৫টা (দর্শকের সময়)":"8 AM / 5 PM in your audience's timezone (Mon-Wed-Fri best)"}</p>
    <p><b>${bn?"প্লে-লিস্ট":"Playlist"}:</b> ${bn?"“"+topic+" — সম্পূর্ণ সিরিজ”":"“"+topic+" — Complete Series”"}</p>
    <p><b>${bn?"এন্ড স্ক্রিন":"End Screen"}:</b> ${bn?"একটি সাবস্ক্রাইব CTA + ২টি পুরোনো ভিডিও + একটি প্লে-লিস্ট":"Subscribe CTA + 2 recent videos + 1 playlist"}</p>
    <p><b>${bn?"কার্ড":"Cards"}:</b> ${bn?"সম্পর্কিত ভিডিও ও প্লে-লিস্ট লিঙ্ক":"Related video + playlist link"}</p>
    <p><b>${bn?"প্রচার পরিকল্পনা":"Promo Plan"}:</b> ${bn?"কমিউনিটি পোস্ট → শর্টস টিজার → সোশ্যাল শেয়ার":"Community post → Shorts teaser → Social share"}</p>`;
  }
  function genContentCal(topic, bn){
    const weeks = ["Week 1","Week 2","Week 3","Week 4"];
    const plans = weeks.map(w=>{
      return `<p><b>${w}:</b> ${esc(bn?
        `${w}: সোম–${topic} পর্ব ১; বুধ–${topic} টিপস শর্টস; শুক্র–${topic} Q&A`
      :
        `Mon — ${topic} Part 1; Wed — ${topic} Quick Tip Shorts; Fri — ${topic} Q&A`
      )}</p>`;
    }).join("");
    return `<span class="section-title">${esc(bn?"৪-সপ্তাহের কন্টেন্ট ক্যালেন্ডার":"4-Week Content Calendar")}</span>${plans}
      <p class="muted small">${bn?"সাজেশন: ধারাবাহিকতা > পরফেকশন। প্রতি সপ্তাহে ৩টি ভিডিও + ২টি শর্টস পোস্ট করুন।":"Consistency beats perfection. Aim 3 long-form + 2 Shorts per week."}</p>`;
  }
  function genPlaylistPlan(topic, bn){
    const playlists = bn?[
      {n:`${topic} — শুরুর গাইড`, desc:`শুরুর ৫টি ভিডিও — বেসিক থেকে অ্যাডভান্স`},
      {n:`${topic} টিপস ও ট্রিকস`, desc:`ছোট ছোট প্রাকটিক্যাল টিপস পর্বসমূহ`},
      {n:`${topic} মিস্টেকস`, desc:`সাধারণ ভুল ও সেগুলোর সমাধান`},
      {n:`${topic} কেস স্টাডি`, desc:`বাস্তব উদাহরণ ও রেজাল্টের ভিডিও`},
      {n:`${topic} Q&A`, desc:`দর্শকদের প্রশ্নের উত্তর পর্ব`}
    ]:[
      {n:`${topic} — Starter Guide`, desc:"First 5 videos from basic to advanced"},
      {n:`${topic} Tips & Tricks`, desc:"Short, practical quick-win episodes"},
      {n:`${topic} Mistakes`, desc:"Common mistakes and fixes"},
      {n:`${topic} Case Studies`, desc:"Real-world examples with results"},
      {n:`${topic} Q&A`, desc:"Answered viewer questions"}
    ];
    return playlists.map((p,i)=>`<p><b>${i+1}. ${esc(p.n)}</b><br><span class="muted small">${esc(p.desc)}</span><br><span>${bn?"সিরিজে ১০টি ভিডিও":"Suggested 10 videos in binge order"}</span></p>`).join("");
  }
  function genChapters(topic, bn){
    return `<span class="section-title">${esc(bn?"চ্যাপ্টার (টাইমস্ট্যাম্পসহ)":"Chapters with Timestamps")}</span><pre style="white-space:pre-wrap;font-family:inherit;margin:0">0:00 ${esc(bn?"ইন্ট্রো ও আজকের টপিক":"Intro & today's topic: "+topic)}
1:15 ${esc(bn?"বেসিক কনসেপ্ট":"The basics")}
4:30 ${esc(bn?"মূল পদ্ধতি ধাপে ধাপে":"Core method step-by-step")}
8:00 ${esc(bn?"সাধারণ ভুল":"Common mistakes to avoid")}
10:45 ${esc(bn?"প্রো টিপস":"Pro tips & tools")}
13:20 ${esc(bn?"বাস্তব ডেমো":"Live demo / example")}
16:00 ${esc(bn?"চূড়ান্ত পরামর্শ ও CTA":"Final advice & CTA")}</pre>
<p class="muted small">${bn?"ডিসক্রিপশনে প্রথম লাইন '0:00 Intro' দিলে YouTube স্বয়ংক্রিয়ভাবে চ্যাপ্টার চিনে নেয়।":"YouTube auto-detects chapters when 0:00 is included in description."}</p>`;
  }
  function genSummary(topic, bn){
    return `<span class="section-title">${esc(bn?"সারাংশ (Key Takeaways)":"Summary & Key Takeaways")}</span>
      <ul>
        <li>${esc(bn?`${topic} এর মূল ভিত্তি হলো পরিষ্কার পরিকল্পনা ও ধারাবাহিক প্রচেষ্টা।`:`${topic} relies on clear planning and consistent execution.`)}</li>
        <li>${esc(bn?`শুরুতে ছোট ছোট ধাপ — বড় লক্ষ্যে পৌঁছানোর সবচেয়ে সহজ উপায়।`:`Small, daily steps beat big, occasional bursts.`)}</li>
        <li>${esc(bn?`সাধারণ ভুলগুলো চিনে আগে থেকে সংশোধন করুন — এগিয়ে থাকবেন।`:`Identify common mistakes early to stay ahead.`)}</li>
      </ul>
      <p class="muted small">${bn?"এই সারাংশ ডিসক্রিপশন বা পিন্ড কমেন্টে কপি করুন।":"Copy this summary into your description or pinned comment."}</p>`;
  }
  function genCommunityPosts(topic, bn){
    const posts = bn?[
      {t:"পোল", v:`আগামী ভিডিওতে কোন টপিক দেখতে চান? 🎯\n🔘 ${topic} — বেসিক গাইড\n🔘 ${topic} — অ্যাডভান্সড টিপস\n🔘 ${topic} — কেস স্টাডি`},
      {t:"প্রশ্ন পোস্ট", v:`${topic} নিয়ে আপনার সবচেয়ে বড় সমস্যা কী? কমেন্টে বলুন — পরের ভিডিওতে সেই টপিক কভার করছি।`},
      {t:"বিহাইন্ড দ্য সিন", v:`আগামীকালের ${topic} ভিডিওটির জন্য থাম্বনেইল বানাচ্ছি। কোনটা ভালো — A or B?`},
      {t:"টিজার", v:`আগামী ভিডিও: ${topic} এ ১০x রেজাল্টের ৩টি সিক্রেট। 🔔 সাবস্ক্রাইব করে রাখুন — কালকে আসছে।`},
      {t:"ধন্যবাদ পোস্ট", v:`${topic} ভিডিওটি ১০ হাজার ভিউ পার করেছে! সবাইকে ধন্যবাদ — পরবর্তী ভিডিও আরও বড় কিছু হতে যাচ্ছে।`}
    ]:[
      {t:"Poll", v:`Which topic should I cover next?\n🔘 ${topic} — Beginner Guide\n🔘 ${topic} — Advanced Tips\n🔘 ${topic} — Case Study`},
      {t:"Question", v:`What's your single biggest struggle with ${topic}? Drop it below and I'll cover it in my next video.`},
      {t:"Behind the Scenes", v:`Editing tomorrow's ${topic} video right now. Which thumbnail — A or B?`},
      {t:"Teaser", v:`Next video: 3 secrets that 10x your ${topic} results. Sub and ring the bell — drops tomorrow.`},
      {t:"Thank You", v:`The ${topic} video just crossed 10K views! Thank you — the next one is going to be the biggest yet.`}
    ];
    return posts.map(p=>`<p><b>${esc(p.t)}:</b></p><p style="background:var(--bg-soft);padding:10px 12px;border-radius:10px">${esc(p.v)}</p>`).join("");
  }
  function genPinned(topic, bn){
    const arr = bn?[
      `আপনি যদি এই ভিডিওটি দেখে থাকেন — কমেন্টে "শেষ পর্যন্ত দেখলাম" লিখুন! ${topic} নিয়ে কোন প্রশ্ন থাকলে নিচে করুন, আমি উত্তর দিচ্ছি। আর প্লে-লিস্ট থেকে ${topic} সিরিজের বাকি ভিডিওগুলো দেখে নিতে পারেন।`,
      `ভিডিওটি উপকারে লাগলে একটা লাইক আশা করছি :) যে টিপসটা সবচেয়ে কাজে লেগেছে সেটা কমেন্টে বলুন। পরের ভিডিওতে ${topic} এর পার্ট ২ আসছে — বেল বাটন অন করে রাখুন!`,
      `ফ্রি রিসোর্স লিঙ্ক পিন করা আছে 👇 — ${topic} শুরু করার জন্য যা যা দরকার সব এখানে পাবেন। সাপোর্টের জন্য লাইক ও শেয়ার করুন।`
    ]:[
      `If you made it this far, comment "WATCHED TILL THE END"! Ask any ${topic} questions below and I'll reply. Be sure to catch the rest of my ${topic} series in the playlist.`,
      `If this video helped, I'd love a like :) Tell me which tip worked for you in the comments. Next video is part 2 on ${topic} — ring the bell so you don't miss it!`,
      `Free resources are linked below 👇 — everything you need to start with ${topic}. A like and share is the best way to support the channel.`
    ];
    return wrap(bn?"৩টি পিনযোগ্য কমেন্ট":"3 Pinned Comment Options", arr.map(esc));
  }
  function genBios(topic, bn){
    const shorts = bn?[
      `${topic} সহজ ভাষায়।`,
      `প্রাকটিক্যাল ${topic} টিপস।`,
      `${topic} — শিখুন, প্রয়োগ করুন, সফল হন।`
    ]:[
      `${topic} made simple.`,
      `Practical ${topic} tips, weekly.`,
      `${topic} — learn, apply, grow.`
    ];
    const taglines = bn?["সহজে শিখি","প্রফেশনাল ক্রিয়েটর","শব্দে ও কাজে স্পষ্ট"]:["Learn simply","Professional creator","Clear in word and work"];
    return wrap(bn?"শর্ট বায়ো (১৫০ অক্ষরের মধ্যে)":"Short Bios (<150 chars)", shorts.map(esc))+
           wrap(bn?"ট্যাগলাইন":"Taglines", taglines.map(esc));
  }
  function genAbout(topic, bn){
    return `<span class="section-title">${esc(bn?"চ্যানেল সম্পর্কে (About)":"Channel About Section")}</span>
<p><b>${esc(bn?"স্বাগতম":"Welcome")}</b><br>${esc(bn?`এই চ্যানেলে আপনি পাবেন ${topic} সহ সেরা টিপস, টিউটোরিয়াল এবং বাস্তব অভিজ্ঞতার গল্প — যাতে আপনি সহজেই শিখতে ও এগিয়ে যেতে পারেন।`:`On this channel you'll find ${topic} tips, in-depth tutorials, and real-world lessons that help you learn faster and go further.`)}</p>
<p><b>${esc(bn?"আমরা কী পোস্ট করি":"What We Post")}</b><br>${esc(bn?`- সপ্তাহে ৩টি লং-ফর্ম ভিডিও\n- রোজ শর্টস টিপস\n- মাসে একটি লাইভ Q&A`:`- 3 long-form videos per week\n- Daily Shorts tips\n- A live Q&A each month`)}</p>
<p><b>${esc(bn?"আপলোড সময়":"Upload Schedule")}</b> ${esc(bn?"সোম, বুধ, শুক্র — সকাল ৮টা":"Mon, Wed, Fri at 8 AM")}</p>
<p><b>${esc(bn?"যোগাযোগ":"Contact")}</b><br>${esc(bn?"ব্যবসায়িক ইমেইল: your@email.com":"Business: your@email.com")}</p>
<p><b>${esc(bn?"সাবস্ক্রাইব করুন":"Subscribe")}</b> ${esc(bn?"নতুন ভিডিও প্রথমে পেতে সাবস্ক্রাইব ও বেল বাটনে ক্লিক করুন!":"Subscribe and ring the bell to be notified of new videos!")}</p>`;
  }
  function genIntros(topic, bn){
    const arr = bn?[
      `আসসালামু আলাইকুম / হাই বন্ধুরা — আজকে ${topic} নিয়ে সম্পূর্ণ গাইড!`,
      `স্বাগতম আমার চ্যানেলে — আজকে আমি ${topic} এর সেই টিপসটা বলবো যা কেউ বলে না।`,
      `আজকের ভিডিওটি ${topic} শুরু করার জন্য একদম পারফেক্ট — শুরু করি!`,
      `আজকে আমরা ${topic} করবো লাইভ ডেমো দিয়ে — কন্টেন্ট মিস করবেন না!`,
      `${topic} আজকে আমি একদম বিগিনার ফ্রেন্ডলি ভাবে বুঝিয়ে দেব।`,
      `কেমন আছো সবাই? আজকে দারুণ একটা টপিক — ${topic} — শুরু করি!`
    ]:[
      `Hey everyone — welcome back. Today's video is the complete guide to ${topic}.`,
      `Welcome to the channel — today I'm sharing the one ${topic} secret no one tells you.`,
      `Today's video is perfect if you're just starting out with ${topic}.`,
      `We're doing a live demo of ${topic} today — stick around.`,
      `I'm going to break ${topic} down in the most beginner-friendly way possible.`,
      `What's up, creators? Today we're covering ${topic} — let's jump right in.`
    ];
    return wrap(bn?"১০টি সংক্ষিপ্ত ইন্ট্রো":"10 Short Intros (5-15 sec)", arr.map(esc));
  }
  function genCopyrightTips(bn){
    const tips = bn?[
      "নিজের সৃষ্ট কনটেন্ট সবচেয়ে নিরাপদ — নিজের শট ও ভয়েস ব্যবহার করুন।",
      "YouTube Audio Library থেকে রয়্যালটি-ফ্রি মিউজিক ব্যবহার করুন।",
      "ফেয়ার ইউজ শর্তে সংক্ষিপ্ত ক্লিপ ব্যবহার করুন — কিন্তু তাতে মন্তব্য, সমালোচনা বা শিক্ষামূলক মাত্রা যোগ করুন।",
      "কোনো ক্লিপ ব্যবহারের আগে লাইসেন্স চেক করুন — 'ফ্রি' লেখা থাকলেও শর্ত থাকতে পারে।",
      "কপিরাইট ক্লেইম পেলে আপিল করার আগে ভিডিও এডিট করে সমস্যা অংশ সরান।",
      "গান বা সাউন্ড ইফেক্ট ব্যবহারে ১০ সেকেন্ডের নিচে — তারপরও দাবি আসতে পারে।",
      "মুভি/টিভি ক্লিপ ব্যবহার করলে বেশি ঝুঁকি — প্যারোডি বা রিভিউ অ্যাঙ্গেলে ব্যবহার করুন।",
      "AI জেনারেটেড কনটেন্টেও মাঝে মাঝে কপিরাইট সমস্যা হতে পারে — ভেরিফাই করুন।",
      "কমিউনিটি গাইডলাইন ও মনিটাইজেশন পলিসি বুঝে নিন।",
      "চ্যানেলে সব ভিডিওর মালিকানা ও লাইসেন্সের ডকুমেন্ট সংরক্ষণ করুন।"
    ]:[
      "Original content is always safest — shoot your own footage and record your own voice.",
      "Use YouTube Audio Library for royalty-free music and sound effects.",
      "If using clips under fair use, add transformative commentary, criticism, or education.",
      "Always verify licenses — even 'free' clips can come with attribution restrictions.",
      "If you get a claim, edit out the segment before disputing to speed things up.",
      "The '10-second rule' is a myth — even 2 seconds can trigger a claim.",
      "Movie/TV clips are high-risk — use them only in reviews, parodies or commentary.",
      "AI-generated content can still trigger copyright claims — verify the output.",
      "Understand Community Guidelines and Monetization Policies thoroughly.",
      "Keep a record of licenses and ownership documents for every video."
    ];
    return wrap(bn?"কপিরাইট সুরক্ষা টিপস":"Copyright Safety Tips", tips.map(esc))+
           `<p class="muted small">${bn?"ডিসক্লেইমার: এটি আইনি পরামর্শ নয় — সাধারণ গাইডলাইন মাত্র।":"Disclaimer: These are general guidelines, not legal advice."}</p>`;
  }
  function genAIPrompts(topic, bn){
    const prompts = bn?[
      `তুমি একজন সিনিয়র YouTube স্ট্র্যাটেজিস্ট। ${topic} নিয়ে ১০টি ভাইরাল টাইটেল লিখো, প্রতিটি ৬০ অক্ষরের মধ্যে, কিউরিওসিটি ও ক্লিয়ার ভ্যালুসহ।`,
      `তুমি প্রফেশনাল কপিরাইটার। ${topic} ভিডিওর জন্য 200 শব্দের ডিসক্রিপশন লিখো, প্রথম লাইনে হুক, কী-ওয়ার্ড স্বাভাবিকভাবে এবং শেষে CTA।`,
      `তুমি একজন থাম্বনেইল ডিজাইনার। ${topic} থাম্বনেইলের ৫টি কনসেপ্ট দাও: কালার, এক্সপ্রেশন, টেক্সট, কম্পোজিশন।`,
      `তুমি একজন চ্যানেল গ্রোথ কোচ। ${topic} নিচের চ্যানেলের জন্য ৩০ দিনের পোস্ট প্ল্যান বানিয়ে দাও।`,
      `তুমি একজন স্ক্রিপ্ট এডিটর। ${topic} উপর ৬০ সেকেন্ডের শর্টস স্ক্রিপ্ট লিখো যা শুরুতেই দর্শককে থামিয়ে রাখে।`,
      `তুমি একজন SEO বিশেষজ্ঞ। ${topic} ভিডিওর জন্য ২০টি ট্যাগ বানাও — ব্রড, লং-টেইল, প্রশ্ন মিলিয়ে।`,
      `তুমি একজন কমিউনিটি ম্যানেজার। ${topic} ভিডিওর জন্য ৫টি কমিউনিটি পোস্ট (পোল, Q&A, টিজার) লিখো।`,
      `তুমি একজন মনিটাইজেশন কোচ। ${topic} নিচ দিয়ে মাসে $1000 আয়ের ৩টি উপায় বাতলে দাও।`,
      `তুমি একজন স্ক্রিপ্ট ডক্টর। ${topic} লং-ফর্ম স্ক্রিপ্টের রিটেনশন বাড়ানোর জন্য ১০টি এডিট দাও।`,
      `তুমি একজন চ্যানেল ব্র্যান্ড এক্সপার্ট। ${topic} চ্যানেলের নাম, বায়ো, ট্যাগলাইন ও কালার প্যালেট সাজেস্ট করো।`
    ]:[
      `You are a senior YouTube strategist. Write 10 viral titles for a video about ${topic}, each under 60 characters, using curiosity and clear value.`,
      `You are a professional copywriter. Write a 200-word description for a ${topic} video with a hook in line 1, natural keywords, and a closing CTA.`,
      `You are a thumbnail designer. Describe 5 thumbnail concepts for ${topic}: colors, expression, text, and composition.`,
      `You are a channel-growth coach. Create a 30-day posting plan for a ${topic} channel.`,
      `You are a shorts scriptwriter. Write a 60-second shorts script about ${topic} that hooks in the first 3 seconds.`,
      `You are an SEO expert. Generate 20 tags for ${topic}, mixing broad, long-tail, and question-based keywords.`,
      `You are a community manager. Write 5 community posts for a ${topic} video: poll, Q&A, teaser, behind the scenes, thank-you.`,
      `You are a monetization coach. Outline 3 realistic paths to $1000/month with a ${topic} niche channel.`,
      `You are a script doctor. Provide 10 retention-improving edits for a long-form ${topic} script.`,
      `You are a brand expert. Suggest a channel name, bio, tagline and color palette for a ${topic} creator.`
    ];
    return wrap(bn?"১০টি অ্যাডভান্সড AI প্রম্পট":"10 Advanced AI Prompts", prompts.map(esc));
  }
  function genImagePrompts(topic, bn){
    return [
      `<b>#1</b> — <code>${esc(`Professional YouTube thumbnail for "${topic}", cinematic close-up of creator with shocked expression, hard rim light, bold yellow (#ffd60a) 3D text, black background, high contrast, 8K, ultra-detailed, YouTube thumbnail style, negative: blurry, distorted, extra fingers` )}</code>`,
      `<b>#2</b> — <code>${esc(`Minimalist illustration of "${topic}" concept, flat vector, yellow and black color palette, lots of negative space, clean modern design, 16:9 thumbnail, white outline` )}</code>`,
      `<b>#3</b> — <code>${esc(`Cinematic stock photo of "${topic}" in action, dramatic lighting, dust particles in air, shallow depth of field, 50mm f/1.4, photorealistic, 4K` )}</code>`,
      `<b>#4</b> — <code>${esc(`3D render of a glowing yellow arrow pointing at "${topic}" text, floating on dark background, soft shadow, studio lighting, clean and bold` )}</code>`,
      `<b>#5</b> — <code>${esc(`Before/after split screen showing "${topic}" transformation, left side faded colors, right side vibrant yellow, expressive faces, bold text "WHAT A DIFFERENCE"` )}</code>`,
      `<b>#6</b> — <code>${esc(`Anime-style illustration of "${topic}" scene, high contrast, bold outlines, vivid yellow accents, dynamic pose, high energy, YouTube thumbnail composition` )}</code>`
    ].join("<br><br>");
  }
  function genImg2VidPrompts(topic, bn){
    const arr = bn?[
      "ধীর ক্যামেরা জুম-ইন, সাবজেক্টের চোখের দিকে, সফট লাইট স্থির, ব্যাকগ্রাউন্ডে সূক্ষ্ম ধোঁয়া, ৪ সেকেন্ড, 24fps, সিনেম্যাটিক।",
      "সাবজেক্ট ধীরে ধীরে ক্যামেরার দিকে তাকায়, মাথা পাশ থেকে সামনে ঘোরায়, ব্যাকগ্রাউন্ডে হালকা লাইট লিক, ৫ সেকেন্ড।",
      "প্যান শট বাম থেকে ডানে, টেক্সট ধীরে স্কেল বাড়ায়, ইয়েলো গ্লো ইন্টেন্সিফাই হয়, ৩ সেকেন্ড, ক্লোজ-আপ।",
      "স্লো-মোশন অবজেক্ট ড্রপ, ক্যামেরা নিচের দিকে ফলো করে, ড্র্যাম্যাটিক সাউন্ড ডিজাইন, ৪ সেকেন্ড।",
      "স্থির শট — থাম্বনেইলের চারপাশে ইয়েলো অ্যারো অ্যানিমেট হয়, ফ্লিকার ইফেক্ট, ৬ সেকেন্ড শর্টস লুপ।"
    ]:[
      "Slow cinematic zoom-in toward the subject's eyes, soft key light steady, subtle dust particles in background, 4 seconds, 24fps, high-end look.",
      "Subject slowly turns head from side to front, looking into camera, soft light-leak animation in the background, 5 seconds.",
      "Pan shot left to right, bold yellow text scales up 120% over 3 seconds, yellow glow intensifies, close-up composition.",
      "Slow-motion object drop with camera tracking down, dramatic motion blur, 4 seconds, cinematic.",
      "Static shot with animated yellow arrows circling the thumbnail, subtle flicker effect, 6-second seamless loop for Shorts."
    ];
    return wrap(bn?"৫টি ইমেজ-টু-ভিডিও প্রম্পট":"5 Image-to-Video Prompts", arr.map(esc));
  }
  function genVoiceScript(topic, tone, bn){
    return `<span class="section-title">${esc(bn?"ভয়েস-ওভার স্ক্রিপ্ট (১ মিনিট)":"Voiceover Script (~1 minute)")}</span>
<p><b>${esc(bn?"সেটিং":"Tone")}:</b> ${esc(tone)} · <b>${esc(bn?"গতি":"Pace")}:</b> ${esc(bn?"মাঝারি (১৩০ wpm)":"Medium (150 wpm)")}</p>
<p style="line-height:1.9">
${esc(bn?`[pause 0.5s] — ${topic}। আপনি হয়তো ভাবছেন এটা কঠিন। [pause 0.3s] — কিন্তু সত্যটা হলো, যদি আপনি তিনটি সহজ ধাপ অনুসরণ করেন, এটা একদম সহজ। [pause 0.3s] — প্রথম ধাপ: বিষয়টি বুঝুন। [emphasis] শুধু টিপস মুখস্ত করবেন না — মূল কনসেপ্টটা ধরুন। [pause 0.3s] — দ্বিতীয় ধাপ: ছোট করে শুরু করুন। [emphasis] একদিনে এক্সপার্ট হওয়ার দরকার নেই। [pause 0.2s] — তৃতীয় ধাপ: প্রতিদিন প্রাকটিস করুন। [pause 0.4s] — ${topic} এ সফল হতে হলে ধারাবাহিকতাই সবচেয়ে বড় হাতিয়ার। [pause 0.3s] — এখন কমেন্টে বলুন, আপনি আজ থেকে কোন ধাপটি শুরু করছেন?`:`[pause 0.5s] — ${topic}. You might think it's hard. [pause 0.3s] — But the truth is, if you follow three simple steps, it becomes easy. [pause 0.3s] — Step one: understand the core. [emphasis] Don't just memorize tips — get the concept. [pause 0.3s] — Step two: start small. [emphasis] You don't need to be an expert on day one. [pause 0.2s] — Step three: practice daily. [pause 0.4s] — With ${topic}, consistency is your biggest weapon. [pause 0.3s] — Drop a comment and tell me which step you're taking today.`)}
</p>`;
  }
  function genSubtitles(topic, bn){
    return `<span class="section-title">${esc(bn?"SRT-স্টাইল সাবটাইটেল টেমপলেট":"SRT-style Subtitle Template")}</span>
<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;background:var(--bg-soft);padding:12px;border-radius:10px">1
00:00:00,000 --> 00:00:03,000
${esc(bn?`আজকে আমরা ${topic} নিয়ে কথা বলবো`:`Today we talk about ${topic}`)}

2
00:00:03,000 --> 00:00:07,500
${esc(bn?`মাত্র ৩টি ধাপ — কিন্তু প্রতিটি গুরুত্বপূর্ণ`:`Just 3 steps, but every one matters.`)}

3
00:00:07,500 --> 00:00:12,000
${esc(bn?`প্রথম ধাপ হলো বেসিক বোঝা`:`Step one — understand the basics.`)}

4
00:00:12,000 --> 00:00:17,000
${esc(bn?`দ্বিতীয় ধাপে আমরা প্রাকটিস করবো`:`Step two — hands-on practice.`)}

5
00:00:17,000 --> 00:00:22,000
${esc(bn?`তৃতীয় ধাপে কমন ভুল এড়ানো`:`Step three — avoid common mistakes.`)}</pre>
<p class="muted small">${bn?"টিপস: এক লাইন ৪০ অক্ষরের মধ্যে রাখুন, প্রতি লাইন ২–৪ সেকেন্ড স্ক্রিনে রাখুন।":"Keep each line under 40 chars and on screen 2-4 seconds."}</p>`;
  }
  function genSTTTemplate(topic, bn){
    return `<span class="section-title">${esc(bn?"স্পিচ-টু-টেক্সট: ট্রান্সক্রিপশন টেমপ্লেট ও গাইড":"Speech-to-Text Transcription Template & Guide")}</span>
<p><b>${esc(bn?"সেরা ফলাফলের জন্য":"For best results")}:</b></p>
<ul>
  <li>${esc(bn?"শান্ত পরিবেশে ক্লিয়ার মাইক ব্যবহার করুন":"Use a clear microphone in a quiet room")}</li>
  <li>${esc(bn?"প্রতি বাক্যের শেষে ছোট পজ নিন":"Pause briefly between sentences")}</li>
  <li>${esc(bn?"ট্রান্সক্রিপশনে স্পিকার লেবেল যোগ করুন":"Add speaker labels (Speaker A / Speaker B)")}</li>
  <li>${esc(bn?"জেনারেটেড টেক্সটে বিরামচিহ্ন ও ক্যাপিটালাইজেশন সংশোধন করুন":"Edit punctuation and capitalization after generation")}</li>
</ul>
<p><b>${esc(bn?"নমুনা আউটপুট ফরম্যাট":"Sample Output Format")}:</b></p>
<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;background:var(--bg-soft);padding:12px;border-radius:10px">[00:00] Host: ${esc(bn?`${topic} সবচেয়ে বড় রহস্যটা কী?`:`What's the biggest misconception about ${topic}?`)}
[00:08] Guest: ${esc(bn?`বেশিরভাগ মানুষ এটা জটিল মনে করে — আসলে সহজ।`:`Most people overcomplicate it — it's actually simple.`)}</pre>`;
  }
  function genTTSTemplate(topic, bn){
    return `<span class="section-title">${esc(bn?"টেক্সট-টু-স্পিচ: TTS-রেডি স্ক্রিপ্ট":"Text-to-Speech Ready Script")}</span>
<p><b>${esc(bn?"ভয়েস স্টাইল":"Voice style")}:</b> ${esc(bn?"বন্ধুর মতো, বিশ্বাসযোগ্য":"Warm, friendly, trustworthy")} · <b>${esc(bn?"গতি":"Speed")}:</b> 1.0x</p>
<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;background:var(--bg-soft);padding:12px;border-radius:10px;line-height:1.8">${esc(bn?`&lt;speak&gt;
  &lt;break time="400ms"/&gt;
  ${topic}। &lt;break time="300ms"/&gt;
  &lt;emphasis level="moderate"&gt;একটা বিষয় যা কেউ বলে না,&lt;/emphasis&gt; আজকে আমি তা বলছি।
  &lt;break time="250ms"/&gt;
  শুরু করার জন্য &lt;prosody rate="-10%"&gt;ধীরে শুরু করুন,&lt;/prosody&gt; তারপর দ্রুত শিখুন।
  &lt;break time="400ms"/&gt;
  আজকের টিপস কাজে লেগেছে কি না — কমেন্টে জানাবেন।
&lt;/speak&gt;`:`&lt;speak&gt;
  &lt;break time="400ms"/&gt;
  ${topic}. &lt;break time="300ms"/&gt;
  &lt;emphasis level="moderate"&gt;Here's what no one tells you:&lt;/emphasis&gt; it's simpler than it looks.
  &lt;break time="250ms"/&gt;
  Start &lt;prosody rate="-10%"&gt;slow and steady,&lt;/prosody&gt; then build up.
  &lt;break time="400ms"/&gt;
  Let me know in the comments if this worked for you.
&lt;/speak&gt;`)}</pre>
<p class="muted small">${esc(bn?"SSML ব্যবহার করলে আরও ন্যাচারাল সাউন্ড পাবেন।":"Use SSML for natural pauses and emphasis when your TTS engine supports it.")}</p>`;
  }

  // Very lightweight pseudo-translation (demo); replaces sample words to feel bilingual
  function pseudoTranslate(text, dir){
    if(dir==="en2bn"){
      const dict = {
        "the":"দি","a":"একটি","is":"হয়","and":"এবং","you":"আপনি","i":"আমি","to":"করতে",
        "for":"জন্য","of":"-র","in":"-তে","with":"সাথে","your":"আপনার","my":"আমার",
        "hello":"হ্যালো","thanks":"ধন্যবাদ","how":"কীভাবে","what":"কী","why":"কেন",
        "youtube":"ইউটিউব","video":"ভিডিও","tips":"টিপস","tutorial":"টিউটোরিয়াল","how to":"কীভাবে"
      };
      return text.split(/(\s+)/).map(w=>dict[w.toLowerCase()]||w).join("");
    } else {
      const dict = {"আমি":"I","আপনি":"you","এবং":"and","একটি":"a","হয়":"is","করতে":"to","জন্য":"for","কীভাবে":"how","কেন":"why","কী":"what","ধন্যবাদ":"thanks","ইউটিউব":"YouTube","ভিডিও":"video","টিপস":"tips","টিউটোরিয়াল":"tutorial","বাংলা":"Bengali"};
      return text.split(/\s+/).map(w=>dict[w]||w).join(" ");
    }
  }

  // ========== Tool-specific mini apps ==========
  function setupEarningsCalc(){
    // This runs while the page is the tool page; insert inputs.
    requestAnimationFrame(()=>{
      const inp = $("#toolInput");
      if(inp && inp.dataset.calc!=="1"){
        inp.dataset.calc="1";
        inp.closest(".input-col").insertAdjacentHTML("afterbegin", `
          <label class="label">Daily views</label>
          <input id="ec_views" type="number" class="select" style="padding:12px" value="10000" min="0" />
          <label class="label">Estimated RPM (USD per 1000 views)</label>
          <input id="ec_rpm" type="number" step="0.1" class="select" style="padding:12px" value="3" min="0" />
          <label class="label">CTR / affiliate conversion %</label>
          <input id="ec_conv" type="number" step="0.1" class="select" style="padding:12px" value="0" min="0" />
          <label class="label">EPC (earnings per 100 clicks, USD)</label>
          <input id="ec_epc" type="number" step="0.1" class="select" style="padding:12px" value="0" min="0" />
        `);
        inp.closest(".input-col").querySelector("label[for='toolInput']").textContent = "Notes (optional)";
        inp.rows = 3;
        inp.placeholder = "Optional notes about the channel/niche...";
      }
    });
  }
  function earningsCalcOutput(){
    const v = parseFloat($("#ec_views")?.value||"10000");
    const rpm = parseFloat($("#ec_rpm")?.value||"3");
    const conv = parseFloat($("#ec_conv")?.value||"0");
    const epc = parseFloat($("#ec_epc")?.value||"0");
    const ad = (v/1000)*rpm;
    const aff = (v*conv/100)*(epc/100);
    const day = ad+aff;
    return `<span class="section-title">Estimated Earnings</span>
      <ul>
        <li><b>Daily views:</b> ${v.toLocaleString()}</li>
        <li><b>RPM:</b> $${rpm.toFixed(2)}</li>
        <li><b>Ad revenue per day:</b> $${ad.toFixed(2)}</li>
        <li><b>Affiliate/extra per day:</b> $${aff.toFixed(2)}</li>
      </ul>
      <p><b>Daily:</b> $${day.toFixed(2)}</p>
      <p><b>Monthly:</b> $${(day*30).toFixed(2)}</p>
      <p><b>Yearly:</b> $${(day*365).toFixed(2)}</p>
      <p class="muted small">These are estimates. Actual RPM varies by niche, country, watch time and ad format. Finance/tech/business niches tend to pay higher; entertainment/vlogs lower.</p>`;
  }

  function setupLengthEstimator(){
    requestAnimationFrame(()=>{
      const col = $("#toolInput")?.closest(".input-col");
      if(!col || col.dataset.len==="1") return;
      col.dataset.len="1";
      col.insertAdjacentHTML("afterbegin", `
        <label class="label">Language</label>
        <select id="le_lang" class="select">
          <option value="en">English (approx 150 wpm)</option>
          <option value="bn">Bangla (approx 130 wpm)</option>
          <option value="mix">Mixed (approx 140 wpm)</option>
        </select>`);
      $("#toolInput").placeholder = "Paste your script here...";
    });
  }
  function lengthEstOutput(text){
    const lang = $("#le_lang")?.value || "en";
    const wpm = lang==="bn"?130:lang==="mix"?140:150;
    const words = (text||"").trim().split(/\s+/).filter(Boolean).length;
    const mins = words/wpm;
    const mm = Math.floor(mins);
    const ss = Math.round((mins-mm)*60);
    return `<span class="section-title">Estimated Video Length</span>
      <p><b>Word count:</b> ${words}</p>
      <p><b>Speaking rate:</b> ${wpm} wpm</p>
      <p style="font-size:24px;font-weight:800">${mm} min ${ss} sec</p>
      <p class="muted small">Reading 10% slower for pauses/visuals: ${Math.floor((words/(wpm*0.9)))} min ${Math.round((((words/(wpm*0.9)))-Math.floor(words/(wpm*0.9)))*60)} sec.</p>`;
  }

  function setupNotes(){
    requestAnimationFrame(()=>{
      const ta = $("#toolInput");
      if(!ta) return;
      ta.rows = 14;
      ta.placeholder = "Write your quick ideas, script snippets, and checklists here...";
      ta.value = localStorage.getItem("ythub_notes")||"";
      ta.addEventListener("input", ()=>localStorage.setItem("ythub_notes", ta.value));
    });
  }

  function setupDashboard(){
    requestAnimationFrame(()=>{
      const inp = $("#toolInput");
      const out = $("#toolOutput");
      if(inp) inp.closest(".input-col").style.display="none";
      if(out){
        out.innerHTML = dashboardOutput();
        out.classList.add("has-content");
      }
    });
  }
  function dashboardOutput(){
    const favCount = D.favorites.length;
    const histCount = D.history.length;
    const saveCount = D.saved.length;
    const recent = D.history.slice(0,5);
    const recentFav = D.tools.filter(t=>D.favorites.includes(t.id)).slice(0,6);
    return `<span class="section-title">Creator Toolbox Dashboard</span>
    <div class="row gap" style="margin:8px 0 14px;flex-wrap:wrap">
      <div style="flex:1;min-width:140px;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--bg-soft)"><div class="muted small">Tools</div><div style="font-size:24px;font-weight:800">${D.tools.length}</div></div>
      <div style="flex:1;min-width:140px;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--bg-soft)"><div class="muted small">Favorites</div><div style="font-size:24px;font-weight:800">${favCount}</div></div>
      <div style="flex:1;min-width:140px;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--bg-soft)"><div class="muted small">Saved</div><div style="font-size:24px;font-weight:800">${saveCount}</div></div>
      <div style="flex:1;min-width:140px;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--bg-soft)"><div class="muted small">History</div><div style="font-size:24px;font-weight:800">${histCount}</div></div>
    </div>
    <p><b>Recent favorites</b></p>
    <div class="grid grid-4" style="margin:6px 0 14px">${recentFav.length?recentFav.map(toolCardHTML).join(""):'<p class="muted">Favorite a tool from its toolbar to see it here.</p>'}</div>
    <p><b>Recently used</b></p>
    <div>${recent.length?recent.map(h=>`<div style="padding:8px 0;border-bottom:1px dashed var(--line)"><b>${esc(h.title)}</b> <span class="muted small">— ${fmtTime(h.ts)}</span><div class="muted small">${esc((h.input||"").slice(0,120))}</div></div>`).join(""):'<p class="muted">Use a tool to see your recent activity.</p>'}</div>
    <p class="muted small" style="margin-top:12px"><a href="#/tools">Open all tools &rarr;</a></p>`;
  }

  // ===== History modal =====
  function openHistoryModal(tool){
    const items = D.history.filter(h=>h.toolId===tool.id).slice(0,30);
    const html = `<div class="modal-backdrop" id="histModal">
      <div class="modal">
        <div class="modal-head"><h3>History — ${esc(tool.title)}</h3><button class="icon-btn" data-close>&times;</button></div>
        <div class="modal-body">
          ${items.length?items.map(h=>`<div class="list-item" data-id="${h.id}" style="cursor:pointer">
            <div class="li-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
            <div class="li-body"><h4>${fmtTime(h.ts)}</h4><p>${esc((h.input||"(empty)").slice(0,80))}</p></div>
          </div>`).join(""):'<p class="muted">No history yet for this tool.</p>'}
        </div>
        <div class="modal-foot">
          <button class="admin-btn danger" data-clear>Clear history for this tool</button>
          <button class="admin-btn" data-close>Close</button>
        </div>
      </div>
    </div>`;
    $("#modalRoot").innerHTML = html;
    const m = $("#histModal");
    m.addEventListener("click", e=>{
      if(e.target.closest("[data-close]") || e.target===m){ closeModal(); }
      if(e.target.closest("[data-clear]")){
        D.history = D.history.filter(h=>h.toolId!==tool.id);
        D.persist();
        closeModal();
        toast("History cleared");
      }
      const row = e.target.closest(".list-item[data-id]");
      if(row){
        const it = items.find(x=>x.id===row.dataset.id);
        if(it){
          $("#toolInput").value = it.input||"";
          $("#toolOutput").innerHTML = `<p>${esc(it.output)}</p>`;
          $("#toolOutput").classList.add("has-content");
          closeModal();
        }
      }
    });
  }
  function closeModal(){ $("#modalRoot").innerHTML = ""; }

  // ===== List pages (favorites / history / saved) =====
  function renderList(type){
    const tpl = $("#tpl-list").content.cloneNode(true);
    app.appendChild(tpl);
    const map = {
      favorites: { title:"Favorites", sub:"Your favorite tools for quick access." },
      history:   { title:"History",   sub:"Your recent generations across all tools." },
      saved:     { title:"Saved",     sub:"Items you saved for later use." }
    };
    const meta = map[type];
    $("#listTitle").textContent = meta.title;
    $("#listSub").textContent = meta.sub;

    function draw(){
      const q = ($("#listSearch").value||"").toLowerCase();
      const box = $("#listItems");
      let items = [];
      if(type==="favorites"){
        items = D.tools.filter(t=>D.favorites.includes(t.id))
          .filter(t=>!q || t.title.toLowerCase().includes(q) || (t.bangla||"").toLowerCase().includes(q))
          .map(t=>({ _tool:true, id:t.id, title:t.title, desc:t.bangla, icon:t.icon, link:"#/tool?id="+t.id, ts:0 }));
      } else {
        const arr = type==="history"?D.history:D.saved;
        items = arr.filter(h=>!q || (h.title||"").toLowerCase().includes(q) || (h.input||"").toLowerCase().includes(q))
          .map(h=>{
            const tool = D.tools.find(t=>t.id===h.toolId);
            return { id:h.id, title:h.title, desc:h.input, ts:h.ts, icon:tool?tool.icon:D.icons.dash, link:"#/tool?id="+h.toolId, _removable:true };
          });
      }
      if(!items.length){ $("#listEmpty").hidden=false; box.innerHTML=""; return; }
      $("#listEmpty").hidden=true;
      box.innerHTML = items.map(it=>`
        <div class="list-item fade-in" ${it.link?`data-link="${it.link}"`:""} style="cursor:${it.link?'pointer':'default'}">
          <div class="li-icon">${it.icon}</div>
          <div class="li-body">
            <h4>${esc(it.title)}</h4>
            <p>${esc((it.desc||"").slice(0,140))}</p>
            ${it.ts?`<div class="li-meta">${fmtTime(it.ts)}</div>`:""}
          </div>
          <div class="li-actions">
            ${it._removable?`<button data-del="${it.id}" aria-label="Remove"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg></button>`:""}
            ${it.link?`<button data-open="${it.link}" aria-label="Open"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg></button>`:""}
          </div>
        </div>`).join("");
      $$(".list-item[data-link]", box).forEach(li=>li.addEventListener("click",e=>{
        if(e.target.closest("[data-del]")) return;
        navigate(li.dataset.link);
      }));
      $$("[data-del]", box).forEach(b=>b.addEventListener("click",e=>{
        e.stopPropagation();
        if(type==="history") D.history = D.history.filter(x=>x.id!==b.dataset.del);
        if(type==="saved") D.saved = D.saved.filter(x=>x.id!==b.dataset.del);
        D.persist(); draw(); toast("Removed");
      }));
    }
    $("#listSearch").addEventListener("input", draw);
    $("#listClear").addEventListener("click", ()=>{
      if(type==="favorites"){ D.favorites = []; }
      if(type==="history"){ D.history = []; }
      if(type==="saved"){ D.saved = []; }
      D.persist(); draw(); toast("Cleared");
    });
    draw();
  }

  // ===== Ask AI =====
  function renderAskAI(){
    const tpl = $("#tpl-askai").content.cloneNode(true);
    app.appendChild(tpl);

    const sel = $("#aiCat");
    sel.innerHTML += D.askCategories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("");
    $("#aiExamples").innerHTML = D.askExamples.map(q=>`<button class="chip yellow">${esc(q)}</button>`).join("");
    $$("#aiExamples .chip").forEach(c=>c.addEventListener("click",()=>{ $("#aiQ").value = c.textContent; }));

    const out = $("#aiOut");
    $("#aiSubmit").addEventListener("click", ()=>doAsk());
    $("#aiClear").addEventListener("click", ()=>{ $("#aiQ").value=""; out.innerHTML=""; $("#aiErr").hidden=true; });
    $("#aiQ").addEventListener("keydown", e=>{ if((e.ctrlKey||e.metaKey)&&e.key==="Enter") doAsk(); });

    function doAsk(){
      const q = $("#aiQ").value.trim();
      if(!q){ $("#aiErr").textContent="Please enter a question first."; $("#aiErr").hidden=false; return; }
      $("#aiErr").hidden=true;
      const btn = $("#aiSubmit");
      btn.disabled = true; $(".btn-label",btn).textContent="Analyzing..."; $(".spinner",btn).hidden=false;
      out.innerHTML = `<div class="empty-state"><div class="spinner" style="width:28px;height:28px;border-width:3px;border-color:rgba(0,0,0,.15);border-top-color:#000"></div><p>Analyzing your question<span class="dots"></span></p></div>`;
      setTimeout(()=>{
        try{
          out.innerHTML = buildAskReport(q, sel.value);
          btn.disabled=false; $(".btn-label",btn).textContent="Get Expert Answer"; $(".spinner",btn).hidden=true;
        }catch(e){
          btn.disabled=false; $(".btn-label",btn).textContent="Get Expert Answer"; $(".spinner",btn).hidden=true;
          $("#aiErr").textContent="Something went wrong."; $("#aiErr").hidden=false;
        }
      }, 600+Math.random()*400);
    }
  }
  function buildAskReport(q, catId){
    const cat = D.askCategories.find(c=>c.id===catId) || D.askCategories[0];
    // Light categorization heuristics
    const low = q.toLowerCase();
    const catGuess = detectCategory(q);

    const analysis = `Your question "${q}" points to a common creator challenge around <b>${esc(catGuess)}</b>. Most creators facing this issue struggle with a gap between their content quality and what the YouTube system rewards in 2026 — a combination of packaging (title/thumb), retention, and consistent signal.`;
    const reasons = [
      `Title + thumbnail are not triggering enough curiosity in the feed (CTR below 5%).`,
      `The hook in the first 3-30 seconds is losing 60-70% of viewers.`,
      `The topic may be too broad or too saturated for your current authority.`,
      `Lack of a clear content series or binge path (no playlist, weak end screen).`,
      `Upload schedule is inconsistent, so the system has not built a reliable audience profile.`
    ];
    const solution = [
      `Audit your last 10 videos — note CTR, AVD, and audience retention shape.`,
      `Rewrite 10 titles per video with curiosity + value; design 2 thumbnail variants each.`,
      `Rewrite the first 30 seconds of every video to open with a specific promise or shock.`,
      `Niche down by 1 level: instead of "cooking", try "10-minute budget student meals".`,
      `Group videos into playlists and link them via cards/end screens (aim for 3+ min session time).`,
      `Publish on a fixed schedule for 6 weeks (3 videos + 3 shorts per week).`,
      `Reply to every comment in the first 2 hours — engagement signals help early push.`
    ];
    const mistakes = [
      `Blaming the algorithm instead of measuring CTR/retention.`,
      `Uploading long-form only and ignoring Shorts as a discovery engine.`,
      `Using generic titles like "Episode 12" or "Vlog #58".`,
      `Starting videos with "hey guys what's up, welcome back..." for 20 seconds.`,
      `Not studying peer channels that are succeeding in the exact same niche.`
    ];
    const tips = [
      `Run 3-title A/B tests using YouTube's Test & Compare feature.`,
      `Use the "cube" retention trick: introduce a payoff early, deliver it late.`,
      `End every video mid-story, not at a "natural end" — it lifts watch-next.`,
      `Mirror the language your audience uses in comments in your titles.`,
      `Add one "controversial" claim per video — it lifts both comments and CTR.`
    ];
    const resources = [
      `YouTube Creator Academy — YouTube's official free courses.`,
      `TubeBuddy / VidIQ free tiers for tag & CTR insights.`,
      `YouTube Studio "Audience" tab — watch the 'Other channels your audience watches'.`,
      `Google Trends for seasonality and breakout terms.`,
      `Our in-house SEO Analyzer and SEO Score Checker tools (in this hub).`
    ];
    const related = [
      "ai-title","ai-desc","ai-tags","thumb-prompt","hook","seo-score","video-idea","shorts-script"
    ];
    const blocks = [
      { title:"Problem Analysis", tag:"Analysis", body:`<p>${analysis}</p>` },
      { title:"Detected Category", tag:"Category", body:`<p>We routed this to <b>${esc(cat.name)}</b>.</p>` },
      { title:"Main Reasons", tag:"Diagnosis", body:"<ul>"+reasons.map(r=>`<li>${esc(r)}</li>`).join("")+"</ul>" },
      { title:"Step-by-step Solution", tag:"Action Plan", body:"<ol>"+solution.map(r=>`<li>${esc(r)}</li>`).join("")+"</ol>" },
      { title:"Common Mistakes", tag:"Watch Out", body:"<ul>"+mistakes.map(r=>`<li>${esc(r)}</li>`).join("")+"</ul>" },
      { title:"Advanced Tips", tag:"Pro", body:"<ul>"+tips.map(r=>`<li>${esc(r)}</li>`).join("")+"</ul>" },
      { title:"Useful Resources", tag:"Learn", body:"<ul>"+resources.map(r=>`<li>${esc(r)}</li>`).join("")+"</ul>" }
    ];

    const html = blocks.map(b=>`<div class="ai-block fade-in">
      <h3><span class="tag">${esc(b.tag)}</span> ${esc(b.title)}</h3>
      <div class="ai-body">${b.body}</div>
    </div>`).join("") +
    `<div class="ai-block fade-in">
      <h3><span class="tag">Try These</span> Related Tools</h3>
      <div class="ai-related">${related.map(id=>{
        const t = D.tools.find(x=>x.id===id); return t?`<a href="#/tool?id=${t.id}">${esc(t.title)}</a>`:"";
      }).join("")}</div>
    </div>`;
    return html;
  }
  function detectCategory(q){
    const low = q.toLowerCase();
    if(/subscri|subs|grow|0 sub|first 1000/.test(low)) return "subscriber growth";
    if(/view|no view|not getting views/.test(low)) return "low views / discovery";
    if(/ctr|thumb|click/.test(low)) return "CTR & thumbnails";
    if(/retention|drop|watch.*time|audience/.test(low)) return "audience retention";
    if(/money|monetiz|rpm|earn|income/.test(low)) return "monetization";
    if(/seo|rank|search/.test(low)) return "SEO & ranking";
    if(/short|tiktok|reels/.test(low)) return "Shorts growth";
    if(/copyright|strike|claim/.test(low)) return "copyright";
    if(/niche|brand|name/.test(low)) return "niche & branding";
    if(/algorithm|suggested|recommend/.test(low)) return "algorithm";
    return "general YouTube growth";
  }

  // ===== Admin Panel =====
  function renderAdmin(){
    const tpl = $("#tpl-admin").content.cloneNode(true);
    app.appendChild(tpl);
    const tabs = $$("#adminTabs button");
    tabs.forEach(b=>b.addEventListener("click",()=>{
      tabs.forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      drawTab(b.dataset.tab);
    }));
    drawTab("tools");

    function drawTab(tab){
      const root = $("#adminPanel");
      root.innerHTML = "";
      switch(tab){
        case "tools": return renderAdminTools(root);
        case "cats": return renderAdminCats(root);
        case "prompts": return renderAdminPrompts(root);
        case "qtemplate": return renderAdminQTemplate(root);
        case "guides": return renderAdminGuides(root);
        case "faqs": return renderAdminFaqs(root);
        case "notices": return renderAdminNotices(root);
        case "api": return renderAdminApi(root);
        case "banner": return renderAdminBanner(root);
        case "featured": return renderAdminFeatured(root);
        case "feedback": return renderAdminFeedback(root);
      }
    }

    function renderAdminTools(root){
      root.innerHTML = `<p class="muted small">Add, remove, edit, reorder or disable tools. Changes are saved locally in your browser.</p>
      <div id="adminTools"></div>
      <div class="admin-add">
        <input id="newToolTitle" class="select" style="flex:1;min-width:200px" placeholder="New tool title (English)">
        <input id="newToolBangla" class="select" style="flex:1;min-width:200px" placeholder="Bangla description">
        <select id="newToolCat" class="select">${D.categories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select>
        <button id="addToolBtn" class="admin-btn primary">+ Add Tool</button>
      </div>`;
      function draw(){
        $("#adminTools").innerHTML = D.tools.map((t,i)=>`
          <div class="admin-tool-row" data-i="${i}">
            <span style="font-weight:700;text-align:center;color:var(--muted)">${i+1}</span>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
              <input type="text" data-k="title" value="${esc(t.title)}" placeholder="Title (English)">
              <input type="text" data-k="bangla" value="${esc(t.bangla||"")}" placeholder="Bangla description">
            </div>
            <div class="at-actions">
              <select data-k="cat" class="select">${D.categories.map(c=>`<option value="${c.id}"${c.id===t.cat?" selected":""}>${esc(c.name)}</option>`).join("")}</select>
              <label class="small" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" data-k="enabled"${t.enabled!==false?" checked":""}>Enabled</label>
              <button class="admin-btn warn" data-move="-1" title="Move up">&uarr;</button>
              <button class="admin-btn warn" data-move="1" title="Move down">&darr;</button>
              <button class="admin-btn danger" data-del="${i}">Remove</button>
            </div>
          </div>`).join("");
        $$("#adminTools .admin-tool-row").forEach(row=>{
          const i = +row.dataset.i;
          $$("input,select",row).forEach(inp=>{
            inp.addEventListener("change", ()=>{
              const k = inp.dataset.k;
              if(k==="enabled") D.tools[i][k] = inp.checked;
              else D.tools[i][k] = inp.value;
              D.persist(); toast("Saved");
            });
            if(inp.tagName==="INPUT" && inp.type==="text"){
              inp.addEventListener("input", ()=>{ D.tools[i][inp.dataset.k]=inp.value; });
              inp.addEventListener("blur", ()=>D.persist());
            }
          });
          const delBtn = $("[data-del]",row);
          if(delBtn) delBtn.addEventListener("click",()=>{
            if(confirm("Remove this tool?")){ D.tools.splice(i,1); D.persist(); draw(); toast("Removed"); }
          });
          $$("[data-move]",row).forEach(b=>b.addEventListener("click",()=>{
            const dir = +b.dataset.move;
            const j = Math.max(0,Math.min(D.tools.length-1,i+dir));
            if(j===i) return;
            const tmp = D.tools[i]; D.tools[i]=D.tools[j]; D.tools[j]=tmp;
            D.persist(); draw();
          }));
        });
      }
      draw();
      $("#addToolBtn").addEventListener("click", ()=>{
        const title = $("#newToolTitle").value.trim();
        const bangla = $("#newToolBangla").value.trim();
        const cat = $("#newToolCat").value;
        if(!title){ toast("Enter a title","error"); return; }
        D.tools.push({ id:"custom-"+uid().slice(-6), title, bangla, cat, icon:D.icons.bulb, featured:false, enabled:true });
        D.persist(); draw(); toast("Tool added");
        $("#newToolTitle").value=""; $("#newToolBangla").value="";
      });
    }
    function renderAdminCats(root){
      root.innerHTML = `<p class="muted small">Add, remove or reorder categories.</p><div id="catList"></div>
      <div class="admin-add"><input id="newCatName" class="select" placeholder="Category name"><button id="addCat" class="admin-btn primary">+ Add Category</button></div>`;
      function draw(){
        $("#catList").innerHTML = D.categories.map((c,i)=>`
          <div class="admin-tool-row" data-i="${i}">
            <span style="font-weight:700;text-align:center;color:var(--muted)">${i+1}</span>
            <div class="row gap" style="flex:1">
              <input type="text" value="${esc(c.name)}" data-k="name" style="flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:8px">
            </div>
            <div class="at-actions">
              <button class="admin-btn warn" data-move="-1">&uarr;</button>
              <button class="admin-btn warn" data-move="1">&darr;</button>
              <button class="admin-btn danger" data-del="${i}">Remove</button>
            </div>
          </div>`).join("");
        $$("#catList .admin-tool-row").forEach(row=>{
          const i=+row.dataset.i;
          $("input[data-k='name']",row).addEventListener("input", e=>{ D.categories[i].name=e.target.value; });
          $("input[data-k='name']",row).addEventListener("blur", ()=>{ D.persist(); toast("Saved"); });
          $("[data-del]",row).addEventListener("click",()=>{
            if(confirm("Remove category? Tools in it will be moved to first category.")){
              const removed = D.categories.splice(i,1)[0];
              D.tools.forEach(t=>{ if(t.cat===removed.id) t.cat = D.categories[0].id; });
              D.persist(); draw();
            }
          });
          $$("[data-move]",row).forEach(b=>b.addEventListener("click",()=>{
            const dir=+b.dataset.move; const j=Math.max(0,Math.min(D.categories.length-1,i+dir));
            if(j===i)return; [D.categories[i],D.categories[j]]=[D.categories[j],D.categories[i]]; D.persist(); draw();
          }));
        });
      }
      draw();
      $("#addCat").addEventListener("click",()=>{
        const name=$("#newCatName").value.trim(); if(!name)return;
        D.categories.push({id:"cat-"+uid().slice(-5),name,icon:D.icons.list||D.icons.bulb});
        D.persist(); draw(); $("#newCatName").value=""; toast("Added");
      });
    }
    function renderAdminPrompts(root){
      root.innerHTML = `<p class="muted small">Override the AI prompt template for any tool.</p>
      <div class="kv"><label>Tool</label><select id="pTool">${D.tools.map(t=>`<option value="${t.id}">${esc(t.title)}</option>`).join("")}</select></div>
      <div class="kv"><label>Prompt template</label><textarea id="pTpl" rows="10" placeholder="Use {TOPIC}, {TONE}, {LANG} placeholders. Leave empty to use default."></textarea></div>
      <div class="admin-add"><button id="pSave" class="admin-btn primary">Save Prompt</button><button id="pReset" class="admin-btn">Reset to Default</button></div>
      <hr style="margin:18px 0;border-color:var(--line)">
      <h4 style="margin:0 0 10px">Custom Prompts (${Object.keys(D.prompts).length})</h4>
      <div id="pList"></div>`;
      function refresh(){
        $("#pTpl").value = (D.prompts[$("#pTool").value]?.template)||"";
        $("#pList").innerHTML = Object.keys(D.prompts).map(tid=>{
          const t=D.tools.find(x=>x.id===tid);
          return `<div class="list-item"><div class="li-icon">${t?t.icon:D.icons.bulb}</div><div class="li-body"><h4>${t?t.title:tid}</h4><p class="muted small">${esc((D.prompts[tid].template||"").slice(0,180))}...</p></div><div class="li-actions"><button data-del-p="${tid}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg></button></div></div>`;
        }).join("") || '<p class="muted small">No custom prompts yet — using defaults.</p>';
        $$("[data-del-p]",$("#pList")).forEach(b=>b.addEventListener("click",()=>{
          delete D.prompts[b.dataset.delP]; D.persist(); refresh(); toast("Reset");
        }));
      }
      $("#pTool").addEventListener("change", refresh);
      $("#pSave").addEventListener("click",()=>{
        const tid=$("#pTool").value; const v=$("#pTpl").value.trim();
        if(v) D.prompts[tid]={template:v}; else delete D.prompts[tid];
        D.persist(); refresh(); toast("Prompt saved");
      });
      $("#pReset").addEventListener("click",()=>{ $("#pTpl").value=""; });
      refresh();
    }
    function renderAdminQTemplate(root){
      root.innerHTML = `<p class="muted small">Manage Ask AI response sections, categories, and example questions.</p>
      <h4>Response sections</h4><div id="secList"></div>
      <div class="admin-add"><input id="secName" class="select" placeholder="Section title"><input id="secTag" class="select" placeholder="Tag (e.g. Analysis)"><button class="admin-btn primary" id="addSec">+ Add section</button></div>
      <hr style="margin:18px 0;border-color:var(--line)">
      <h4>Categories</h4><div id="acatList"></div>
      <div class="admin-add"><input id="acatName" class="select" placeholder="Category name"><button class="admin-btn primary" id="addAcat">+ Add category</button></div>
      <hr style="margin:18px 0;border-color:var(--line)">
      <h4>Example questions</h4><textarea id="exTxt" class="select" style="width:100%;min-height:120px;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--bg)" placeholder="One question per line">${esc(D.askExamples.join("\n"))}</textarea>
      <div class="admin-add"><button id="saveEx" class="admin-btn primary">Save examples</button></div>`;
      function drawSec(){
        $("#secList").innerHTML = D.askSections.map((s,i)=>`<div class="admin-tool-row" data-i="${i}"><span>${i+1}</span>
          <div class="row gap" style="flex:1"><input type="text" value="${esc(s.title)}" data-f="title" style="flex:2;padding:8px 10px;border:1px solid var(--line);border-radius:8px"><input type="text" value="${esc(s.tag)}" data-f="tag" style="flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:8px"></div>
          <div class="at-actions"><button class="admin-btn danger" data-del="${i}">Remove</button></div></div>`).join("");
        $$("#secList .admin-tool-row").forEach(r=>{
          const i=+r.dataset.i;
          $$("input",r).forEach(inp=>inp.addEventListener("input",()=>{ D.askSections[i][inp.dataset.f]=inp.value; }));
          $$("input",r).forEach(inp=>inp.addEventListener("blur",()=>{ D.persist(); }));
          $("[data-del]",r).addEventListener("click",()=>{ D.askSections.splice(i,1); D.persist(); drawSec(); });
        });
      }
      function drawAcat(){
        $("#acatList").innerHTML = D.askCategories.map((c,i)=>`<div class="admin-tool-row" data-i="${i}"><span>${i+1}</span>
          <div class="row gap" style="flex:1"><input type="text" value="${esc(c.name)}" data-f="name" style="flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:8px"></div>
          <div class="at-actions"><button class="admin-btn danger" data-del="${i}">Remove</button></div></div>`).join("");
        $$("#acatList .admin-tool-row").forEach(r=>{
          const i=+r.dataset.i;
          $("input",r).addEventListener("input",e=>{ D.askCategories[i].name=e.target.value; });
          $("input",r).addEventListener("blur",()=>D.persist());
          $("[data-del]",r).addEventListener("click",()=>{ D.askCategories.splice(i,1); D.persist(); drawAcat(); });
        });
      }
      drawSec(); drawAcat();
      $("#addSec").addEventListener("click",()=>{
        const n=$("#secName").value.trim(), t=$("#secTag").value.trim(); if(!n||!t)return;
        D.askSections.push({id:"sec-"+uid().slice(-5),title:n,tag:t}); D.persist(); drawSec();
        $("#secName").value=""; $("#secTag").value="";
      });
      $("#addAcat").addEventListener("click",()=>{
        const n=$("#acatName").value.trim(); if(!n)return;
        D.askCategories.push({id:"ac-"+uid().slice(-5),name:n}); D.persist(); drawAcat(); $("#acatName").value="";
      });
      $("#saveEx").addEventListener("click",()=>{
        D.askExamples = $("#exTxt").value.split("\n").map(s=>s.trim()).filter(Boolean);
        D.persist(); toast("Examples saved");
      });
    }
    function renderAdminGuides(root){
      root.innerHTML = `<div id="gList"></div>
      <div class="admin-add"><input id="gTitle" class="select" placeholder="Guide title" style="flex:1"><button class="admin-btn primary" id="gAdd">+ Add Guide</button></div>
      <textarea id="gBody" rows="6" class="select" style="width:100%;margin-top:8px" placeholder="Guide body (supports plain text)"></textarea>`;
      function draw(){
        $("#gList").innerHTML = D.guides.map((g,i)=>`<div class="admin-tool-row"><span>${i+1}</span>
          <input type="text" value="${esc(g.title)}" data-i="${i}" class="select" style="flex:1">
          <div class="at-actions"><button class="admin-btn danger" data-del="${i}">Remove</button></div></div>`).join("");
        $$("#gList input",root).forEach(inp=>inp.addEventListener("change",()=>{
          D.guides[+inp.dataset.i].title=inp.value; D.persist(); toast("Saved");
        }));
        $$("#gList [data-del]",root).forEach(b=>b.addEventListener("click",()=>{
          D.guides.splice(+b.dataset.del,1); D.persist(); draw();
        }));
      }
      draw();
      $("#gAdd").addEventListener("click",()=>{
        const t=$("#gTitle").value.trim(); const b=$("#gBody").value.trim(); if(!t)return;
        D.guides.push({id:uid(),title:t,body:b}); D.persist(); draw();
        $("#gTitle").value=""; $("#gBody").value=""; toast("Added");
      });
    }
    function renderAdminFaqs(root){
      root.innerHTML = `<div id="fList"></div>
      <div class="kv"><label>Question</label><input id="fQ" class="select"></div>
      <div class="kv"><label>Answer</label><textarea id="fA" rows="3" class="select"></textarea></div>
      <button class="admin-btn primary" id="fAdd">+ Add FAQ</button>`;
      function draw(){
        $("#fList").innerHTML = D.faqs.map((f,i)=>`<div class="list-item"><div class="li-icon">${D.icons.info}</div>
          <div class="li-body"><h4>${esc(f.q)}</h4><p>${esc(f.a)}</p></div>
          <div class="li-actions"><button data-del="${i}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg></button></div></div>`).join("");
        $$("#fList [data-del]",root).forEach(b=>b.addEventListener("click",()=>{
          D.faqs.splice(+b.dataset.del,1); D.persist(); draw();
        }));
      }
      draw();
      $("#fAdd").addEventListener("click",()=>{
        const q=$("#fQ").value.trim(), a=$("#fA").value.trim(); if(!q||!a)return;
        D.faqs.push({q,a}); D.persist(); draw(); $("#fQ").value=""; $("#fA").value=""; toast("Added");
      });
    }
    function renderAdminNotices(root){
      root.innerHTML = `<div id="nList"></div>
      <div class="kv"><label>Type</label><select id="nType" class="select"><option value="info">Info</option><option value="tip">Tip</option><option value="warn">Warning</option></select></div>
      <div class="kv"><label>Text</label><input id="nText" class="select"></div>
      <button class="admin-btn primary" id="nAdd">+ Add Notice</button>`;
      function draw(){
        $("#nList").innerHTML = D.notices.map((n,i)=>`<div class="list-item"><div class="li-icon">${D.icons.info}</div>
          <div class="li-body"><b>${esc(n.type)}</b> &mdash; ${esc(n.text)}</div>
          <div class="li-actions"><button data-del="${i}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg></button></div></div>`).join("");
        $$("#nList [data-del]",root).forEach(b=>b.addEventListener("click",()=>{
          D.notices.splice(+b.dataset.del,1); D.persist(); draw();
        }));
      }
      draw();
      $("#nAdd").addEventListener("click",()=>{
        const t=$("#nText").value.trim(), type=$("#nType").value; if(!t)return;
        D.notices.push({id:uid(),type,text:t}); D.persist(); draw(); $("#nText").value=""; toast("Added");
      });
    }
    function renderAdminApi(root){
      root.innerHTML = `<p class="muted small">API keys are stored locally in your browser only. They are never sent to our servers. These keys are placeholders for future integrations — currently the hub works entirely offline.</p>
        <div id="apiList"></div>
        <div class="admin-add"><input id="apiName" class="select" placeholder="Key name"><input id="apiVal" class="select" placeholder="Key value (sk-...)" style="flex:1"><button class="admin-btn primary" id="apiAdd">+ Add / Update</button></div>`;
      function draw(){
        $("#apiList").innerHTML = D.apiKeys.map((k,i)=>`<div class="kv"><label>${esc(k.name)}</label><div class="row gap" style="flex:1"><input type="text" value="${esc(k.value)}" data-i="${i}" class="select" style="flex:1"><button class="admin-btn danger" data-del="${i}">Remove</button></div></div>`).join("");
        $$("#apiList input",root).forEach(inp=>inp.addEventListener("change",()=>{
          D.apiKeys[+inp.dataset.i].value=inp.value; D.persist(); toast("Saved");
        }));
        $$("#apiList [data-del]",root).forEach(b=>b.addEventListener("click",()=>{
          D.apiKeys.splice(+b.dataset.del,1); D.persist(); draw();
        }));
      }
      draw();
      $("#apiAdd").addEventListener("click",()=>{
        const n=$("#apiName").value.trim(),v=$("#apiVal").value.trim(); if(!n)return;
        const exist=D.apiKeys.find(k=>k.name===n);
        if(exist){ exist.value=v; } else D.apiKeys.push({id:uid(),name:n,value:v});
        D.persist(); draw(); $("#apiName").value=""; $("#apiVal").value=""; toast("Saved");
      });
    }
    function renderAdminBanner(root){
      root.innerHTML = `<div class="kv"><label>Banner enabled</label><input type="checkbox" id="bEn" ${D.banner.enabled?"checked":""}></div>
      <div class="kv"><label>Banner text</label><input id="bText" class="select" value="${esc(D.banner.text||"")}"></div>
      <div class="kv"><label>CTA label</label><input id="bCta" class="select" value="${esc(D.banner.cta||"")}"></div>
      <div class="kv"><label>CTA link</label><input id="bLink" class="select" value="${esc(D.banner.link||"")}"></div>
      <button class="admin-btn primary" id="bSave">Save Banner</button>
      <p class="muted small" style="margin-top:12px">Current banner preview:</p>
      <div class="cta-band" id="bPreview"></div>`;
      function pv(){ $("#bPreview").innerHTML=`<div><h2>${esc(D.banner.text||"Banner text")}</h2></div><a class="btn btn-primary">${esc(D.banner.cta||"CTA")}</a>`; } pv();
      $("#bEn").addEventListener("change",e=>{ D.banner.enabled=e.target.checked; pv(); });
      $("#bText").addEventListener("input",e=>{ D.banner.text=e.target.value; pv(); });
      $("#bCta").addEventListener("input",e=>{ D.banner.cta=e.target.value; pv(); });
      $("#bLink").addEventListener("input",e=>{ D.banner.link=e.target.value; });
      $("#bSave").addEventListener("click",()=>{ D.persist(); toast("Banner saved"); });
    }
    function renderAdminFeatured(root){
      root.innerHTML = `<p class="muted small">Toggle which tools appear in the Featured section on the homepage.</p>
        <div id="featList" class="grid grid-4"></div>`;
      function draw(){
        $("#featList").innerHTML = D.tools.map(t=>`<label class="tool-card-mini" style="cursor:pointer"><input type="checkbox" data-id="${t.id}" style="margin-right:8px"${t.featured?" checked":""}><div class="tc-icon">${t.icon}</div><div class="tc-body"><h4 style="margin:0">${esc(t.title)}</h4></div></label>`).join("");
        $$("#featList input",root).forEach(cb=>cb.addEventListener("change",()=>{
          const t=D.tools.find(x=>x.id===cb.dataset.id); t.featured=cb.checked; D.persist();
        }));
      }
      draw();
    }
    function renderAdminFeedback(root){
      if(!D.feedback.length){ root.innerHTML = `<p class="muted">No feedback yet. Feedback can be submitted from the toast or footer links (placeholder).</p>`; return; }
      root.innerHTML = D.feedback.map(f=>{
        const t=D.tools.find(x=>x.id===f.toolId);
        return `<div class="list-item"><div class="li-icon">${D.icons.chat}</div>
          <div class="li-body"><h4>${t?t.title:"General"} — ${f.rating}/5</h4><p>${esc(f.comment||"")}</p><div class="li-meta">${fmtTime(f.ts)}</div></div></div>`;
      }).join("");
    }
  }

  // ===== Little helpers =====
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  // Loading dots animation
  setInterval(()=>{
    $$(".dots").forEach(el=>{
      const n = ((el.textContent.length)+1)%4;
      el.textContent = ".".repeat(n);
    });
  },400);

  // ========== Global error guard (shows user-friendly message) ==========
  window.addEventListener("error", (e)=>{
    const err = $("#errBox");
    if(err){
      err.textContent = "Unexpected error. Please refresh the page. (" + (e.message||"error") + ")";
      err.hidden = false;
    }
    console.error(e);
  });

  // First render — always run (also works when hash is present on initial load)
  render();
  window.addEventListener("load", ()=>{ /* render already called */ });
})();
