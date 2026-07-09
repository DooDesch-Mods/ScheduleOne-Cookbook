---
title: ScheduleLua
description: A MelonLoader Lua scripting framework (built on MoonSharp) that lets you mod Schedule I without writing C#, with hot-reload and an event-driven script API.
sidebar:
  order: 3
---

**ScheduleLua** is a MelonLoader-based Lua scripting framework for Schedule I. Instead of writing a C#
mod, compiling it, and shipping a DLL, you install ScheduleLua once and then write plain `.lua` scripts
that it loads and runs against the game. It is built on [MoonSharp](https://www.moonsharp.org/) (a Lua
interpreter for .NET) and exposes game functionality to Lua so that people who do not want to touch C#
can still build behaviour, tweaks, and small features.

It is developed by the **ScheduleLua team** (lead dev ifBars) and is currently in **Beta**.

## What it gives you

- **Lua scripting, no C# required.** You write scripts in Lua rather than compiling a .NET assembly.
  There is no Visual Studio project, no build step, and no DLL to package - a script is just a text file.
- **Hot-reload.** Scripts can be reloaded while the game is running, so you edit a `.lua` file, reload,
  and see the change without restarting - a much tighter loop than rebuilding and relaunching a C# mod.
- **An event system.** The framework raises game and lifecycle events that your script subscribes to,
  so your code runs at the right moments instead of polling.
- **A script API for common tasks.** ScheduleLua wraps frequently needed game operations behind Lua
  functions so you are not reverse-engineering the game yourself for everyday things.

The exact event names and the full list of script API functions live in the official docs (linked
below) and evolve with the Beta, so treat the docs as the authoritative reference rather than any single
example.

## Who it is for (and how it compares to S1API)

ScheduleLua is aimed at **quick scripting, prototyping, and modders who do not write C#**. If you want to
try an idea fast, script a small behaviour, or get into modding without setting up a full C# toolchain,
it lowers the barrier a lot.

That is a different job from [S1API](/frameworks/s1api/), which is a **C# library** you reference at
build time and compile against. Rough rule of thumb:

- Reach for **ScheduleLua** when you want to script in Lua, iterate fast with hot-reload, and avoid a
  compile step.
- Reach for **S1API** when you are writing a full C# mod and want a typed, cross-backend API with
  first-class access to items, quests, NPCs, saving, and the rest.

They solve overlapping problems from opposite ends - pick the one that matches how you want to work.

## Installing and getting started

ScheduleLua is a normal mod from the modder's point of view: the **player (or you) installs it** like any
other Schedule I mod - from Thunderstore, through a mod manager, or manually - and then Lua scripts run on
top of it. Follow the framework's own documentation for where scripts live and how to load them, since
those details belong to the framework and can change between Beta releases.

- Docs / getting started: <https://schedulelua.github.io/ScheduleLua-Docs/>

If you are packaging a mod (or a script pack) that requires ScheduleLua, declare it as a dependency in
your `manifest.json` so mod managers pull it in automatically:

```json
{
  "dependencies": ["ScheduleLua-ScheduleLua-<ver>"]
}
```

:::caution[Check the current version]
Replace `<ver>` with the current version. Do not hardcode a specific number from memory - dependency
strings move with each release. Look up the exact, current dependency string on the framework's
[Thunderstore page](https://thunderstore.io/c/schedule-i/p/ScheduleLua/ScheduleLua/) when you write your
manifest.
:::

## Mono vs IL2CPP

Schedule I ships two backends: the default Steam branch is **IL2CPP**, and the "alternate" beta branch is
**Mono**.

:::caution[Branch support]
ScheduleLua's Thunderstore categories list **Mono (alternate branch)**. IL2CPP support is **uncertain** -
verify it against the current release before assuming your IL2CPP setup will work. If you are on the
default IL2CPP branch, confirm compatibility on the framework's Thunderstore and docs pages first.
:::

For the general difference between the two backends and how to switch branches, see
[Getting Started](/getting-started/).

## License

:::caution[GPL-3.0]
ScheduleLua is licensed under **GPL-3.0**. Distributing work that is built on or bundled with GPL-3.0
code carries licensing obligations. If you plan to publish something on top of ScheduleLua, read its
license and make sure your project is compatible. This is a heads-up, not legal advice.
:::

## Links and credit

- Repository: <https://github.com/ifBars/ScheduleLua>
- Organization: <https://github.com/ScheduleLua>
- Documentation: <https://schedulelua.github.io/ScheduleLua-Docs/>
- Thunderstore: <https://thunderstore.io/c/schedule-i/p/ScheduleLua/ScheduleLua/> (dependency
  `ScheduleLua-ScheduleLua-<ver>`)
- Nexus Mods: <https://www.nexusmods.com/schedule1/mods/583>

ScheduleLua is built by the **ScheduleLua team** (lead dev **ifBars**) -
[github.com/ScheduleLua](https://github.com/ScheduleLua).
