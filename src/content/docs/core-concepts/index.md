---
title: Core Concepts & Game Internals
description: How Schedule I is structured - namespaces, reference data, hook points, and tracking changes across game updates.
sidebar:
  order: 0
---

Reference material about how the game itself is put together - the code you patch, read, and build
against. Start here when you need to know where something lives or why it broke after an update.

## In this section

- **[Game Structure & Namespaces](/core-concepts/game-structure-and-namespaces/)** - the `ScheduleOne.*`
  layout, the Mono (`ScheduleOne.X`) vs IL2CPP (`Il2CppScheduleOne.X`) naming split, the singleton
  access pattern, and how to find a class.
- **[Furniture Grid Paths](/core-concepts/furniture-grid-paths/)** - the canonical list of every
  furniture placement grid across properties and businesses.
- **[Known Harmony Hook Points](/core-concepts/known-hook-points/)** - vanilla methods the community
  has found worth patching (`Registry.Awake`, vehicle enter/exit, name labels, mid-game joins) and what
  each is good for.
- **[Tracking Game Updates](/core-concepts/tracking-game-updates/)** - reading version diffs and using
  CodeArchiver and RefGen to keep mods building across game versions.

For the tools that read this code (decompilers, live inspectors) and the community documentation sites,
see [Tooling & Resources](/tooling/).
