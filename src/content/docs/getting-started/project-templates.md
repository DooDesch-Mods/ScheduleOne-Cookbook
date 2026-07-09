---
title: Project Templates
description: Community-made project templates for Schedule I mods - Mono-only, dual Mono+IL2CPP, and MelonMod starters with packaging and cross-backend helpers.
sidebar:
  order: 3
---

Rather than wire up references, publicizer, conditional compilation and packaging by hand, most people start
from one of the community templates below. Each lives in its own GitHub repo - clone or `dotnet new` it, point
it at your game install, and go. This page summarizes what each gives you; follow the repo README for the
exact setup steps.

## MaxtorCoder - ScheduleOne Plugin Template (Mono, MelonLoader + BepInEx)

A customizable template for Mono plugins that supports **both MelonLoader and BepInEx** via build
configurations, with optional Unity script projects for building AssetBundles.

Install and scaffold with `dotnet new`:

```bash
dotnet new install MaxtorCoder.ScheduleIPluginProjectTemplate
```

```bash
dotnet new s1_plugin -n <modname> \
  --gameroot "<directory to Schedule I>" \
  --unityroot "<directory to your Unity Asset Bundle project>"
```

`--unityroot` is optional (leave it off if you don't need AssetBundle scripts). A later update uses the
[FishNetV3.CodeGenerator.MSBuild](https://www.nuget.org/packages/FishNetV3.CodeGenerator.MSBuild) NuGet
package instead of bundling the FishNet code-gen tool.

- Repo: [MaxtorCoder/ScheduleOnePluginTemplate](https://github.com/MaxtorCoder/ScheduleOnePluginTemplate)
- NuGet: [MaxtorCoder.ScheduleIPluginProjectTemplate](https://www.nuget.org/packages/MaxtorCoder.ScheduleIPluginProjectTemplate/)

> Source: **MaxtorCoder** - [original message](https://discord.com/channels/1349221936470687764/1361343204565188668/1361343204565188668)

## Deeej - S1 Mono+IL2CPP Template

A clean clone-and-edit template with **conditional compilation for both Mono and IL2CPP** in one project.
Good pick if you want AssetBundles, since it ships the loader for you.

What it gives you:

- Conditional compilation example for IL2CPP + Mono
- Publicizer already set up (with example entries)
- `AssetBundleUtils` for loading asset bundles (handy for UI)
- Bundled `UnityEngine.Il2CppAssetBundleManager.dll` for AssetBundle loading under IL2CPP
- Commented `.csproj` - read the comments

To use it: clone the repo, open the `.csproj`, change `S1Dir` to your Mono and IL2CPP folders, and read the
`.csproj` comments. You can change the assembly name and default namespace under project properties.

- Repo: [weedeej/S1MONO_IL2CPP_Template](https://github.com/weedeej/S1MONO_IL2CPP_Template)

> Source: **Deeej** - [original message](https://discord.com/channels/1349221936470687764/1373836030758748253/1373836030758748253)

## k073l - Yet Another MelonMod Template (both branches)

A `dotnet new` template focused on game-type modding with **cross-backend helpers and packaging scripts**
built in. Install it and use your IDE's new-solution wizard (be sure to check the advanced options):

```bash
dotnet new install k073l.S1MelonMod
```

What it gives you:

- Basic mod structure plus helper methods for cross-backend compatibility (e.g. `List.ToNativeList<T>()` to
  convert to the current backend's native list, and a `WaitForCondition` coroutine helper)
- IL2CPP (`none`/`beta` branch) and Mono (`alternate`/`alternate-beta` branch) support from one project
- Build-and-test flow: pick a configuration, build, and the matching game build launches automatically
  (e.g. `Debug IL2CPP` builds and launches the IL2CPP game with debug options)
- Optional auto-loading of common testing mods (UnityExplorer, LocalMultiplayer) by
  commenting/uncommenting `.csproj` lines
- Thunderstore + NexusMods packaging script, and a README-to-Nexus-description converter

The template's post-build step uses [uv](https://docs.astral.sh/uv/) (it copies the built DLL and any
requested testing mods), so install `uv` for the smoothest experience.

- Repo: [k073l/S1MelonModTemplate](https://github.com/k073l/S1MelonModTemplate)
- NuGet: [k073l.S1MelonMod](https://www.nuget.org/packages/k073l.S1MelonMod)

For AssetBundle-heavy mods, Deeej's template above is the better starting point.

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1374472454029967431/1374472454029967431)
> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1374472454029967431/1457496074859057309)
> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1492514498211221574)

## ifBars - S1API Template

If you plan to build on top of [S1API](https://ifbars.github.io/S1API/) (the cross-version helper library),
there is a dedicated starter template. It leans on S1API so you write less branch-specific code.

- Repo: [ifBars/S1APITemplate](https://github.com/ifBars/S1APITemplate)

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1504525422908412045)

:::tip[Starting-out advice]
Learn C#, and if you use AI/Copilot, make sure you understand every line yourself. The community strongly
recommends **using S1API** where you can - it gives cross-version support without reverse-engineering the game
source. Read other mods' source too (many are open on GitHub and Thunderstore) to see real patterns.
:::

> Source: **Pranjal** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1366844216445108255)
