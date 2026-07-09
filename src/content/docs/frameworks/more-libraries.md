---
title: More Libraries and Frameworks
description: A roundup of the smaller Schedule I libraries, frameworks, and helpers - what each gives you, its branch and license, and where to read more.
sidebar:
  order: 4
---

The big three (S1API, S1MAPI, ScheduleLua) each have their own page in this section. This page is the
roundup: the smaller frameworks, in-game tools, and drop-in helpers that are worth knowing about but do
not need a page each. For every entry you get the short version - what it does, which branch it targets,
its license, where to get it, and who made it.

:::note[Dependency strings move fast]
Where an entry has a Thunderstore dependency string it is written with a `<ver>` placeholder (for
example `k0Mods-ModsApp-<ver>`). Do not paste a hardcoded version into your `manifest.json` - open the
library's Thunderstore page and copy the current version string from there. The same goes for the exact
package version you reference at build time.
:::

## ModsApp

An in-game phone App that lists every loaded mod and lets players view and edit its settings live -
MelonPreferences and JSON config, covering bool, int, enum, vector3, string, float, keycode, color,
list, and dict values, with categories, search, and the ability to enable or disable mods. It is built
**on top of S1API** (it declares the S1API fork `>= 3.0.1` as a dependency), so it inherits S1API's
**Mono + IL2CPP** cross-compatibility.

- License: **MIT**
- Repo: <https://github.com/k073l/s1-modsapp>
- Thunderstore: <https://thunderstore.io/c/schedule-i/p/k0Mods/ModsApp/> (dependency `k0Mods-ModsApp-<ver>`)

If your mod exposes MelonPreferences, ModsApp will surface them for free. To make your mod respond the
moment a player changes a value there, see [Treat config changes as live-apply](/best-practices/live-apply-config/)
and the [preferences and config snippets](/snippets/preferences-config/).

> Author: **k073l** (Thunderstore org `k0Mods`) - <https://github.com/k073l/s1-modsapp>

## Cute And Funny Framework

A framework - namespace `Cunny`, nicknamed "Cunny" - aimed at more involved features than a single mod
usually needs: debugging tools, a multi-page UI app-creation system, and experimental NPC spawning,
schedules, and cosmetics. Targets the **IL2CPP** branch (Mono is not indicated).

- License: **MIT**
- Repo: <https://github.com/FearAndDelight/Cute-Funny-Framework>
- Thunderstore: <https://thunderstore.io/c/schedule-i/p/FearAndDelight/Cute_And_Funny_Framework/> (dependency `FearAndDelight-Cute_And_Funny_Framework-<ver>`)

:::caution
The framework describes parts of itself as experimental. Treat the NPC-spawning and cosmetics APIs as
subject to change, and re-check the repository's `LICENSE.txt` for the current terms before you build on it.
:::

> Author: **FearAndDelight** - <https://github.com/FearAndDelight/Cute-Funny-Framework>

## XUnity.AutoTranslator

A general-purpose auto-translation framework for Unity games, including **IL2CPP** builds. It is not
Schedule I specific - it hooks Unity's text rendering to translate on the fly - but it is the go-to
option when you want broad, automatic translation coverage rather than hand-authored strings. If you want
localization that you control string-by-string inside your own mod, use ScheduleOne-L10n (below) instead.

- License: see the repository
- Repo: <https://github.com/bbepis/XUnity.AutoTranslator>

> Author: **bbepis** - <https://github.com/bbepis/XUnity.AutoTranslator>

## ScheduleOne-L10n

A single-file localization library for Schedule I mods. The game itself has no language setting, so the
library defaults to the player's OS language and lets them override it with a `[DooDesch] Language`
preference. Translations live in player-editable JSON files, so anyone can add or fix a language without
touching your code. Because it is a single C# source file you compile into your own mod, it runs on
whichever branch your mod targets (**Mono or IL2CPP**).

- License: see the repository
- Repo: <https://github.com/DooDesch-Mods/ScheduleOne-L10n>

> Author: **DooDesch** - <https://github.com/DooDesch-Mods/ScheduleOne-L10n>
> Source: **DooDesch** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1524366722491219989)

## QrLite

A tiny, dependency-free single-file C# QR-code encoder (byte mode, error-correction level L, versions
1 through 10), extracted from the Snitch mod's "connect a phone" flow. It has no game or Unity dependency
at all, so it drops into any mod on either branch and just encodes bytes into a QR matrix you can draw
however you like.

- License: **MIT**
- Repo: <https://github.com/DooDesch/QrLite>

> Author: **DooDesch** - <https://github.com/DooDesch/QrLite>
> Source: **DooDesch** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1524433021392912434)

## Hotline

A framework mod that gives every other mod one shared in-game debug overlay behind a single master key,
instead of each mod inventing its own HUD and hotkey. Mods register their panel through `Hotline.Api`,
and they do not need a hard dependency on Hotline to do it - if Hotline is present the panel shows up in
the shared overlay, and if it is not, nothing breaks. Its only dependency is **MelonLoader**.

- License: see the repository
- Repo: <https://github.com/DooDesch-Mods/ScheduleOne-Hotline>

> Author: **DooDesch** - <https://github.com/DooDesch-Mods/ScheduleOne-Hotline>

## FullHouse

A single-file "raise the 4-player cap" engine. It resizes the lobby and calls Steam's member-limit API,
and cooperates with other copies of itself using a highest-wins rule so two mods that both raise the cap
do not fight. It is dual-use: link the source straight into your mod, or ship the standalone
`FullHouse.dll` and reference that. This is a networking-adjacent library - see the
[Networking section](/networking/) for the surrounding multiplayer topics.

- License: see the repository
- Source: <https://github.com/DooDesch-Mods/ScheduleOne-Stash> (in the shared `ScheduleOne-Stash` repo)

> Author: **DooDesch** - <https://github.com/DooDesch-Mods/ScheduleOne-Stash>

## Covered elsewhere

These libraries already have full pages in other sections. One line each so you can find them - follow
the link for the detail:

- **SteamNetworkLib** (by ifBars) - object-oriented wrapper over Steamworks.NET for lobby data sync and
  P2P messaging. See [Steamworks.NET wrapper](/networking/steamworks-net-wrapper/).
- **FishNetV3.CodeGenerator.MSBuild** (by Skipcast) - runs FishNet's code generator at build time so
  custom RPCs work outside the Unity editor. See [Custom RPCs and code generation](/networking/custom-rpcs-and-codegen/).
- **bGUI** (by ifBars) - a Unity uGUI wrapper for building in-game UI from mods. See
  [Unity GUI wrapper](/unity-assetbundles/unity-gui-wrapper/).
- **Il2CppAssetBundleManager** (by LavaGang; BepInEx port by XmusJackson) - loads Unity AssetBundles
  under IL2CPP. See [Loading AssetBundles](/unity-assetbundles/loading-assetbundles/).
- **MLVScan** (by ifBars, GPL-3.0) - a MelonLoader security plugin that scans installed mods for
  malicious patterns. It is a tool you run, not an API you code against, so there is nothing to
  reference at build time; install it from Thunderstore (dependency `ifBars-MLVScan-<ver>`).
