/* ============================================================
   YouTube Creator Hub — Tool & Category Data
   48 distinct tools, each with a unique purpose-built input
   schema (defined in toolfields.js) and its own system prompt.
   ============================================================ */
(function(){
  "use strict";

  // ---- Icons (inline SVG paths, stroke-based, B/W/Y theme) ----
  const I = {
    title:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h10M4 17h16"/></svg>',
    desc:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v12H4z"/><path d="M8 10h8M8 14h5"/></svg>',
    tag:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.6-7.6a2 2 0 0 1-.6-1.4V4a1 1 0 0 1 1-1h7.6a2 2 0 0 1 1.4.6l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    hash:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>',
    script:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l5 5v13a0 0 0 0 1 0 0H6z"/><path d="M14 3v6h6M9 13h6M9 17h6"/></svg>',
    shorts:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="10" height="18" rx="3"/><path d="m11 10 4 2-4 2v-4Z" fill="currentColor" stroke="none"/></svg>',
    hook:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a4 4 0 0 1 8 0v6a3 3 0 1 1-6 0V5"/><path d="M14 6h6v2"/></svg>',
    structure:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    cta:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>',
    chapters:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h16"/><circle cx="19" cy="12" r="2"/></svg>',
    voice:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    mic:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4a3 3 0 0 0 6 0V3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3M9 21h6"/></svg>',
    image:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>',
    thumb:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8 8 3h8l5 5v10l-5 5H8l-5-5z"/><circle cx="9" cy="11" r="1.5"/></svg>',
    cal:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    idea:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.4 1 2.3h6c0-.9.3-1.7 1-2.3A7 7 0 0 0 12 2Z"/></svg>',
    trend:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17 9 11l4 4 8-8"/><path d="M14 7h7v7"/></svg>',
    chart:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h16"/></svg>',
    community:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    comment:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3 8.7 8.7 0 0 1-3.5-.7L3 21l1.8-5.5a8.2 8.2 0 0 1-.8-4A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z"/></svg>',
    pin:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 3h6l-1 6 4 4H6l4-4-1-6z"/></svg>',
    dollar:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    clock:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    growth:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-6M12 6V4M4 20h16"/><circle cx="12" cy="10" r="2"/><path d="m5 16 4-4M19 16l-4-4"/></svg>',
    camera:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8z"/></svg>',
    check:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>',
    link:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
    globe:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/></svg>',
    translate:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h7M5 12h9M4 18h6M14 6l6 12M15 14h6"/></svg>',
    cc:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 10a2 2 0 0 0-2 2 2 2 0 0 0 2 2M15 10a2 2 0 0 0-2 2 2 2 0 0 0 2 2"/></svg>',
    bot:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 4v4M9 13h.01M15 13h.01M9 17h6"/><path d="M2 13h2M20 13h2"/></svg>',
    email:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    gift:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4"/><path d="M12 8v13M5 8v13h14V8M7 8a3 3 0 0 1 0-6c2 0 3 2 5 6m0 0c2-4 3-6 5-6a3 3 0 0 1 0 6"/></svg>',
    list:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    gear:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    sparkle:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 9.2 8.6 2 9.3l5.5 4.7L5.8 21 12 17.3 18.2 21l-1.7-7 5.5-4.7-7.2-.7L12 2Z"/></svg>',
    file:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    outro:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V4"/><path d="M4 20h16"/><path d="m8 16 4-4 4 4"/></svg>',
    sum:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16M4 12h16M4 19h10"/></svg>',
    key:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/></svg>',
    ratio:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>'
  };

  // ---- Categories (with accent colors) ----
  const CATEGORIES = [
    { id:"titles", name:"Titles & Metadata", icon:I.title, color:"#f5a623" },
    { id:"script", name:"Scripts & Content", icon:I.script, color:"#06b6d4" },
    { id:"audio", name:"Audio & Voice", icon:I.voice, color:"#d946ef" },
    { id:"visual", name:"Thumbnails & Visuals", icon:I.thumb, color:"#f97316" },
    { id:"growth", name:"Growth & Strategy", icon:I.trend, color:"#10b981" },
    { id:"community", name:"Engagement & Community", icon:I.community, color:"#ef4444" },
    { id:"money", name:"Monetization & Business", icon:I.dollar, color:"#84cc16" },
    { id:"repurpose", name:"Repurposing & Multi-platform", icon:I.link, color:"#8b5cf6" },
    { id:"calc", name:"Calculators", icon:I.dollar, color:"#6366f1" },
    { id:"production", name:"Planning & Production", icon:I.camera, color:"#14b8a6" },
    { id:"translate", name:"Translation & Accessibility", icon:I.translate, color:"#0ea5e9" },
    { id:"ai", name:"Ask AI", icon:I.bot, color:"#000000" }
  ];

  // ---- Tools ----
  const TOOLS = [
    // TITLES & METADATA
    { id:"title-gen", title:"Title Generator", cat:"titles", icon:I.title, bangla:"ভিডিওর জন্য ক্লিকযোগ্য টাইটেল", featured:true },
    { id:"desc-gen", title:"Description Generator", cat:"titles", icon:I.desc, bangla:"SEO-ফ্রেন্ডলি ভিডিও বিবরণ", featured:true },
    { id:"tag-gen", title:"Tag Generator", cat:"titles", icon:I.tag, bangla:"র‍্যাংকের জন্য প্রাসঙ্গিক ট্যাগ" },
    { id:"hashtag-gen", title:"Hashtag Generator", cat:"titles", icon:I.hash, bangla:"শর্টস ও সোশ্যাল হ্যাশট্যাগ" },
    { id:"seo-keywords", title:"SEO Keyword Research", cat:"titles", icon:I.key, bangla:"কী-ওয়ার্ড রিসার্চ" },
    { id:"ab-title", title:"A/B Title Tester", cat:"titles", icon:I.ratio, bangla:"দুটি টাইটেল তুলনা করুন" },

    // SCRIPTING & CONTENT
    { id:"long-script", title:"Long-Form Script Generator", cat:"script", icon:I.script, bangla:"দীর্ঘ ভিডিও স্ক্রিপ্ট", featured:true },
    { id:"shorts-script", title:"Shorts Script Generator", cat:"script", icon:I.shorts, bangla:"শর্টস স্ক্রিপ্ট", featured:true },
    { id:"hook-gen", title:"Video Hook Generator", cat:"script", icon:I.hook, bangla:"শক্তিশালী হুক লাইন" },
    { id:"outline-gen", title:"Video Outline Generator", cat:"script", icon:I.structure, bangla:"বিট-বাই-বিট আউটলাইন" },
    { id:"cta-gen", title:"Call-to-Action Generator", cat:"script", icon:I.cta, bangla:"CTA লাইন" },
    { id:"chapter-gen", title:"Chapter Generator", cat:"script", icon:I.chapters, bangla:"টাইমস্ট্যাম্প চ্যাপ্টার" },

    // AUDIO & VOICE
    { id:"tts", title:"Text to Speech", cat:"audio", icon:I.voice, bangla:"টেক্সট পড়ে শোনান", featured:true },
    { id:"stt-mic", title:"Speech to Text (Mic)", cat:"audio", icon:I.mic, bangla:"মাইক্রোফোন দিয়ে লিখুন" },
    { id:"stt-file", title:"Speech to Text (File)", cat:"audio", icon:I.file, bangla:"অডিও ফাইল ট্রান্সক্রিপ্ট" },
    { id:"pacing-check", title:"Voiceover Pacing Checker", cat:"audio", icon:I.clock, bangla:"বক্তব্যের সময় হিসাব" },

    // VISUAL & THUMBNAIL
    { id:"thumb-idea", title:"Thumbnail Idea Generator", cat:"visual", icon:I.thumb, bangla:"থাম্বনেইল কনসেপ্ট", featured:true },
    { id:"thumb-text", title:"Thumbnail Text Overlay", cat:"visual", icon:I.image, bangla:"থাম্বনেইলে টেক্সট" },
    { id:"image-prompt", title:"Image Prompt Generator", cat:"visual", icon:I.image, bangla:"AI ইমেজ প্রম্পট" },
    { id:"banner-concepts", title:"Channel Banner Concepts", cat:"visual", icon:I.ratio, bangla:"ব্যানার ডিজাইন কনসেপ্ট" },

    // GROWTH & STRATEGY
    { id:"content-cal", title:"Content Calendar Generator", cat:"growth", icon:I.cal, bangla:"৪-সপ্তাহের কন্টেন্ট প্ল্যান", featured:true },
    { id:"video-ideas", title:"Video Idea Generator", cat:"growth", icon:I.idea, bangla:"১০টি ভিডিও আইডিয়া" },
    { id:"trending-finder", title:"Trending Topic Finder", cat:"growth", icon:I.trend, bangla:"ট্রেন্ডিং অ্যাঙ্গেল" },
    { id:"competitor-analyzer", title:"Competitor Analysis Helper", cat:"growth", icon:I.chart, bangla:"প্রতিযোগী বিশ্লেষণ" },
    { id:"niche-finder", title:"Niche Finder", cat:"growth", icon:I.idea, bangla:"উপযুক্ত নিচ খুঁজুন" },
    { id:"community-post", title:"Community Post Generator", cat:"growth", icon:I.community, bangla:"কমিউনিটি পোস্ট" },

    // ENGAGEMENT & COMMUNITY
    { id:"comment-reply", title:"Comment Reply Generator", cat:"community", icon:I.comment, bangla:"কমেন্টের জবাব" },
    { id:"pinned-comment", title:"Pinned Comment Generator", cat:"community", icon:I.pin, bangla:"পিন করা কমেন্ট" },
    { id:"live-title", title:"Live Stream Title & Desc", cat:"community", icon:I.camera, bangla:"লাইভ টাইটেল ও বিবরণ" },
    { id:"poll-gen", title:"Poll Question Generator", cat:"community", icon:I.community, bangla:"পোল প্রশ্ন" },

    // MONETIZATION & BUSINESS
    { id:"sponsor-email", title:"Sponsorship Pitch Email", cat:"money", icon:I.email, bangla:"স্পনসর পিচ ইমেইল" },
    { id:"media-kit", title:"Media Kit Content", cat:"money", icon:I.file, bangla:"মিডিয়া কিট কপি" },
    { id:"merch-ideas", title:"Merch Idea Generator", cat:"money", icon:I.gift, bangla:"মার্চ কনসেপ্ট" },
    { id:"membership-perks", title:"Membership Perks Generator", cat:"money", icon:I.sparkle, bangla:"মেম্বারশিপ পার্কস" },

    // REPURPOSING & MULTI-PLATFORM
    { id:"shorts-repurpose", title:"YouTube-to-Shorts Repurposing", cat:"repurpose", icon:I.shorts, bangla:"লং ভিডিও থেকে শর্টস" },
    { id:"caption-gen", title:"Cross-Platform Caption Generator", cat:"repurpose", icon:I.globe, bangla:"Instagram/TikTok ক্যাপশন" },
    { id:"blog-from-video", title:"Blog Post from Video", cat:"repurpose", icon:I.file, bangla:"ভিডিও থেকে ব্লগ" },
    { id:"newsletter-blurb", title:"Newsletter Segment Generator", cat:"repurpose", icon:I.email, bangla:"নিউজলেটার ব্লার্ব" },

    // ANALYTICS & CALCULATORS
    { id:"earn-calc", title:"YouTube Earnings Calculator", cat:"calc", icon:I.dollar, bangla:"ইনকাম হিসাব", featured:true },
    { id:"watchtime-calc", title:"Watch Time Calculator", cat:"calc", icon:I.clock, bangla:"ওয়াচ আওয়ার হিসাব" },
    { id:"growth-rate-calc", title:"Subscriber Growth Calculator", cat:"calc", icon:I.growth, bangla:"সাবস্ক্রাইবার বৃদ্ধি" },
    { id:"length-optimizer", title:"Video Length Optimizer", cat:"calc", icon:I.clock, bangla:"আদর্শ ভিডিও দৈর্ঘ্য" },

    // PLANNING & PRODUCTION
    { id:"shot-list", title:"Shot List Generator", cat:"production", icon:I.camera, bangla:"শুটিং শট লিস্ট" },
    { id:"gear-checklist", title:"Gear Checklist Generator", cat:"production", icon:I.check, bangla:"প্রি-শুট চেকলিস্ট" },
    { id:"collab-outreach", title:"Collab Outreach Message", cat:"production", icon:I.link, bangla:"কলাব পিচ মেসেজ" },

    // TRANSLATION & ACCESSIBILITY
    { id:"multi-translate", title:"Multi-Language Translator", cat:"translate", icon:I.translate, bangla:"বহুভাষায় অনুবাদ" },
    { id:"subtitle-format", title:"Subtitle Formatter", cat:"translate", icon:I.cc, bangla:"SRT সাবটাইটেল ফরম্যাট" },

    // ASK AI (PREMIUM)
    { id:"ask-ai", title:"Ask AI (Premium)", cat:"ai", icon:I.bot, bangla:"যেকোনো প্রশ্নের উত্তর", featured:true },

    // ADVANCED STRATEGY (new)
    { id:"retention-advisor", title:"Retention Curve Advisor", cat:"growth", icon:I.trend, bangla:"রিটেনশন ড্রপ বিশ্লেষণ" },
    { id:"channel-trailer", title:"Channel Trailer Script", cat:"script", icon:I.camera, bangla:"নতুন দর্শকের জন্য ট্রেইলার" },
    { id:"end-screen", title:"End Screen / Outro Script", cat:"script", icon:I.outro, bangla:"ভিডিওর শেষ ১৫-২০ সেকেন্ড" },
    { id:"series-naming", title:"Series Naming Generator", cat:"titles", icon:I.structure, bangla:"সিরিজের পর্বের নাম" },
    { id:"brand-voice", title:"Brand Voice Guide", cat:"community", icon:I.sparkle, bangla:"টোন-অফ-ভয়েস গাইড" },
    { id:"faq-generator", title:"Q&A / FAQ Generator", cat:"community", icon:I.community, bangla:"ভিডিওর FAQ" },
    { id:"chat-moderation", title:"Live Chat Moderation Templates", cat:"community", icon:I.chat, bangla:"লাইভ চ্যাট রেসপন্স" }
  ];

  window.YTHUB_DATA = {
    tools: TOOLS,
    categories: CATEGORIES,
    history: [], favorites: [], saved: []
  };
})();
