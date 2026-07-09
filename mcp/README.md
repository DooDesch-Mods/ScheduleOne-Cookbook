# Cookbook MCP server

A tiny [Model Context Protocol](https://modelcontextprotocol.io/) server that indexes this wiki so an
AI agent (Claude Code, Claude Desktop, Cursor, etc.) can **search and read the Schedule I Modding
Cookbook directly** while it helps you write a mod. Fully local, no network, no API cost - it reads the
curated markdown in `../src/content/docs`, builds an in-memory search index at startup, and serves it
over stdio.

## Tools

- **`search_cookbook`** `{ query, limit?, section? }` - full-text search; returns ranked pages with a
  snippet, section, slug and live URL.
- **`get_page`** `{ path }` - read one page in full as markdown (code snippets included, each with its
  `> Source:` author credit). Accepts a slug (`snippets/vehicles`), a section, or a full page URL.
- **`list_pages`** `{ section? }` - the table of contents.
- **`list_sections`** - the top-level sections and their page counts (use these keys to filter).

## Setup

```bash
cd mcp
npm install
```

Then register it with your MCP client. For example, in a project `.mcp.json` (Claude Code):

```json
{
  "mcpServers": {
    "cookbook": {
      "command": "node",
      "args": ["path/to/ScheduleOne-Cookbook/mcp/index.mjs"]
    }
  }
}
```

The server locates the docs relative to itself, so no extra config is needed when it lives inside a
checkout of this repo. To point it at a docs folder elsewhere, set `COOKBOOK_DOCS_DIR` (and
`COOKBOOK_SITE_URL` to control the URLs it returns).

## Verify

```bash
npm run smoke   # offline check of indexing + search over the local corpus
```

## Typical agent flow

1. `search_cookbook { "query": "custom RPC codegen" }`
2. `get_page { "path": "networking/custom-rpcs-and-codegen" }`
3. Use the returned code, keeping the `> Source:` credit.
