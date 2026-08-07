/* YouTube Creator Hub — Data
 * Tools, categories, prompts, Ask AI templates, guides, FAQs, notices.
 * All content here is editable via the Admin Panel and persisted to localStorage.
 */
(function(){
  "use strict";

  // Icons — simple professional SVG paths (stroke based)
  const I = {
    title: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h10M4 17h16"/></svg>',
    desc:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v12H4z"/><path d="M8 10h8M8 14h5"/></svg>',
    tag:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.6-7.6a2 2 0 0 1-.6-1.4V4a1 1 0 0 1 1-1h7.6a2 2 0 0 1 1.4.6l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    hash:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>',
    image: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>',
    text:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5h16v2M9 5v14M13 19H9"/></svg>',
    palette:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="8" r="1"/><circle cx="16" cy="10" r="1"/><path d="M12 21a3 3 0 0 0 3-3c0-1.5-1-2-1-3s1-1 2-1h2a2 2 0 0 0 2-2"/></svg>',
    style: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5M3 18l9 5 9-5"/></svg>',
    bulb:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.4 1 2.3h6c0-.9.3-1.7 1-2.3A7 7 0 0 0 12 2Z"/></svg>',
    hook:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a4 4 0 0 1 8 0v6a3 3 0 1 1-6 0V5"/><path d="M14 6h6v2"/></svg>',
    outro: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V4"/><path d="M4 20h16"/><path d="m8 16 4-4 4 4"/></svg>',
    cta:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>',
    shorts:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="10" height="18" rx="3"/><path d="m11 10 4 2-4 2v-4Z" fill="currentColor" stroke="none"/></svg>',
    script:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l5 5v13a0 0 0 0 1 0 0H6z"/><path d="M14 3v6h6M9 13h6M9 17h6"/></svg>',
    story: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h12a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5Z"/><path d="M8 7h6M8 11h8M8 15h5"/></svg>',
    ghost: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8v12l3-2 3 2 2-2 2 2 3-2 3 2V10a8 8 0 0 0-8-8Z"/><circle cx="9" cy="10" r="1.2"/><circle cx="15" cy="10" r="1.2"/></svg>',
    mosque:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="M4 22V12c0-3 3-5 8-8 5 3 8 5 8 8v10"/><path d="M4 22h16M9 22v-4a3 3 0 0 1 6 0v4"/></svg>',
    laugh: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/></svg>',
    fire:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-3-1 1-3 3-3 6a6 6 0 0 0 12 0c0-5-6-11-6-11Z"/></svg>',
    trend: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17 9 11l4 4 8-8"/><path d="M14 7h7v7"/></svg>',
    key:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/></svg>',
    seo:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/><path d="M8 11h6M11 8v6"/></svg>',
    meter: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16 17 8"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>',
    cal:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    upload:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/></svg>',
    list:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    play:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16l13-8z"/></svg>',
    ch:    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h16"/><circle cx="19" cy="12" r="2"/></svg>',
    sum:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16M4 12h16M4 19h10"/></svg>',
    chat:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    pin:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 3h6l-1 6 4 4H6l4-4-1-6z"/></svg>',
    user:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    info:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>',
    shield:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
    bot:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 4v4M9 13h.01M15 13h.01M9 17h6"/><path d="M2 13h2M20 13h2"/></svg>',
    img2:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 5-5h8l5 5v10l-5 5H8l-5-5z"/><circle cx="9" cy="11" r="1.5"/></svg>',
    video: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8z"/></svg>',
    mic:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    cc:    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 10a2 2 0 0 0-2 2 2 2 0 0 0 2 2M15 10a2 2 0 0 0-2 2 2 2 0 0 0 2 2"/></svg>',
    stt:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v4a3 3 0 0 0 6 0V3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3M9 21h6"/></svg>',
    tts:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5v14l8-7-8-7Z"/><path d="M15 9a3 3 0 0 1 0 6M18 6a7 7 0 0 1 0 12"/></svg>',
    bn_en: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h7M5 12h9M4 18h6M14 6l6 12M15 14h6"/></svg>',
    en_bn: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M5 12h7M4 18h6M14 6l6 12M15 14h6"/></svg>',
    dollar:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    notes: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h12l4 4v10a2 2 0 0 1-2 2H4z"/><path d="M14 5v5h5M8 13h8M8 17h5"/></svg>',
    dash:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7" height="9" rx="1"/><rect x="14" y="4" width="7" height="5" rx="1"/><rect x="14" y="11" width="7" height="9" rx="1"/><rect x="3" y="15" width="7" height="5" rx="1"/></svg>'
  };

  // Default category list
  const DEFAULT_CATEGORIES = [
    { id:"meta", name:"Metadata (Title/Desc/Tags)", icon:I.seo },
    { id:"hashtag", name:"Tags & Hashtags", icon:I.hash },
    { id:"thumb", name:"Thumbnails", icon:I.image },
    { id:"script", name:"Scripts & Writing", icon:I.script },
    { id:"story", name:"Stories", icon:I.story },
    { id:"ideas", name:"Ideas & Trends", icon:I.bulb },
    { id:"seo", name:"SEO & Analytics", icon:I.meter },
    { id:"plan", name:"Planning & Upload", icon:I.cal },
    { id:"community", name:"Community & Channel", icon:I.chat },
    { id:"intros", name:"Intros & Outros", icon:I.play },
    { id:"ai-prompts", name:"AI Prompts", icon:I.bot },
    { id:"media", name:"Subtitles & Audio", icon:I.cc },
    { id:"translate", name:"Translate", icon:I.bn_en },
    { id:"calc", name:"Calculators", icon:I.dollar },
    { id:"misc", name:"Creator Tools", icon:I.dash }
  ];

  // Default tool list (50 tools)
  // bangla: short Bangla description
  const DEFAULT_TOOLS = [
    { id:"ai-title",        title:"AI Title Generator",                 cat:"meta",      icon:I.title,  bangla:"আপনার ভিডিওর জন্য ক্লিক-বাইট বা প্রফেশনাল ক্লিকযোগ্য টাইটেল তৈরি করুন।", featured:true },
    { id:"ai-desc",         title:"AI Description Generator",           cat:"meta",      icon:I.desc,   bangla:"SEO-ফ্রেন্ডলি ভিডিও বিবরণ লিখুন যা র‍্যাঙ্ক ও দর্শক ধরে রাখে।", featured:true },
    { id:"ai-tags",         title:"AI Tags Generator",                  cat:"hashtag",   icon:I.tag,    bangla:"র‍্যাঙ্ক করার জন্য প্রাসঙ্গিক ট্যাগের লিস্ট বানান।" },
    { id:"ai-hashtag",      title:"AI Hashtag Generator",               cat:"hashtag",   icon:I.hash,   bangla:"শর্টস ও সোশ্যাল শেয়ারের জন্য হ্যাশট্যাগ বাছাই করুন।" },
    { id:"thumb-prompt",    title:"Thumbnail Prompt Generator",         cat:"thumb",     icon:I.image,  bangla:"AI ইমেজ জেনারেটরের জন্য প্রফেশনাল থাম্বনেইল প্রম্পট তৈরি করুন।", featured:true },
    { id:"thumb-text",      title:"Thumbnail Text Generator",           cat:"thumb",     icon:I.text,   bangla:"থাম্বনেইলে বসানোর মতো ছোট, চুম্বক-স্টাইল টেক্সট লিখুন।" },
    { id:"thumb-color",     title:"Thumbnail Color Suggestion",         cat:"thumb",     icon:I.palette,bangla:"বেশি ক্লিক পেতে আকর্ষণীয় কালার কম্বিনেশন পান।" },
    { id:"thumb-style",     title:"Thumbnail Style Generator",          cat:"thumb",     icon:I.style,  bangla:"আপনার নিচের জন্য ইউনিক থাম্বনেইল স্টাইল আইডিয়া নিন।" },
    { id:"thumb-idea",      title:"Thumbnail Idea Generator",           cat:"thumb",     icon:I.bulb,   bangla:"ভাইরাল হওয়ার মতো থাম্বনেইল কনসেপ্ট ও কনফ্লিক্ট আইডিয়া।" },
    { id:"hook",            title:"Hook Generator",                     cat:"script",    icon:I.hook,   bangla:"প্রথম ৩ সেকেন্ডে দর্শক ধরে রাখার শক্তিশালী হুক লাইন।", featured:true },
    { id:"outro",           title:"Outro Generator",                    cat:"intros",    icon:I.outro,  bangla:"ভিডিও শেষে সাবস্ক্রাইব ও পরের ভিডিওতে নেওয়ার আউটরো স্ক্রিপ্ট।" },
    { id:"cta",             title:"CTA Generator",                      cat:"intros",    icon:I.cta,    bangla:"লাইক, কমেন্ট, শেয়ার, সাবস্ক্রাইবের কল-টু-অ্যাকশন লাইন।" },
    { id:"shorts-script",   title:"Shorts Script Generator",            cat:"script",    icon:I.shorts, bangla:"১৫–৬০ সেকেন্ডের শর্টসের জন্য দ্রুতগতির স্ক্রিপ্ট।", featured:true },
    { id:"long-script",     title:"Long Script Generator",              cat:"script",    icon:I.script, bangla:"দীর্ঘ ভিডিওর জন্য কাঠামোবদ্ধ স্ক্রিপ্ট তৈরি করুন।" },
    { id:"story",           title:"Story Generator",                    cat:"story",     icon:I.story,  bangla:"আকর্ষণীয় গল্প তৈরি করুন যা দর্শককে শেষ পর্যন্ত দেখায়।" },
    { id:"horror-story",    title:"Horror Story Generator",             cat:"story",     icon:I.ghost,  bangla:"রোমাঞ্চকর ভৌতিক গল্প, টুইস্ট ও সাসপেন্সসহ।" },
    { id:"islamic-story",   title:"Islamic Story Generator",            cat:"story",     icon:I.mosque, bangla:"শিক্ষণীয় ও নৈতিক ইসলামিক কাহিনি ও কিসসা।" },
    { id:"funny-story",     title:"Funny Story Generator",              cat:"story",     icon:I.laugh,  bangla:"হাস্যরসাত্মক স্কিট ও ফানি স্টোরি আইডিয়া।" },
    { id:"motivation-story",title:"Motivation Story Generator",         cat:"story",     icon:I.fire,   bangla:"অনুপ্রেরণামূলক গল্প যা দর্শককে এগিয়ে যেতে উৎসাহ দেয়।" },
    { id:"video-idea",      title:"Video Idea Generator",               cat:"ideas",     icon:I.bulb,   bangla:"আপনার নিচের জন্য কখনো না শেষ হওয়া ভিডিও আইডিয়া।", featured:true },
    { id:"trending-topic",  title:"Trending Topic Finder",              cat:"ideas",     icon:I.trend,  bangla:"এই মুহূর্তের ট্রেন্ডিং টপিক ও ভাইরাল অ্যাঙ্গেল খুঁজুন।" },
    { id:"keyword-research",title:"Keyword Research",                   cat:"seo",       icon:I.key,    bangla:"র‍্যাঙ্ক করার জন্য ভলিউম ও ইন্টেন্টসহ কী-ওয়ার্ড তালিকা।" },
    { id:"seo-analyzer",    title:"SEO Analyzer",                       cat:"seo",       icon:I.seo,    bangla:"আপনার টাইটেল/ডিসক্রিপশন/ট্যাগ SEO-এর দিক থেকে বিশ্লেষণ করুন।" },
    { id:"seo-score",       title:"SEO Score Checker",                  cat:"seo",       icon:I.meter,  bangla:"০–১০০ স্কোরে ভিডিওর SEO সমস্যা ও সমাধান দেখুন।" },
    { id:"yt-checklist",    title:"YouTube Checklist",                  cat:"plan",      icon:I.check,  bangla:"আপলোডের আগে অবশ্যই মেনে চলার প্রি-লাইভ চেকলিস্ট।" },
    { id:"upload-planner",  title:"Upload Planner",                     cat:"plan",      icon:I.upload, bangla:"শিরোনাম, থাম্ব, ট্যাগ, সময়—সব আপলোড পরিকল্পনা এক জায়গায়।" },
    { id:"content-cal",     title:"Content Calendar",                   cat:"plan",      icon:I.cal,    bangla:"সাপ্তাহিক/মাসিক পোস্টিং সূচি ও প্ল্যান তৈরি করুন।" },
    { id:"playlist-plan",   title:"Playlist Planner",                   cat:"plan",      icon:I.list,   bangla:"প্লে-লিস্টের নাম, বর্ণনা ও ভিডিও সিকোয়েন্স প্ল্যান করুন।" },
    { id:"chapters",        title:"Video Chapter Generator",            cat:"plan",      icon:I.ch,     bangla:"টাইমস্ট্যাম্পসহ প্রফেশনাল চ্যাপ্টার তৈরি করুন।" },
    { id:"summary",         title:"Video Summary Generator",            cat:"meta",      icon:I.sum,    bangla:"লম্বা ভিডিও বা স্ক্রিপ্টের সংক্ষিপ্ত সারাংশ।" },
    { id:"community-post",  title:"Community Post Generator",           cat:"community", icon:I.chat,   bangla:"পোল, ইমেজ, আপডেট—কমিউনিটি পোস্ট কপি তৈরি করুন।" },
    { id:"pinned-comment",  title:"Pinned Comment Generator",           cat:"community", icon:I.pin,    bangla:"ভিডিওর নিচে পিন করার মতো এনগেজিং কমেন্ট।" },
    { id:"channel-bio",     title:"Channel Bio Generator",              cat:"community", icon:I.user,   bangla:"চ্যানেলের শর্ট বায়ো/ট্যাগলাইন লিখুন।" },
    { id:"about",           title:"About Section Generator",            cat:"community", icon:I.info,   bangla:"চ্যানেলের About পেজের জন্য প্রফেশনাল টেক্সট।" },
    { id:"intro",           title:"Video Intro Generator",              cat:"intros",    icon:I.play,   bangla:"ভিডিওর শুরুতে বলার মতো সংক্ষিপ্ত ইন্ট্রো লাইন।" },
    { id:"video-outro-gen", title:"Video Outro Generator",              cat:"intros",    icon:I.outro,  bangla:"ভিডিও শেষের প্রফেশনাল ক্লোজিং ও CTA প্ল্যান।" },
    { id:"copyright-tips",  title:"Copyright Safety Tips",              cat:"misc",      icon:I.shield, bangla:"কপিরাইট স্ট্রাইক এড়াতে প্রয়োজনীয় টিপস ও নিয়ম।" },
    { id:"ai-prompt-gen",   title:"AI Prompt Generator",                cat:"ai-prompts",icon:I.bot,    bangla:"ChatGPT/Midjourney-এর মতো AI-এর জন্য শক্তিশালী প্রম্পট তৈরি করুন।" },
    { id:"image-prompt",    title:"Image Prompt Generator",             cat:"ai-prompts",icon:I.img2,   bangla:"AI ইমেজ জেনারেটরের জন্য বিস্তারিত প্রম্পট।" },
    { id:"img2vid-prompt",  title:"Image-to-Video Prompt Generator",    cat:"ai-prompts",icon:I.video,  bangla:"স্ট্যাটিক ছবিকে ভিডিওতে রূপান্তরের প্রম্পট।" },
    { id:"voice-script",    title:"AI Voice Script Generator",          cat:"media",    icon:I.mic,    bangla:"AI ভয়েস-ওভারের জন্য সাবলীল স্ক্রিপ্ট।" },
    { id:"subtitle",        title:"Subtitle Generator",                 cat:"media",    icon:I.cc,     bangla:"SRT-স্টাইল সাবটাইটেল ও ক্যাপশন তৈরি করুন।" },
    { id:"stt",             title:"Speech To Text",                     cat:"media",    icon:I.stt,    bangla:"অডিও/ভয়েসকে টেক্সটে রূপান্তর করার জন্য স্ট্রাকচার্ড আউটপুট।" },
    { id:"tts",             title:"Text To Speech",                     cat:"media",    icon:I.tts,    bangla:"TTS-এর জন্য ভয়েস সেটিংসসহ স্ক্রিপ্ট ও টিপস।" },
    { id:"bn2en",           title:"Bangla To English",                  cat:"translate",icon:I.bn_en,  bangla:"বাংলা টেক্সটকে প্রাকৃতিক ইংরেজিতে অনুবাদ করুন।" },
    { id:"en2bn",           title:"English To Bangla",                  cat:"translate",icon:I.en_bn,  bangla:"ইংরেজি টেক্সটকে সাবলীল বাংলায় অনুবাদ করুন।" },
    { id:"earn-calc",       title:"YouTube Earnings Calculator",        cat:"calc",     icon:I.dollar, bangla:"ভিউ, CPM ও RPM অনুযায়ী আনুমানিক ইনকাম হিসাব।", featured:true },
    { id:"length-est",      title:"Video Length Estimator",             cat:"calc",     icon:I.clock,  bangla:"স্ক্রিপ্ট দেখে ভিডিও কত মিনিট হবে তা অনুমান করুন।" },
    { id:"notes",           title:"Creator Notes",                      cat:"misc",     icon:I.notes,  bangla:"দ্রুত আইডিয়া, স্ক্রিপ্ট লাইন ও চেকলিস্ট রাখার জন্য নোটপ্যাড।" },
    { id:"dashboard",       title:"Creator Toolbox Dashboard",          cat:"misc",     icon:I.dash,   bangla:"এক নজরে আপনার সংরক্ষিত, ফেভারিট ও সাম্প্রতিক টুল ব্যবহার।" }
  ];

  // Default AI system prompt per tool
  function makePrompt(tool, lang, tone){
    const topic = "{TOPIC}";
    const base = `You are a senior YouTube growth strategist and professional copywriter. Generate high-quality, platform-optimized content for the tool "${tool.title}" based on the user's topic: "${topic}". Follow these rules:
- Tone: ${tone}
- Output language: ${lang === "bn" ? "Bangla (Bengali script)" : lang === "mix" ? "Mix of English and Bangla" : "English"}
- Be specific, practical, and ready-to-copy.
- Avoid clichés and generic phrases.
- Use numbered or bulleted lists where helpful.
- Include short, punchy variations where appropriate.
Tool-specific instruction: ${toolPrompt(tool.id)}
Now produce the output in a clean, well-structured format with clear headings.`;
    return base;
  }

  function toolPrompt(id){
    switch(id){
      case "ai-title": return "Write 10 clickable YouTube titles under 70 characters. Mix curiosity, urgency, numbers, and clear value. Flag the best 3.";
      case "ai-desc": return "Write a 200-300 word description with the first 2 lines hook, timestamps placeholders, CTAs, and 10-15 keywords naturally included. End with channel subscribe CTA.";
      case "ai-tags": return "Generate 20-30 tags ordered by relevance. Mix broad, long-tail, and exact-match tags. Include a core tag first.";
      case "ai-hashtag": return "Generate 15-25 relevant hashtags: 3-5 broad, 7-10 niche, 5-10 hyper-niche. Avoid spam.";
      case "thumb-prompt": return "Write 5 detailed Midjourney/Stable Diffusion-style thumbnail prompts. Include subject, expression, composition, lighting, colors, text placement, style keywords (cinematic, high contrast, close-up).";
      case "thumb-text": return "Give 10 short 1-4 word thumbnail text options that contrast with visuals and amplify curiosity.";
      case "thumb-color": return "Suggest 5 thumbnail color palettes with hex codes, stating the mood and why they stand out in feeds.";
      case "thumb-style": return "Describe 5 distinct thumbnail styles (e.g., face close-up with arrow, split screen, reaction face, big text minimal, bold gradient), with when to use each.";
      case "thumb-idea": return "Suggest 8 thumbnail concepts including emotion, conflict, before/after, and object close-ups. Describe the exact visual.";
      case "hook": return "Write 12 strong opening hooks under 12 words each (question, shock, fact, story-start, direct address).";
      case "outro": return "Write 3 outro scripts (15-30 sec) asking for subscribe, like, next-video tease, notification bell.";
      case "cta": return "Write 10 varied CTA lines for like, comment, share, subscribe and bell, plus a pinned-comment CTA.";
      case "shorts-script": return "Write a 30-60 second Shorts script with: Hook (0-3s), Payoff tease (3-8s), Main content (8-45s), CTA (45-60s). Include on-screen text suggestions.";
      case "long-script": return "Write a 8-12 minute long-form script with Intro, Sections (3-5 points), examples/tips, transitions, and Outro CTA.";
      case "story": return "Write a 3-act compelling story with a relatable protagonist, conflict, turning point, resolution and lesson.";
      case "horror-story": return "Write a 2-3 minute horror story with build-up, suspense, twist and chilling closing line. Avoid gore.";
      case "islamic-story": return "Write a respectful Islamic story with a moral, drawing on general prophetic wisdom values. Keep it warm, respectful, and suitable for all ages.";
      case "funny-story": return "Write a 1-2 minute relatable funny story/skit with setup, punchlines (3 beats), and a tagline ending.";
      case "motivation-story": return "Write a motivational underdog-style story with struggle, low point, breakthrough, life lesson and call to action.";
      case "video-idea": return "Generate 12 video ideas with hook, angle, format (tutorial/listicle/reaction/story), and why it works on YouTube.";
      case "trending-topic": return "Suggest 10 trending topic angles for the niche in 2026 with examples, keywords, and content formats.";
      case "keyword-research": return "Provide 20 keywords grouped as seed, long-tail, questions, and comparison. Include estimated difficulty (low/med/high) and intent.";
      case "seo-analyzer": return "Pretend to analyze typical SEO for this topic. Provide strengths, weaknesses, title/desc/tag improvements in a checklist.";
      case "seo-score": return "Provide an SEO checklist scoring title, desc, tags, thumbnail, hook, retention cues, chapters, end screen. Estimate score 0-100 with fixes.";
      case "yt-checklist": return "Produce a complete upload checklist: pre-upload, upload settings, thumbnail, metadata, end screen, cards, captions, publish-time analysis.";
      case "upload-planner": return "Create a structured upload plan: title options, desc draft, tag list, thumbnail plan, publish time, end-screen links.";
      case "content-cal": return "Create a 4-week content calendar with 3 videos/week: date, topic, format, status, notes.";
      case "playlist-plan": return "Suggest 5 playlists for the niche with titles, descriptions, and 10 video ideas sequenced for binge.";
      case "chapters": return "Generate YouTube-friendly chapters with timestamps (0:00 Intro ...), descriptive titles, 5-8 chapters.";
      case "summary": return "Write a 100-150 word structured summary with 3 key takeaways for viewers to copy into description.";
      case "community-post": return "Write 5 community post variations: poll, question, behind-the-scenes, teaser, thank-you post.";
      case "pinned-comment": return "Write 5 pinned comment options that encourage replies, cover a key question, and link to another video/playlist.";
      case "channel-bio": return "Write 5 short bios (under 150 chars) and 3 taglines for the channel niche.";
      case "about": return "Write a full About section: welcome, value proposition, upload schedule, socials, business email, and subscriber CTA.";
      case "intro": return "Write 10 short intros (5-15 sec) with a hook and brand intro.";
      case "video-outro-gen": return "Write a memorable outro script with recap, CTA, next-video tease, and sign-off line.";
      case "copyright-tips": return "Provide 15 practical copyright safety tips: music, footage, fair use, claims, public domain, royalty-free sources.";
      case "ai-prompt-gen": return "Write 10 advanced ChatGPT/AI prompts tailored for YouTube creators working on this topic. Use role, task, constraints, format.";
      case "image-prompt": return "Write 6 detailed image prompts with style, subject, camera, lighting, mood, negative prompts, aspect ratio.";
      case "img2vid-prompt": return "Write 5 Runway/Pika-style image-to-video prompts with motion, camera movement, duration, mood, transitions.";
      case "voice-script": return "Write a 1-minute voiceover script with natural pauses [pause], emphasis words, and tone marks for AI narration.";
      case "subtitle": return "Generate a clean subtitle template with 8-12 cue lines in SRT-style format (sequential timings) and caption best practices.";
      case "stt": return "Provide a transcription template with speaker labels, punctuation tips, and cleaning steps for STT output.";
      case "tts": return "Provide a TTS-ready script with SSML-like emphasis marks, pace guidance, and voice style recommendation.";
      case "bn2en": return "Translate the given Bangla text into natural, modern English while preserving tone and meaning.";
      case "en2bn": return "Translate the given English text into natural, colloquial Bangla (Bengali script) while preserving tone.";
      case "earn-calc": return "This tool uses a calculator. Provide explanation of the result and 5 tips to increase RPM.";
      case "length-est": return "Estimate the video length from the script word count (English ~150 wpm, Bangla ~130 wpm), giving time breakdown.";
      case "notes": return "This tool is a freeform notepad. Provide starter note template.";
      case "dashboard": return "Show dashboard summary of saved/favorites/history counts (handled by UI).";
      default: return "Produce clear, useful output for a YouTube creator.";
    }
  }

  // Ask AI — response sections
  const ASK_SECTIONS = [
    { id:"problem",   title:"Problem Analysis",  tag:"Analysis" },
    { id:"reasons",   title:"Main Reasons",      tag:"Diagnosis" },
    { id:"solution",  title:"Step-by-step Solution", tag:"Action Plan" },
    { id:"mistakes",  title:"Common Mistakes",   tag:"Watch Out" },
    { id:"tips",      title:"Advanced Tips",     tag:"Pro" },
    { id:"resources", title:"Useful Resources",  tag:"Learn" },
    { id:"related",   title:"Related Tools",     tag:"Try These" }
  ];

  const ASK_CATEGORIES = [
    { id:"views",     name:"Low Views / No Views" },
    { id:"subs",      name:"Subscribers Growth" },
    { id:"ctr",       name:"CTR & Thumbnails" },
    { id:"retention", name:"Audience Retention" },
    { id:"monetize",  name:"Monetization & Earnings" },
    { id:"seo",       name:"SEO & Ranking" },
    { id:"shorts",    name:"Shorts Growth" },
    { id:"copyright", name:"Copyright & Strikes" },
    { id:"niche",     name:"Niche & Branding" },
    { id:"algorithm", name:"Algorithm Questions" },
    { id:"other",     name:"Other" }
  ];

  const ASK_EXAMPLES = [
    "My YouTube channel gets no views.",
    "How do I get my first 1000 subscribers?",
    "My Shorts get views but long-form does not.",
    "My CTR is below 2%, how do I improve?",
    "How long until monetization?",
    "How do I avoid copyright strikes?",
    "What is the best upload schedule?",
    "How do I find a profitable niche?",
    "Why is my audience retention dropping at 30 seconds?",
    "How do I make viral thumbnails?"
  ];

  const DEFAULT_GUIDES = [
    { id:"g1", title:"Complete YouTube SEO Guide (2026)", body:"Covers title, description, tags, chapters, thumbnails, retention, and CTR fundamentals." },
    { id:"g2", title:"Shorts Algorithim Explained", body:"How hooks, swipe-away rate, and rewatch loops determine Shorts reach." },
    { id:"g3", title:"Monetization Requirements", body:"1,000 subs + 4,000 watch hours for YPP, plus Shorts ad revenue and affiliate tips." }
  ];

  const DEFAULT_FAQS = [
    { q:"Is this hub free?", a:"Yes. All 50 tools are free to use in your browser. Your data is stored locally." },
    { q:"Do I need an API key?", a:"No. The tools work offline with a built-in response engine. Admin panel allows adding your own API key for future integration." },
    { q:"Is my saved data private?", a:"Yes. History, favorites and saves live in your browser only." }
  ];

  const DEFAULT_NOTICES = [
    { id:"n1", type:"info", text:"New: Ask AI premium section now provides structured YouTube growth answers." },
    { id:"n2", type:"tip",  text:"Tip: Favorite your most-used tools for one-click access from Favorites." }
  ];

  const DEFAULT_BANNER = {
    enabled:true,
    text:"Grow faster with 50+ AI tools for YouTube creators.",
    cta:"Try Ask AI",
    link:"#/ask-ai"
  };

  const DEFAULT_API_KEYS = [
    { id:"openai",  name:"OpenAI API Key",  value:"" },
    { id:"gemini",  name:"Google Gemini Key", value:"" },
    { id:"pexels",  name:"Pexels API Key", value:"" }
  ];

  // ---- LocalStorage persistence wrapper ----
  const LS_KEY = "yt_hub_v1";
  function loadState(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(e){ return null; }
  }
  function saveState(state){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){}
  }

  const state = loadState() || {};
  const DATA = {
    tools: state.tools || DEFAULT_TOOLS.slice(),
    categories: state.categories || DEFAULT_CATEGORIES.slice(),
    prompts: state.prompts || {}, // overrides per tool
    askSections: state.askSections || ASK_SECTIONS.slice(),
    askCategories: state.askCategories || ASK_CATEGORIES.slice(),
    askExamples: state.askExamples || ASK_EXAMPLES.slice(),
    guides: state.guides || DEFAULT_GUIDES.slice(),
    faqs: state.faqs || DEFAULT_FAQS.slice(),
    notices: state.notices || DEFAULT_NOTICES.slice(),
    banner: state.banner || Object.assign({}, DEFAULT_BANNER),
    apiKeys: state.apiKeys || DEFAULT_API_KEYS.slice(),
    history: state.history || [],     // {id, toolId, title, input, output, ts}
    saved: state.saved || [],         // {id, toolId, title, input, output, ts}
    favorites: state.favorites || [], // array of toolIds
    feedback: state.feedback || []    // {toolId, rating, comment, ts}
  };

  DATA.persist = function(){
    saveState({
      tools: DATA.tools,
      categories: DATA.categories,
      prompts: DATA.prompts,
      askSections: DATA.askSections,
      askCategories: DATA.askCategories,
      askExamples: DATA.askExamples,
      guides: DATA.guides,
      faqs: DATA.faqs,
      notices: DATA.notices,
      banner: DATA.banner,
      apiKeys: DATA.apiKeys,
      history: DATA.history.slice(-200),
      saved: DATA.saved.slice(-200),
      favorites: DATA.favorites,
      feedback: DATA.feedback.slice(-200)
    });
  };

  DATA.makePromptFor = function(tool, lang, tone){
    return (DATA.prompts[tool.id] && DATA.prompts[tool.id].template) || makePrompt(tool, lang, tone);
  };
  DATA.getToolPromptInstruction = toolPrompt;
  DATA.icons = I;

  // expose
  window.YTHUB_DATA = DATA;
})();
