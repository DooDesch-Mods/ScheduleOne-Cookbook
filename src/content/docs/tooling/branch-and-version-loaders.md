---
title: Branch & Version Loaders
description: S1-Loader - a batch tool for managing dual IL2CPP/Mono Schedule I installs via directory junctions and Steam manifest swapping.
sidebar:
  order: 3
---

## S1-Loader (Batch Branch Manager)

Schedule I ships as two backends on different Steam branches (Mono and IL2CPP). Testing a mod on both
normally means constant branch switching and waiting for Steam to re-download. **S1-Loader** keeps both
installs on disk at once and swaps between them without a full redownload.

- Source: [github.com/ifBars/S1-Loader](https://github.com/ifBars/S1-Loader)
- Release: [v1.0.0](https://github.com/ifBars/S1-Loader/releases/tag/v1.0.0)

Instead of manual file copying with little Steam integration, S1-Loader uses **directory junctions** and
**Steam manifest swapping** to give a Steam-integrated dev environment. Steam can still update both
branches and run each with full Steam features, without waiting for it to switch branches. It includes a
backup-management feature.

:::caution
This tool manipulates your game installation and Steam manifests. Use the built-in backup feature - the
author explicitly takes no responsibility for a lost install.
:::

> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1378624200390213662/1378624200390213662)

For a higher-level GUI that also downloads and manages multiple versions (via DepotDownloader) plus
mods and MelonLoader, see [Mod Managers](/tooling/mod-managers/).
