---
title: External Documentation
description: The documentation sites the Schedule I modding community relies on - community docs, MelonLoader, FishNet, and S1API.
sidebar:
  order: 6
---

Links to the upstream and community documentation worth bookmarking. These are maintained elsewhere - the
wiki points at them rather than duplicating them.

## Community modding docs

- **[s1modding.github.io/docs/moddevs](https://s1modding.github.io/docs/moddevs/)** - the community's
  central Schedule I mod-dev documentation: environment setup, reading game code, ripping the project,
  supporting both branches, and more. When someone asks "where do I start," this is the first link.

> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1445488494192627844)

## MelonLoader

Schedule I mods run on MelonLoader, so its docs are essential:

- **[MelonLoader Wiki (melonwiki.xyz)](https://melonwiki.xyz/#/README)** - the loader's documentation.
  Handy jump-off points:
  - [Quick Start](https://melonwiki.xyz/#/modders/quickstart)
  - [Basic Mod Example](https://melonwiki.xyz/#/modders/quickstart?id=basic-mod-example)
  - [Preferences](https://melonwiki.xyz/#/modders/preferences)
  - [Attributes](https://melonwiki.xyz/#/modders/attributes)
  - [AssetRipper](https://melonwiki.xyz/#/modders/assetripper)

> Source: **Dor** - [original message](https://discord.com/channels/1349221936470687764/1359517806609039543/1359517806609039543)

## FishNet (networking)

Schedule I uses the **FishNet** networking library, and specifically an **older v3** release:

- **[FishNet docs (live)](https://fish-networking.gitbook.io/docs)** - note the live docs are for **v4**;
  Schedule I uses **v3**, so some pages will not match.
- **[FishNet v3 docs (Wayback Machine)](https://web.archive.org/web/20240324100202/https://fish-networking.gitbook.io/docs/)** -
  the archived v3 documentation. Slow, but accurate for the version the game runs.
- A `FishNet.Runtime.xml` doc file exists that you can drop next to `FishNet.Runtime.dll` to get
  IntelliSense/hover docs for FishNet types while working. It is attached to the source thread below.

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1359978396708245675/1359978396708245675)

For how FishNet is used in practice (RPCs, code generation, host authority), see the
[Networking](/networking/) section.

## S1API

Many mods build on **S1API**, a cross-backend modding API. Its reference docs live at:

- **[ifbars.github.io/S1API](https://ifbars.github.io/S1API/)** - API reference and guides.
- **[S1API releases](https://github.com/ifBars/S1API/releases)**

> Source: **Estonia** - [original message](https://discord.com/channels/1349221936470687764/1371588181509537802/1473657098658119893)
