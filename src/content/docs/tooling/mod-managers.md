---
title: Mod Managers
description: The Schedule I Mod Manager (SIMM) - a standalone app for managing game versions, branches, and mods.
sidebar:
  order: 2
---

## Schedule I Mod Manager (SIMM)

**SIMM**, also released as the **Schedule I Developer Environment Utility**, is a standalone desktop app
(Electron + React) for managing a Schedule I modding setup. Rather than manually copying game folders
around, it manages installs, branches, MelonLoader, and mods for you.

- Repo: [github.com/SirTidez/Schedule-I-Developer-Environment-Utility](https://github.com/SirTidez/Schedule-I-Developer-Environment-Utility)
- Nexus: [nexusmods.com/schedule1/mods/1750](https://www.nexusmods.com/schedule1/mods/1750)

What it does:

- **Multi-version branch management** - install and manage multiple game versions side by side, each with
  a custom name/description, so you can test a mod against several versions (Mono and IL2CPP branches
  included).
- **Automated installs via DepotDownloader** - downloads game branches through
  [DepotDownloader](https://github.com/steamre/depotdownloader) without touching your normal Steam
  install, with persistent Steam login. This is the supported path going forward (the old manual
  file-copy method has been retired).
- **Automatic MelonLoader install** - installs MelonLoader into a managed environment for you, with
  integrity checks.
- **Mod browsing and installing** - searches both Thunderstore and Nexus and shows only mods compatible
  with the environment's runtime (filtered by Thunderstore tag / Nexus filename).
- **In-app mod config editing** and log viewing.

> Source: **SirTidez** - [original message](https://discord.com/channels/1349221936470687764/1411257624942608535/1411257624942608535)
> Source: **okayso_** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1523364908526206976)

:::note
For managing dual game installs at the file-system level (directory junctions + Steam manifest swapping),
see also [Branch & Version Loaders](/tooling/branch-and-version-loaders/).
:::
