#!/usr/bin/env node
// MCP server for the Schedule I Modding Cookbook.
// Exposes the curated wiki corpus to agents as search + read tools. Fully local.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  loadCorpus,
  search,
  getPage,
  listPages,
  listSections,
} from './lib.mjs';

let corpus;
try {
  corpus = loadCorpus();
} catch (err) {
  console.error(
    `[cookbook-mcp] Failed to load the docs corpus. Set COOKBOOK_DOCS_DIR to the ` +
      `wiki's src/content/docs folder.\n${err?.stack || err}`,
  );
  process.exit(1);
}
console.error(
  `[cookbook-mcp] Indexed ${corpus.pages.length} pages from ${corpus.docsDir}`,
);

const server = new McpServer(
  { name: 'cookbook', version: '1.0.0' },
  {
    instructions:
      'The Schedule I Modding Cookbook: a community knowledge base for modding the game ' +
      'Schedule I (MelonLoader/C#, Mono and IL2CPP branches). Use search_cookbook to find ' +
      'relevant pages by keyword (e.g. "custom RPC", "AssetBundle", "IL2CPP interop", ' +
      '"MelonPreferences"), then get_page to read the full markdown (code snippets included, ' +
      'each credited to its original author with a Discord backlink). Use list_sections / ' +
      'list_pages to browse. All content is local and offline.',
  },
);

const asText = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

server.tool(
  'search_cookbook',
  'Full-text search across the Schedule I Modding Cookbook. Returns ranked pages with a ' +
    'snippet, section, slug and live URL. Follow up with get_page to read a result in full.',
  {
    query: z.string().describe('Keywords, e.g. "custom RPC codegen" or "IL2CPP List interop".'),
    limit: z.number().int().min(1).max(25).optional().describe('Max results (default 8).'),
    section: z
      .string()
      .optional()
      .describe('Optional section key to filter, e.g. "networking", "il2cpp", "snippets".'),
  },
  async ({ query, limit, section }) => {
    const results = search(corpus, query, { limit, section });
    if (results.length === 0)
      return asText({ query, results: [], hint: 'No matches. Try broader keywords or list_sections.' });
    return asText({ query, count: results.length, results });
  },
);

server.tool(
  'get_page',
  'Read one Cookbook page in full (raw markdown, including code snippets and their ' +
    '"> Source:" author credits). Accepts a slug like "snippets/vehicles", a section like ' +
    '"networking", or a full page URL.',
  {
    path: z
      .string()
      .describe('Page slug (e.g. "il2cpp/interop-and-types"), section, or full URL.'),
  },
  async ({ path }) => {
    const page = getPage(corpus, path);
    if (!page) {
      const suggestions = listPages(corpus)
        .map((p) => p.slug || '(home)')
        .slice(0, 60);
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `No page for "${path}". Known slugs include:\n${suggestions.join('\n')}`,
          },
        ],
      };
    }
    const header =
      `# ${page.title}\n\nSection: ${page.section}\nURL: ${page.url}` +
      (page.sources?.length ? `\nCredited authors: ${page.sources.map((s) => s.author).join(', ')}` : '') +
      `\n\n---\n\n`;
    return { content: [{ type: 'text', text: header + page.markdown }] };
  },
);

server.tool(
  'list_pages',
  'List Cookbook pages (title, section, slug, URL, description). Optionally filter by section.',
  {
    section: z
      .string()
      .optional()
      .describe('Optional section key, e.g. "snippets" or "networking".'),
  },
  async ({ section }) => asText({ pages: listPages(corpus, { section }) }),
);

server.tool(
  'list_sections',
  'List the top-level sections of the Cookbook with page counts. Use these keys to filter ' +
    'search_cookbook and list_pages.',
  {},
  async () => asText({ sections: listSections(corpus) }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[cookbook-mcp] ready on stdio');
