// Indexing + query logic for the Schedule I Modding Cookbook MCP.
// Pure functions over the curated markdown corpus - no network, no API cost.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';
import matter from 'gray-matter';
import MiniSearch from 'minisearch';

const DEFAULT_DOCS_DIR = fileURLToPath(
  new URL('../src/content/docs/', import.meta.url),
);
const DEFAULT_SITE_URL = 'https://doodesch-mods.github.io/ScheduleOne-Cookbook';

// Human-friendly section labels for the top-level folders.
const SECTION_LABELS = {
  '': 'Introduction',
  'getting-started': 'Getting Started',
  'best-practices': 'Best Practices',
  'core-concepts': 'Core Concepts & Game Internals',
  networking: 'Networking (FishNet)',
  il2cpp: 'IL2CPP Specifics',
  'unity-assetbundles': 'Unity & AssetBundles',
  snippets: 'Code Snippets',
  tooling: 'Tooling & Resources',
  publishing: 'Publishing',
};

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.mdx?$/.test(entry)) out.push(full);
  }
  return out;
}

function slugFromRel(rel) {
  let s = rel.replace(/\\/g, '/').replace(/\.mdx?$/, '');
  if (s === 'index') return '';
  if (s.endsWith('/index')) return s.slice(0, -'/index'.length);
  return s;
}

// Strip markdown to a plainish, searchable string (keeps code identifiers).
function toPlainText(md) {
  return md
    .replace(/```[\s\S]*?```/g, (m) => ' ' + m.replace(/```/g, ' ') + ' ')
    .replace(/^import\s.+$/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`|]/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHeadings(md) {
  const out = [];
  for (const line of md.split('\n')) {
    const m = /^#{1,4}\s+(.+?)\s*$/.exec(line);
    if (m) out.push(m[1].replace(/[`*]/g, ''));
  }
  return out;
}

// Pull the "> Source: **name** - [text](url)" attribution lines.
function extractSources(md) {
  const out = [];
  const re = /^>\s*Source:\s*\*\*(.+?)\*\*\s*-\s*\[([^\]]*)\]\(([^)]+)\)/gim;
  let m;
  while ((m = re.exec(md))) {
    out.push({ author: m[1].trim(), url: m[3].trim() });
  }
  return out;
}

export function loadCorpus(options = {}) {
  const docsDir = options.docsDir || process.env.COOKBOOK_DOCS_DIR || DEFAULT_DOCS_DIR;
  const siteUrl = (
    options.siteUrl ||
    process.env.COOKBOOK_SITE_URL ||
    DEFAULT_SITE_URL
  ).replace(/\/$/, '');

  const files = walk(docsDir);
  const pages = [];
  for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    const { data, content } = matter(raw);
    const rel = relative(docsDir, file).split(sep).join('/');
    const slug = slugFromRel(rel);
    const section = slug.includes('/') ? slug.split('/')[0] : slug === '' ? '' : slug;
    const url = slug === '' ? `${siteUrl}/` : `${siteUrl}/${slug}/`;
    const headings = extractHeadings(content);
    const sources = extractSources(content);
    pages.push({
      id: slug || 'index',
      slug,
      rel,
      file,
      section,
      sectionLabel: SECTION_LABELS[section] ?? section,
      title: data.title || headings[0] || slug || 'Introduction',
      description: data.description || '',
      order: data?.sidebar?.order ?? 100,
      url,
      headings,
      sources,
      markdown: content.trim(),
      body: toPlainText(content),
    });
  }

  const mini = new MiniSearch({
    fields: ['title', 'description', 'headings', 'body'],
    storeFields: ['title', 'description', 'section', 'sectionLabel', 'slug', 'url'],
    searchOptions: {
      boost: { title: 5, headings: 3, description: 3, body: 1 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND',
    },
  });
  mini.addAll(
    pages.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      headings: p.headings.join(' \n '),
      body: p.body,
      section: p.section,
      sectionLabel: p.sectionLabel,
      slug: p.slug,
      url: p.url,
    })),
  );

  const byId = new Map(pages.map((p) => [p.id, p]));
  return { pages, mini, byId, docsDir, siteUrl };
}

function snippetFor(page, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const body = page.body;
  const lower = body.toLowerCase();
  let idx = -1;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i !== -1 && (idx === -1 || i < idx)) idx = i;
  }
  if (idx === -1) return (page.description || body).slice(0, 220);
  const start = Math.max(0, idx - 90);
  const end = Math.min(body.length, idx + 130);
  return (start > 0 ? '...' : '') + body.slice(start, end).trim() + (end < body.length ? '...' : '');
}

export function search(corpus, query, { limit = 8, section } = {}) {
  let results = corpus.mini.search(query);
  if (section) results = results.filter((r) => r.section === section);
  return results.slice(0, limit).map((r) => {
    const page = corpus.byId.get(r.id);
    return {
      title: r.title,
      section: r.sectionLabel,
      slug: r.slug,
      url: r.url,
      score: Math.round(r.score * 100) / 100,
      description: r.description || undefined,
      snippet: page ? snippetFor(page, query) : undefined,
    };
  });
}

export function normalizePathInput(corpus, input) {
  let s = String(input || '').trim();
  s = s.replace(corpus.siteUrl, '');
  s = s.replace(/^https?:\/\/[^/]+/, '');
  s = s.replace(/[?#].*$/, '');
  s = s.replace(/\.mdx?$/, '');
  s = s.replace(/^\/+|\/+$/g, '');
  // tolerate a leading repo-base segment if a full pathname was passed
  s = s.replace(/^ScheduleOne-(Cookbook|ModdingWiki)\/?/i, '');
  return s;
}

export function getPage(corpus, input) {
  const slug = normalizePathInput(corpus, input);
  const page = corpus.byId.get(slug || 'index');
  if (!page) return null;
  return {
    title: page.title,
    section: page.sectionLabel,
    slug: page.slug,
    url: page.url,
    description: page.description || undefined,
    sources: page.sources,
    markdown: page.markdown,
  };
}

export function listPages(corpus, { section } = {}) {
  return corpus.pages
    .filter((p) => (section ? p.section === section : true))
    .sort(
      (a, b) =>
        a.section.localeCompare(b.section) || a.order - b.order || a.title.localeCompare(b.title),
    )
    .map((p) => ({
      title: p.title,
      section: p.sectionLabel,
      slug: p.slug,
      url: p.url,
      description: p.description || undefined,
    }));
}

export function listSections(corpus) {
  const map = new Map();
  for (const p of corpus.pages) {
    if (!map.has(p.section))
      map.set(p.section, { key: p.section, label: p.sectionLabel, pages: 0, overview: '' });
    const s = map.get(p.section);
    s.pages += 1;
    if (p.slug === p.section || p.slug === '') s.overview = p.description || '';
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}
