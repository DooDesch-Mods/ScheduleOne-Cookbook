---
title: Frameworks & Libraries
description: How library, API, and framework mods work in Schedule I, plus a map of the ones worth building on - S1API, S1MAPI, ScheduleLua and more.
sidebar:
  order: 0
---

A **framework**, **API**, or **library** mod is a mod you build *on top of* rather than one a player
runs for fun. It ships reusable building blocks - a stable API over the game, a UI toolkit, a
networking wrapper, a scripting runtime - so that your mod can skip the boring, fragile parts and get
straight to the feature you actually want to make.

Building on a library instead of raw game code buys you three things:

- **Less reverse-engineering.** The library already found the classes, singletons, and hook points, and
  hides them behind a clean, documented API.
- **One codebase for both branches.** A good cross-compatibility layer (like S1API) lets the same source
  compile for **Mono** and **IL2CPP** instead of maintaining two forks.
- **Shielding from game-version churn.** When an update renames or moves the game's internals, the
  library absorbs the change so your mod keeps working with little or no edit.

This section is a hub. It explains the dependency pattern once, maps the libraries worth knowing, and
links out to the deep pages. It does not re-document each library in place.

## How library / dependency mods work

Every library mod follows the same three-part pattern.

**1. The player installs the library like any other mod.** It comes from Thunderstore, a mod manager,
or a manual drop into the `Mods` folder. Your mod declares it as a **dependency** in `manifest.json` so
that mod managers pull it in automatically:

```json
{
  "name": "MyMod",
  "version_number": "1.0.0",
  "website_url": "https://github.com/you/MyMod",
  "description": "My mod, built on S1API.",
  "dependencies": [
    "ifBars-S1API_Forked-3.0.22"
  ]
}
```

**2. You reference the library at build time without shipping it.** Either pull it from NuGet with a
`<PackageReference>`, or reference the DLL directly with `<Private>false</Private>`:

```xml
<!-- Option A: NuGet (recommended for external devs) -->
<ItemGroup>
  <PackageReference Include="S1API.Forked" Version="*" />
</ItemGroup>
```

```xml
<!-- Option B: direct DLL reference (how the DooDesch mods do it) -->
<ItemGroup>
  <Reference Include="S1API.Il2Cpp.MelonLoader">
    <HintPath>$(GameDir)/Mods/S1API.Il2Cpp.MelonLoader.dll</HintPath>
    <Private>false</Private>
  </Reference>
</ItemGroup>
```

`<Private>false</Private>` means "compile against this assembly but do not copy it into my output." The
DLL is *not* bundled with your mod - it is provided at runtime by the library mod the player installed.
Bundling your own copy risks loading a second, mismatched version of the assembly.

**3. At runtime the library loads first, then your mod calls into it.** Library mods usually load early
so their API is ready before your code runs. S1API, for example, declares
`[assembly: MelonPriority(int.MinValue)]` so it is initialised before everything else. Your mod just
calls the API.

:::caution[Version strings move fast]
The `manifest.json` dependency string (`ifBars-S1API_Forked-3.0.22` above) and the NuGet version pin a
specific release, and those numbers change with every update - a library's Thunderstore, NuGet, and
GitHub versions are often not even in lockstep. **Always check the current version on the library's
[Thunderstore page](https://thunderstore.io/c/schedule-i/)** and use that exact string; do not copy the
number here as if it were permanent. For Thunderstore manifests, the dependency string on the library's
Thunderstore page is the authoritative one.
:::

## The library map

Each row links to its full page on this wiki (or to the section that already documents it). Deep details,
examples, and full credits live there.

| Library | What it gives you | Mono / IL2CPP | License | Where to read |
| --- | --- | --- | --- | --- |
| S1API | Cross-branch game API: items, NPCs, quests, money, phone apps, save data, and more | Mono + IL2CPP | MIT | [S1API](/frameworks/s1api/) |
| S1MAPI | Runtime procedural meshes, structure building, and glTF / GLB loading | Mono + IL2CPP | GPL-3.0 | [S1MAPI](/frameworks/s1mapi/) |
| ScheduleLua | Lua scripting framework - mod the game without writing C# | Mono (IL2CPP unverified) | GPL-3.0 | [ScheduleLua](/frameworks/schedulelua/) |
| SteamNetworkLib | Object-oriented wrapper over Steamworks.NET for lobby data and P2P messaging | Mono + IL2CPP | See repo | [Steamworks.NET wrapper](/networking/steamworks-net-wrapper/) |
| FishNetV3 code generator | Runs FishNet's code generator outside Unity so custom RPCs work | Mono | See repo | [Custom RPCs & code-gen](/networking/custom-rpcs-and-codegen/) |
| bGUI | Builder-styled uGUI for runtime-created interfaces | Mono + IL2CPP | See repo | [bGUI UI wrapper](/unity-assetbundles/unity-gui-wrapper/) |
| Il2CppAssetBundleManager | Load Unity AssetBundles under IL2CPP | IL2CPP | See repo | [Loading AssetBundles](/unity-assetbundles/loading-assetbundles/) |
| ModsApp | In-game phone app to view loaded mods and edit their MelonPreferences | Mono + IL2CPP (via S1API) | MIT | [More libraries](/frameworks/more-libraries/) |
| Cute And Funny Framework | Debug tools, multi-page UI apps, experimental NPC spawning | IL2CPP | MIT | [More libraries](/frameworks/more-libraries/) |
| XUnity.AutoTranslator | General Unity auto-translation framework (localization) | Mono + IL2CPP | See repo | [More libraries](/frameworks/more-libraries/) |
| ScheduleOne-L10n | Single-file localization library (OS language + editable JSON files) | Mono + IL2CPP | See repo | [More libraries](/frameworks/more-libraries/) |
| QrLite | Dependency-free single-file QR encoder | Any (pure C#) | MIT | [More libraries](/frameworks/more-libraries/) |
| Hotline | One unified in-game debug-HUD overlay and a single master key for all mods | Mono + IL2CPP | See repo | [More libraries](/frameworks/more-libraries/) |
| FullHouse | Single-file "raise the 4-player cap" engine | Mono + IL2CPP | See repo | [More libraries](/frameworks/more-libraries/) |

:::caution[Branch and license before you commit]
Two things to check before you take a dependency:

- **Branch.** Schedule I's default Steam branch is **IL2CPP**; the "alternate" beta branch is **Mono**.
  A library that only supports one branch limits which players can run your mod. ScheduleLua in
  particular lists Mono support - verify IL2CPP on its current release before relying on it.
- **License.** Building against a **GPL-3.0** library (S1MAPI, ScheduleLua) has licensing implications
  for your own mod that MIT and other permissive licenses do not. Check each library's license and
  decide what you are comfortable with - this is a heads-up, not legal advice.
:::

## Foundations

Before any of the libraries above, every Schedule I mod sits on a small base stack. These are documented
elsewhere in this wiki - do not confuse them with the optional libraries above.

:::note[The base stack]
- **MelonLoader** (LavaGang) - the mod loader itself. Start at [Getting Started](/getting-started/);
  loader docs live at [melonwiki.xyz](https://melonwiki.xyz/).
- **Harmony** (Pardeike) - runtime method patching, shipped with MelonLoader. See
  [IL2CPP patching](/il2cpp/patching/) and
  [avoiding double-patching](/best-practices/harmony-double-patching/); docs at
  [harmony.pardeike.net](https://harmony.pardeike.net/).
- **FishNet V3** (FirstGearGames) - the game's networking library. See the
  [FishNet overview](/networking/fishnet-overview/).
- **Steamworks.NET** - Steam integration (SteamNetworkLib wraps it). See
  [Steam lobby data sync](/networking/steam-lobby-data-sync/).
:::

## Credits

Each library below is credited to its author with a repository link. Where a library was shared in the
community Discord, the original message is linked as the source.

- **S1API** - [ifBars](https://github.com/ifBars/S1API), forked from the original by KaBooMa
  ([KaBooMa/S1API](https://github.com/KaBooMa/S1API)).
- **S1MAPI** - [ifBars](https://github.com/ifBars/S1MAPI).
- **ScheduleLua** - the [ScheduleLua team](https://github.com/ScheduleLua), lead dev ifBars.
- **SteamNetworkLib** - [ifBars](https://github.com/ifBars/SteamNetworkLib).
- **FishNetV3 code generator** - Skipcast; see [Custom RPCs & code-gen](/networking/custom-rpcs-and-codegen/).
- **bGUI** - [ifBars](https://github.com/ifBars/bGUI).
- **Il2CppAssetBundleManager** - LavaGang, with a BepInEx port by XmusJackson; see
  [Loading AssetBundles](/unity-assetbundles/loading-assetbundles/).
- **ModsApp** - [k073l](https://github.com/k073l/s1-modsapp).
- **Cute And Funny Framework** - [FearAndDelight](https://github.com/FearAndDelight/Cute-Funny-Framework).
- **XUnity.AutoTranslator** - [bbepis](https://github.com/bbepis/XUnity.AutoTranslator).
- **ScheduleOne-L10n** - [DooDesch](https://github.com/DooDesch-Mods/ScheduleOne-L10n).

  > Source: **DooDesch** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1524366722491219989)
- **QrLite** - [DooDesch](https://github.com/DooDesch/QrLite).

  > Source: **DooDesch** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1524433021392912434)
- **Hotline** - [DooDesch](https://github.com/DooDesch-Mods/ScheduleOne-Hotline).
- **FullHouse** - [DooDesch](https://github.com/DooDesch-Mods/ScheduleOne-Stash).
