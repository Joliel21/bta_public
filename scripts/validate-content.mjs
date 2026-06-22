#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicDir = path.join(root, "public");
const issuePath = path.join(publicDir, "content", "issue.json");
const errors = [];
const warnings = [];

function readJson(absPath) {
  try {
    return JSON.parse(fs.readFileSync(absPath, "utf8"));
  } catch (error) {
    errors.push(`Could not read valid JSON: ${path.relative(root, absPath)} :: ${error.message}`);
    return null;
  }
}

function existsPublicPath(value = "") {
  const clean = String(value || "").trim();
  if (!clean || /^https?:\/\//i.test(clean) || /^data:/i.test(clean) || /^mailto:/i.test(clean)) return true;
  const rel = clean.replace(/^public\//, "").replace(/^\//, "");
  return fs.existsSync(path.join(publicDir, rel));
}

function checkPath(label, value) {
  if (!existsPublicPath(value)) errors.push(`${label} points to missing public path: ${value}`);
}

if (!fs.existsSync(issuePath)) {
  errors.push("Missing public/content/issue.json");
}

const issue = fs.existsSync(issuePath) ? readJson(issuePath) : null;

if (issue) {
  if (issue.schemaVersion !== "2.0.0") warnings.push(`Expected schemaVersion 2.0.0, got ${issue.schemaVersion}`);
  if (!issue.issueId) errors.push("issue.issueId is required");
  if (!issue.source?.baseRawUrl) errors.push("issue.source.baseRawUrl is required");

  const frontMatterPages = Array.isArray(issue.frontMatterPages) ? issue.frontMatterPages : [];
  const chapters = Array.isArray(issue.chapters) ? issue.chapters : [];
  const chapterDescriptions = Array.isArray(issue.chapterDescriptions) ? issue.chapterDescriptions : [];
  const articles = Array.isArray(issue.articles) ? issue.articles : [];
  const backMatterPages = Array.isArray(issue.backMatterPages) ? issue.backMatterPages : [];
  const adPages = Array.isArray(issue.adPages) ? issue.adPages : [];

  for (const page of frontMatterPages) {
    if (!page.id) errors.push("Front matter page missing id");
    if (page.markdownPath) checkPath(`frontMatterPages.${page.id}.markdownPath`, page.markdownPath);
  }

  for (const desc of chapterDescriptions) {
    if (!desc.slug) errors.push("Chapter description missing slug");
    if (desc.markdownPath) checkPath(`chapterDescriptions.${desc.slug}.markdownPath`, desc.markdownPath);
  }

  const articleIds = new Set();
  for (const article of articles) {
    if (!article.id) errors.push("Article missing id");
    if (article.id && articleIds.has(article.id)) errors.push(`Duplicate article id: ${article.id}`);
    if (article.id) articleIds.add(article.id);
    if (!article.title) errors.push(`Article ${article.id || "(unknown)"} missing title`);
    if (article.markdownPath) checkPath(`articles.${article.id}.markdownPath`, article.markdownPath);
    for (const image of Array.isArray(article.images) ? article.images : []) {
      if (image.filename) {
        checkPath(`articles.${article.id}.images.${image.filename}`, `images/articles/${image.filename}`);
      }
    }
  }

  for (const chapter of chapters) {
    if (!chapter.slug) errors.push("Chapter missing slug");
    for (const id of Array.isArray(chapter.articleIds) ? chapter.articleIds : []) {
      if (!articleIds.has(id)) errors.push(`Chapter ${chapter.slug} references missing article id: ${id}`);
    }
  }

  for (const page of backMatterPages) {
    if (!page.id) errors.push("Back matter page missing id");
    if (page.markdownPath) checkPath(`backMatterPages.${page.id}.markdownPath`, page.markdownPath);
  }

  for (const page of adPages) {
    if (!page.id) errors.push("Ad page missing id");
    if (page.imageUrl) checkPath(`adPages.${page.id}.imageUrl`, page.imageUrl);
  }

  const coverLogo = issue.readerContext?.cover?.logoUrl || "";
  const topLogo = issue.readerContext?.topBar?.logoUrl || "";
  const backAuthor = issue.readerContext?.backCover?.authorImageUrl || "";
  for (const [label, value] of [["cover.logoUrl", coverLogo], ["topBar.logoUrl", topLogo], ["backCover.authorImageUrl", backAuthor]]) {
    if (value && !existsPublicPath(value)) warnings.push(`${label} is external or missing from public folder: ${value}`);
  }
}

for (const warning of warnings) console.warn(`Warning: ${warning}`);
if (errors.length > 0) {
  for (const error of errors) console.error(`Error: ${error}`);
  process.exit(1);
}

console.log("BTA public content validation passed.");
