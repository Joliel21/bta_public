#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicDir = path.join(root, "public");
const issue = JSON.parse(fs.readFileSync(path.join(publicDir, "content", "issue.json"), "utf8"));
const shareDir = path.join(publicDir, "share");

const publicMagazineUrl = process.env.PUBLIC_MAGAZINE_URL || issue.source?.githubPagesUrl || "https://joliel21.github.io/bta_public/";
const publicAssetUrl = process.env.PUBLIC_ASSET_URL || publicMagazineUrl;

function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripMarkdown(value = "") {
  return String(value)
    .replace(/^---[\s\S]*?---/m, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function articleImageUrl(article) {
  const first = Array.isArray(article.images) ? article.images.find((image) => image.filename) : null;
  if (!first) return new URL("images/brand/Cover_Logo.png", publicAssetUrl).toString();
  return new URL(`images/articles/${first.filename}`, publicAssetUrl).toString();
}

fs.rmSync(shareDir, { recursive: true, force: true });
fs.mkdirSync(shareDir, { recursive: true });

const articles = Array.isArray(issue.articles) ? issue.articles : [];
const links = [];

for (const article of articles) {
  const slug = article.id;
  if (!slug) continue;

  const articleDir = path.join(shareDir, slug);
  fs.mkdirSync(articleDir, { recursive: true });

  let excerpt = article.subtitle || "";
  if (!excerpt && article.markdownPath) {
    const mdPath = path.join(publicDir, article.markdownPath.replace(/^public\//, ""));
    if (fs.existsSync(mdPath)) {
      excerpt = stripMarkdown(fs.readFileSync(mdPath, "utf8")).slice(0, 220);
    }
  }

  const title = article.title || issue.title || "The Words We Carry";
  const imageUrl = articleImageUrl(article);
  const articleUrl = new URL(`share/${slug}/`, publicMagazineUrl).toString();
  links.push({ title, slug, url: articleUrl });

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(title)} | ${esc(issue.title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${esc(excerpt)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(excerpt)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${esc(articleUrl)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(excerpt)}">
  <meta name="twitter:image" content="${esc(imageUrl)}">
  <style>
    body{margin:0;font-family:Georgia,serif;background:#113143;color:#f8f3e8;display:grid;min-height:100vh;place-items:center;padding:24px}
    main{max-width:760px}
    a{color:#d8bd72}
    img{max-width:100%;height:auto;border:1px solid rgba(216,189,114,.4)}
  </style>
</head>
<body>
  <main>
    <p>Breathtaking Awareness</p>
    <h1>${esc(title)}</h1>
    <p>${esc(excerpt)}</p>
    <img src="${esc(imageUrl)}" alt="">
    <p><a href="${esc(publicMagazineUrl)}">Open The Words We Carry</a></p>
  </main>
</body>
</html>
`;

  fs.writeFileSync(path.join(articleDir, "index.html"), html);
}

const indexHtml = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(issue.title)} Share Pages</title></head>
<body>
<h1>${esc(issue.title)} Share Pages</h1>
<ul>
${links.map((link) => `  <li><a href="./${esc(link.slug)}/">${esc(link.title)}</a></li>`).join("\n")}
</ul>
</body>
</html>
`;
fs.writeFileSync(path.join(shareDir, "index.html"), indexHtml);
console.log(`Generated ${links.length} share pages.`);
