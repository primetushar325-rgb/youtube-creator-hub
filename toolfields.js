/* ============================================================
   YouTube Creator Hub — Per-tool input schemas + system prompts
   Each tool has its OWN field list (label/type/options) and its
   own purpose-built system prompt, so no two tools share a generic
   form or produce the same output.
   ============================================================ */
(function(){
  "use strict";

  const langSel = [
    { v:"en", l:"English" }, { v:"bn", l:"Bangla" }, { v:"mix", l:"English + Bangla" }
  ];

  function FIELDS(tool){ return (tool && tool.spec && tool.spec.fields) ? tool.spec.fields : []; }

  // Each tool's spec: fields + system prompt + optional calc/flag
  const SPEC = {
    // ===== TITLES & METADATA =====
    "title-gen": {
      fields:[
        {key:"topic", type:"textarea", label:"Video topic", ph:"e.g. How to edit faster in Premiere", rows:3, required:true},
        {key:"keywords", type:"text", label:"Keywords (optional)", ph:"comma-separated"},
        {key:"style", type:"select", label:"Style", options:[{v:"clickbait",l:"Clickbait"},{v:"professional",l:"Professional"},{v:"minimal",l:"Minimal"}], def:"clickbait"},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a YouTube title expert. Write 10 distinct, clickable YouTube titles under 70 characters for the given topic. Match the chosen style. Flag the best 3. Number each title."
    },
    "desc-gen": {
      fields:[
        {key:"topic", type:"textarea", label:"Video topic", ph:"Type the topic", rows:3, required:true},
        {key:"keywords", type:"text", label:"Keywords (optional)", ph:"comma-separated"},
        {key:"timestamps", type:"toggle", label:"Include timestamps", def:true},
        {key:"cta", type:"toggle", label:"Include links/CTA", def:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a YouTube SEO copywriter. Write a 200-300 word video description with a hook in the first 2 lines, natural keywords, timestamps (if enabled), and CTAs (if enabled)."
    },
    "tag-gen": {
      fields:[
        {key:"topic", type:"text", label:"Topic", ph:"e.g. cooking pasta", required:true},
        {key:"niche", type:"text", label:"Niche (optional)", ph:"e.g. food"},
        {key:"competitor", type:"text", label:"Competitor video URL (optional)", ph:"https://..."}
      ],
      sys:"You are a YouTube SEO expert. Generate 25 relevant YouTube tags for the topic ordered by relevance: broad, long-tail, and exact-match. Include a core tag first."
    },
    "hashtag-gen": {
      fields:[
        {key:"topic", type:"text", label:"Topic", ph:"e.g. fitness", required:true},
        {key:"platform", type:"select", label:"Platform", options:[{v:"youtube",l:"YouTube"},{v:"shorts",l:"YouTube Shorts"}], def:"shorts"}
      ],
      sys:"You are a social media hashtag strategist. Generate 15-20 relevant hashtags for the topic and platform. Mix broad, niche, and hyper-niche. Keep them natural, no spam."
    },
    "seo-keywords": {
      fields:[
        {key:"topic", type:"text", label:"Topic", ph:"e.g. video editing", required:true},
        {key:"audience", type:"text", label:"Target audience", ph:"e.g. beginners"},
        {key:"region", type:"text", label:"Region", ph:"e.g. global / Bangladesh"}
      ],
      sys:"You are an SEO researcher. Provide a keyword research list for the topic: seed keywords, long-tail, question-based, and comparison keywords, grouped and prioritized."
    },
    "ab-title": {
      fields:[
        {key:"titleA", type:"text", label:"Title A", ph:"First title", required:true},
        {key:"titleB", type:"text", label:"Title B", ph:"Second title", required:true}
      ],
      sys:"You are a YouTube CTR analyst. Compare Title A and Title B. Predict which will perform better, explain why (curiosity, length, power words, clarity), and suggest a winning hybrid title."
    },

    // ===== SCRIPTING & CONTENT =====
    "long-script": {
      fields:[
        {key:"topic", type:"textarea", label:"Video topic / outline", ph:"Type topic or rough outline", rows:3, required:true},
        {key:"length", type:"select", label:"Target length", options:[{v:"short",l:"~5 min"},{v:"medium",l:"~10 min"},{v:"long",l:"20 min+"}], def:"medium"},
        {key:"audience", type:"text", label:"Target audience", ph:"e.g. beginners"},
        {key:"tone", type:"select", label:"Tone", options:[{v:"professional",l:"Professional"},{v:"casual",l:"Casual"},{v:"exciting",l:"Exciting"},{v:"educational",l:"Educational"}], def:"professional"},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a YouTube scriptwriter. Write a complete long-form video script matching the target length, with intro, 3-5 sections, transitions, examples, and an outro CTA. Use natural spoken language."
    },
    "shorts-script": {
      fields:[
        {key:"topic", type:"textarea", label:"Shorts idea", ph:"Type your Shorts idea", rows:3, required:true},
        {key:"hookstyle", type:"select", label:"Hook style", options:[{v:"question",l:"Question"},{v:"shock",l:"Shock"},{v:"story",l:"Story-start"},{v:"fact",l:"Surprising fact"}], def:"question"},
        {key:"duration", type:"select", label:"Target duration", options:[{v:"15",l:"15 sec"},{v:"30",l:"30 sec"},{v:"60",l:"60 sec"}], def:"30"},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a Shorts scriptwriter. Write a tight script for the given duration with a hook (0-3s), main beats, payoff, and CTA. Include on-screen text cues."
    },
    "hook-gen": {
      fields:[
        {key:"topic", type:"textarea", label:"Video topic", ph:"Type topic", rows:2, required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a retention expert. Write 5 distinct opening-line hook variations for the video topic, each under 12 words, using different techniques (question, shock, fact, story, direct address)."
    },
    "outline-gen": {
      fields:[
        {key:"topic", type:"textarea", label:"Video topic", ph:"Type topic", rows:3, required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a video structure expert. Write a beat-by-beat outline for the topic (intro, 3-5 sections with key points, outro) WITHOUT writing the full script. Give a timestamped structure."
    },
    "cta-gen": {
      fields:[
        {key:"topic", type:"text", label:"Video topic", ph:"e.g. 10 editing tricks", required:true},
        {key:"goal", type:"select", label:"Goal", options:[{v:"subscribe",l:"Subscribe"},{v:"comment",l:"Comment"},{v:"link",l:"Click link"}], def:"subscribe"}
      ],
      sys:"You are a conversion copywriter. Write 8 varied CTA lines for the video and goal (subscribe/comment/link). Natural, on-brand, not robotic."
    },
    "chapter-gen": {
      fields:[
        {key:"script", type:"textarea", label:"Script or outline", ph:"Paste script or outline", rows:5, required:true},
        {key:"duration", type:"text", label:"Total duration (mm:ss)", ph:"e.g. 12:30"},
        {key:"num", type:"select", label:"Chapter count", options:[{v:"auto",l:"Auto"},{v:"5",l:"5"},{v:"8",l:"8"}], def:"auto"}
      ],
      sys:"You are a YouTube chapters expert. Generate professional timestamped chapters from the script, matching the total duration and requested chapter count. Format as 'MM:SS Chapter name'."
    },

    // ===== AUDIO & VOICE =====
    "tts": {
      fields:[
        {key:"text", type:"textarea", label:"Text to read aloud", ph:"Paste text", rows:5, required:true},
        {key:"voice", type:"voice", label:"Voice"},
        {key:"speed", type:"range", label:"Speed", min:0.5, max:2, step:0.1, def:1},
        {key:"pitch", type:"range", label:"Pitch", min:0.5, max:2, step:0.1, def:1},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      speech:"tts"
    },
    "stt-mic": {
      fields:[{key:"mic", type:"mic", label:"Start live recording"}],
      speech:"stt"
    },
    "stt-file": {
      fields:[{key:"file", type:"file", label:"Upload audio file (mp3/wav/m4a)"}],
      speech:"stt"
    },
    "pacing-check": {
      fields:[
        {key:"script", type:"textarea", label:"Script text", ph:"Paste script", rows:6, required:true},
        {key:"lang", type:"select", label:"Language", options:[{v:"en",l:"English ~150wpm"},{v:"bn",l:"Bangla ~130wpm"}], def:"en"}
      ],
      calc:"length"
    },

    // ===== VISUAL & THUMBNAIL =====
    "thumb-idea": {
      fields:[
        {key:"topic", type:"textarea", label:"Video topic", ph:"Type topic", rows:3, required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a thumbnail designer. Generate 8 thumbnail concept descriptions (text only): emotion, composition, text placement, and why it stands out in the feed."
    },
    "thumb-text": {
      fields:[
        {key:"topic", type:"text", label:"Video topic", ph:"Type topic", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a thumbnail text expert. Write 10 short (1-4 word) punchy text overlays for the thumbnail that contrast with visuals and amplify curiosity."
    },
    "image-prompt": {
      fields:[
        {key:"idea", type:"textarea", label:"Image idea", ph:"Describe what you want", rows:3, required:true},
        {key:"style", type:"select", label:"Art style", options:[{v:"realistic",l:"Realistic"},{v:"anime",l:"Anime"},{v:"3d",l:"3D render"},{v:"vector",l:"Flat vector"},{v:"cinematic",l:"Cinematic"}], def:"cinematic"},
        {key:"ratio", type:"select", label:"Aspect ratio", options:[{v:"16:9",l:"16:9"},{v:"1:1",l:"1:1"},{v:"9:16",l:"9:16"}], def:"16:9"}
      ],
      sys:"You are an AI image prompt engineer. Write 5 detailed image-generation prompts for the idea, including style, composition, lighting, subject, and the aspect ratio. Ready for Midjourney/Stable Diffusion."
    },
    "banner-concepts": {
      fields:[
        {key:"niche", type:"text", label:"Channel niche", ph:"e.g. tech", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a channel brand designer. Generate 5 distinct YouTube channel banner design concepts for the niche: layout, colors (fits black/white/yellow), tagline placement, and key elements."
    },

    // ===== GROWTH & STRATEGY =====
    "content-cal": {
      fields:[
        {key:"niche", type:"text", label:"Niche", ph:"e.g. fitness", required:true},
        {key:"freq", type:"select", label:"Upload frequency", options:[{v:"1",l:"1x/week"},{v:"3",l:"3x/week"},{v:"daily",l:"Daily"}], def:"3"},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a content strategist. Build a 4-week content calendar for the niche and frequency: video ideas per day, themes, and posting schedule."
    },
    "video-ideas": {
      fields:[
        {key:"niche", type:"text", label:"Niche / topic", ph:"e.g. gaming", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a video idea generator. Produce 10 fresh, distinct video ideas for the niche, each with a working title, angle, and format (tutorial/reaction/listicle/story)."
    },
    "trending-finder": {
      fields:[
        {key:"niche", type:"text", label:"Niche", ph:"e.g. AI tools", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a trend analyst. Suggest 10 currently trending topic angles for the niche, each with a fresh hook and why it could perform well on YouTube."
    },
    "competitor-analyzer": {
      fields:[
        {key:"competitor", type:"text", label:"Competitor channel/video URL", ph:"https://...", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a competitive analyst. Based on the competitor info provided, summarize what they do well (titles, retention, topics, format) and what a creator can learn, plus gaps to exploit."
    },
    "niche-finder": {
      fields:[
        {key:"interests", type:"textarea", label:"Your interests", ph:"e.g. coding, cooking, gaming", rows:3, required:true}
      ],
      sys:"You are a niche consultant. Based on the interests, suggest 5 viable YouTube niches with monetization potential, audience, and content format for each."
    },
    "community-post": {
      fields:[
        {key:"topic", type:"text", label:"Topic / announcement", ph:"e.g. new video out", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a community manager. Write 5 engaging YouTube Community tab posts (poll, question, teaser, behind-the-scenes, thank-you) for the topic."
    },

    // ===== ENGAGEMENT & COMMUNITY =====
    "comment-reply": {
      fields:[
        {key:"comment", type:"textarea", label:"Paste the comment", ph:"Paste a viewer comment", rows:3, required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a friendly creator. Write a warm, on-brand reply to this comment that encourages more engagement. Give 3 reply options."
    },
    "pinned-comment": {
      fields:[
        {key:"topic", type:"text", label:"Video topic", ph:"e.g. 10 editing tips", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are an engagement expert. Write 3 engaging pinned comments for the video that spark comments, questions, and shares."
    },
    "live-title": {
      fields:[
        {key:"topic", type:"text", label:"Stream topic", ph:"e.g. Q&A", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a live-streaming strategist. Write 5 strong live stream titles + descriptions that boost click-through and set viewer expectations."
    },
    "poll-gen": {
      fields:[
        {key:"niche", type:"text", label:"Niche", ph:"e.g. tech", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a community engagement expert. Generate 10 engaging poll/community questions for the niche that get high response rates."
    },

    // ===== MONETIZATION & BUSINESS =====
    "sponsor-email": {
      fields:[
        {key:"stats", type:"textarea", label:"Channel stats", ph:"e.g. 50K subs, 1M views/mo, tech niche", rows:3, required:true},
        {key:"brand", type:"text", label:"Target brand", ph:"e.g. a software company"},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a sponsorship strategist. Write a professional, persuasive sponsorship pitch email to the target brand, using the channel stats, with subject line + body."
    },
    "media-kit": {
      fields:[
        {key:"stats", type:"textarea", label:"Channel stats", ph:"subs, views, engagement", rows:3, required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a media kit designer. Generate media kit copy sections: About, Audience, Stats, Services/Formats, Pricing, Contact. Professional and compelling."
    },
    "merch-ideas": {
      fields:[
        {key:"niche", type:"text", label:"Niche / brand", ph:"e.g. gaming channel", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a merch/product designer. Generate 15 merch concepts (products + designs) that fit the niche/brand and would appeal to the audience."
    },
    "membership-perks": {
      fields:[
        {key:"niche", type:"text", label:"Channel niche", ph:"e.g. fitness", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a membership strategist. Suggest a tiered YouTube Membership perks structure (per tier) that adds real value for the niche."
    },

    // ===== REPURPOSING & MULTI-PLATFORM =====
    "shorts-repurpose": {
      fields:[
        {key:"topic", type:"textarea", label:"Long video topic / transcript", ph:"Paste transcript or describe video", rows:4, required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a repurposing editor. Identify 5 clip-worthy moments from the video for Shorts, each with a hook and why it would work as a standalone Short."
    },
    "caption-gen": {
      fields:[
        {key:"topic", type:"text", label:"Video topic", ph:"e.g. travel vlog", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a social copywriter. Write caption variants for Instagram, TikTok, and X for the video topic, each with relevant hashtags."
    },
    "blog-from-video": {
      fields:[
        {key:"transcript", type:"textarea", label:"Video transcript", ph:"Paste full transcript", rows:6, required:true}
      ],
      sys:"You are a content repurposer. Convert this video transcript into a clean, SEO-friendly blog article draft with headings, intro, sections, and conclusion."
    },
    "newsletter-blurb": {
      fields:[
        {key:"topic", type:"text", label:"Video topic", ph:"e.g. my new editing tutorial", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are an email newsletter writer. Write a short, engaging newsletter blurb promoting the new video, with a CTA to watch it."
    },

    // ===== ANALYTICS & CALCULATORS =====
    "earn-calc": {
      fields:[
        {key:"views", type:"number", label:"Monthly views", def:100000, min:0},
        {key:"cpm", type:"number", label:"CPM (USD)", def:4, min:0, step:0.1},
        {key:"niche", type:"text", label:"Niche", ph:"optional"}
      ],
      calc:"earnings"
    },
    "watchtime-calc": {
      fields:[
        {key:"views", type:"number", label:"Views", def:1000, min:0},
        {key:"avgdur", type:"number", label:"Avg view duration (sec)", def:120, min:0, step:0.1}
      ],
      calc:"watchtime"
    },
    "growth-rate-calc": {
      fields:[
        {key:"start", type:"number", label:"Start subscribers", def:1000, min:0},
        {key:"end", type:"number", label:"End subscribers", def:2000, min:0},
        {key:"days", type:"number", label:"Days", def:30, min:1}
      ],
      calc:"growth"
    },
    "length-optimizer": {
      fields:[
        {key:"topic", type:"text", label:"Topic type", ph:"e.g. tutorial / vlog / gaming", required:true},
        {key:"format", type:"select", label:"Format", options:[{v:"long",l:"Long-form"},{v:"shorts",l:"Shorts"}], def:"long"}
      ],
      calc:"lengthopt"
    },

    // ===== PLANNING & PRODUCTION =====
    "shot-list": {
      fields:[
        {key:"script", type:"textarea", label:"Script / outline", ph:"Paste script or outline", rows:5, required:true}
      ],
      sys:"You are a video production planner. Generate a detailed shot list from the script: each shot number, camera angle, subject, action, and estimated duration."
    },
    "gear-checklist": {
      fields:[
        {key:"videotype", type:"text", label:"Video type", ph:"e.g. talking head / vlog", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a production assistant. Generate a pre-shoot equipment/gear checklist for the video type, grouped by category (camera, audio, lighting, props)."
    },
    "collab-outreach": {
      fields:[
        {key:"niche", type:"text", label:"Target creator niche", ph:"e.g. tech reviewers", required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a collab strategist. Write a friendly, professional collab outreach message to a creator in the target niche, with 3 approaches and subject lines."
    },

    // ===== TRANSLATION & ACCESSIBILITY =====
    "multi-translate": {
      fields:[
        {key:"text", type:"textarea", label:"Text", ph:"Paste text to translate", rows:4, required:true},
        {key:"target", type:"text", label:"Target language", ph:"e.g. Bangla, Spanish", required:true}
      ],
      sys:"You are a professional translator. Translate the given text into the target language, preserving tone and meaning, with natural phrasing."
    },
    "subtitle-format": {
      fields:[
        {key:"transcript", type:"textarea", label:"Raw transcript", ph:"Paste raw transcript", rows:5, required:true}
      ],
      sys:"You are a subtitle formatter. Convert this raw transcript into a properly timed SRT-style format with sensible timestamp intervals and clean line breaks."
    },

    // ===== ADVANCED STRATEGY =====
    "retention-advisor": {
      fields:[
        {key:"topic", type:"textarea", label:"Video topic", ph:"Type the video topic", rows:3, required:true},
        {key:"drops", type:"textarea", label:"Rough retention drop-off points", ph:"e.g. 0:00-0:10 intro, drops at 2:00, 4:30, 6:00", rows:3, required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a YouTube retention analyst. Based on the drop-off points and topic, suggest specific content changes (pacing, transitions, value density, hooks) that would improve retention at each weak moment."
    },
    "channel-trailer": {
      fields:[
        {key:"value", type:"textarea", label:"Channel value proposition", ph:"What does your channel offer viewers?", rows:3, required:true},
        {key:"style", type:"select", label:"Style", options:[{v:"energetic",l:"Energetic"},{v:"story",l:"Story-driven"},{v:"direct",l:"Direct & clear"}], def:"energetic"},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a channel branding scriptwriter. Write a 45-60 second channel trailer script focused on the channel's value proposition (NOT a single video): who it's for, what to expect, and a subscribe CTA. Give 3 versions."
    },
    "end-screen": {
      fields:[
        {key:"topic", type:"text", label:"Video topic", ph:"e.g. 10 editing tips", required:true},
        {key:"next", type:"text", label:"Next video topic (optional)", ph:"What to tease next"},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are an outro/end-screen scriptwriter. Write the final 15-20 seconds of the video: recap the takeaway, tease the next video, and frame a subscribe CTA naturally. Give 3 variations."
    },
    "series-naming": {
      fields:[
        {key:"topic", type:"text", label:"Series topic", ph:"e.g. Learn to Edit", required:true},
        {key:"parts", type:"number", label:"Number of episodes", def:5, min:2},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a series branding expert. Create a consistent series name + naming pattern and generate episode titles for all parts (e.g. 'Learn to Edit #1: Getting Started'), keeping them coherent and binge-able."
    },
    "brand-voice": {
      fields:[
        {key:"samples", type:"textarea", label:"Sample titles/descriptions", ph:"Paste a few of your best titles or descriptions", rows:4, required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a brand voice consultant. Analyze the sample content and produce a reusable tone-of-voice guide: vocabulary, sentence style, do's/don'ts, and example rewrites, so the creator can stay consistent."
    },
    "faq-generator": {
      fields:[
        {key:"topic", type:"textarea", label:"Video topic / description", ph:"Type the topic or paste your description", rows:4, required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a YouTube engagement strategist. Generate 8 likely viewer questions + short answers for the video, to preempt in the description (boosts watch time and comments)."
    },
    "chat-moderation": {
      fields:[
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a live-stream community moderator. Provide polite, templated responses for common live-chat situations: spam, repeated questions, off-topic, new viewers asking who you are, and appreciation. Give 3 responses per situation."
    },

    // ===== ASK AI =====
    "ask-ai": {
      fields:[
        {key:"question", type:"textarea", label:"Your YouTube strategy question", ph:"e.g. How do I grow from 1K to 10K subs?", rows:4, required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a senior YouTube growth strategist and coach. Answer the creator's question with a clear, structured, actionable response (problem, reasons, step-by-step solution, tips)."
    }
  };

  // Tools without an explicit spec get a sensible default (topic + language).
  function defaultSpec(cat){
    return {
      fields:[
        {key:"topic", type:"textarea", label:"Enter details", ph:"Type your input", rows:4, required:true},
        {key:"lang", type:"select", label:"Language", options:langSel, def:"en"}
      ],
      sys:"You are a senior YouTube strategist. Produce high-quality, structured, ready-to-use content based on the input."
    };
  }

  window.YTHUB_SPEC = {
    get: function(tool){ return SPEC[tool.id] || defaultSpec(tool.cat); }
  };
})();
