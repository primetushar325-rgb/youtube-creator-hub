// Local dev server: serves static site + mocks /api/generate streaming
// (for local UI testing only — production uses Vercel serverless functions)
const http = require("http");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png" };

http.createServer((req, res) => {
  const url = req.url.split("?")[0];
  if (url === "/api/generate" && req.method === "POST") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      let prompt = "";
      try { prompt = JSON.parse(body).prompt || ""; } catch {}
      if (!prompt.trim()) { res.writeHead(400, {"Content-Type":"application/json"}); return res.end(JSON.stringify({error:"No prompt provided.",code:"BAD_INPUT"})); }
      res.writeHead(200, {"Content-Type":"text/plain; charset=utf-8"});
      const out = "1. Mock Title One That Is Great\n2. Mock Title Two With Curiosity\n3. Mock Title Three For Testing\n4. Fourth Sample Title\n5. Fifth Sample Title";
      let i = 0;
      const t = setInterval(() => { if (i >= out.length) { clearInterval(t); return res.end(); } res.write(out.slice(i, i+12)); i += 12; }, 20);
    });
    return;
  }
  let fp = path.join(root, url === "/" ? "index.html" : url);
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) fp = path.join(root, "index.html");
  res.writeHead(200, {"Content-Type": MIME[path.extname(fp)] || "application/octet-stream"});
  fs.createReadStream(fp).pipe(res);
}).listen(3000, "0.0.0.0", () => console.log("dev server on :3000"));
