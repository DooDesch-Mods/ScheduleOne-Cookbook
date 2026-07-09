---
title: Schedule I MCP Server
description: An MCP server that lets agentic LLMs query and manipulate live in-game objects for real-time mod debugging.
sidebar:
  order: 5
---

## S1 MCP Server

The **S1 MCP Server** lets agentic LLM tools interact with live in-game objects for real-time mod
debugging and automation. It exposes structured data from a running Schedule I instance to an external
agent, so an LLM can inspect state, run experiments, and drive testing workflows hands-free.

- Repo: [github.com/SirTidez/S1MCPServer](https://github.com/SirTidez/S1MCPServer)

**How it is built** - a client/server split:

- The **server** side runs as a MelonMod inside the game, exposing a controlled subset of in-game
  objects and methods.
- The **client** side is the MCP server itself, mediating between those in-game objects and an external
  agent that speaks the MCP protocol.

The tooling has grown to automate the game lifecycle - launching the game, detecting when it is ready,
loading saves, and closing it down - so an agent can run a full test loop on its own. Later work added a
Rust client that made it noticeably faster and more reliable (more successful tool calls).

> Source: **SirTidez** - [original message](https://discord.com/channels/1349221936470687764/1444928838441369704/1444928838441369704)
> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1444928838441369704/1480087957472804916)

:::caution
The project describes itself as proof-of-concept: only a subset of objects is exposed, and error
handling, concurrency safety, and sandboxing are still evolving. Expect rough edges.
:::
