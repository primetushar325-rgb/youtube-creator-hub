// ============================================================
// /api/hashtag — Viral Hashtag Intelligence data source
// If YOUTUBE_API_KEY is set, returns live YouTube Shorts search
// results. Otherwise returns sample data so the UI works offline.
//
// The strict single-hashtag filtering happens CLIENT-SIDE in
// viral-hashtag.js (applySingleHashtagFilter). This endpoint only
// supplies raw video records {id, channel, title, desc, tags,
// views, hoursAgo}.
// ============================================================
export const config = { runtime: "nodejs" };

const env = (k) => (process.env[k] || "").trim();

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const key = env("YOUTUBE_API_KEY");
  if (!key) {
    // No live key — return sample data.
    return res.status(200).json({
      live: false,
      message: "Sample data. Set YOUTUBE_API_KEY to fetch live Shorts.",
      videos: sampleVideos()
    });
  }

  try {
    const q = (req.query.q || "shorts").toString();
    const url = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=" +
      encodeURIComponent(q) + "&key=" + key;
    const up = await fetch(url);
    const data = await up.json();
    if (!up.ok) throw new Error(data.error?.message || "YouTube API error");
    const videos = (data.items || []).map(it => ({
      id: it.id?.videoId,
      channel: it.snippet?.channelTitle || "",
      title: it.snippet?.title || "",
      desc: it.snippet?.description || "",
      tags: [], // tags not in search response; would need videos.list
      views: 0,
      hoursAgo: 0
    }));
    return res.status(200).json({ live: true, videos });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

function sampleVideos() {
  return [
    { id:"a1", channel:"AnimalWorld", title:"Best #animal moments today", desc:"Watch these amazing creatures. #animal", tags:["#animal"], views:120000, hoursAgo:3 },
    { id:"a2", channel:"WildKingdom", title:"Shocking animal facts", desc:"Every day a new fact. #animal", tags:["#animal"], views:98000, hoursAgo:6 },
    { id:"x1", channel:"SpamChannel", title:"#animal #viral #shorts", desc:"pushing all tags #animal #viral #shorts", tags:["#animal","#viral","#shorts"], views:5000, hoursAgo:1 },
    { id:"f1", channel:"FitWithSam", title:"Home #fitness in 5 min", desc:"Quick routine. #fitness", tags:["#fitness"], views:150000, hoursAgo:2 }
  ];
}
