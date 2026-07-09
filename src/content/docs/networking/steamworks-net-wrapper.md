---
title: Steamworks.NET Wrapper (SteamNetworkLib)
description: SteamNetworkLib is a Mono/IL2CPP-compatible, object-oriented wrapper over Steamworks.NET for lobby data sync and P2P messaging in MelonLoader mods.
sidebar:
  order: 4
---

:::note
Also listed in [Frameworks & Libraries](/frameworks/).
:::

Working with Steamworks.NET directly (see [Steam lobby data sync](/networking/steam-lobby-data-sync/))
works, but it is verbose and easy to get wrong. **SteamNetworkLib** by Bars (ifBars) is a streamlined,
object-oriented library that wraps Steamworks.NET for MelonLoader mods, so you can sync data between
players in roughly five lines of code. It is the recommended path when you are networking on IL2CPP or
just want lobby sync without the boilerplate.

- Source: <https://github.com/ifBars/SteamNetworkLib>
- Getting started: <https://ifbars.github.io/SteamNetworkLib/docs/introduction.html>
- Thunderstore (Mono): <https://thunderstore.io/c/schedule-i/p/ifBars/SteamNetworkLib_Mono/>
- Thunderstore (IL2CPP): <https://thunderstore.io/c/schedule-i/p/ifBars/SteamNetworkLib_Il2Cpp/>

> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1404754610668961832/1404754610668961832)
> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1404754610668961832/1407602579856429136)

## What it gives you

**Data synchronization**
- Lobby data (global key/value for all players) and member data (per-player, visible to everyone)
- Automatic caching and change detection
- Event-driven updates when data changes

**P2P communication**
- A type-safe message system with automatic serialization
- Broadcast to everyone or send directly to one player
- Built-in message types (Text, DataSync, DataRequest, and more) plus custom types via inheritance

**MelonLoader friendly**
- Minimal setup, automatic resource cleanup on dispose
- Mod compatibility checking and error handling
- Works on both the Mono and IL2CPP branches

It is MIT licensed. You are responsible for complying with Valve's Steamworks SDK license.

## SyncVars: host-authoritative fields

Later versions add a `SyncVar`-style feature - conceptually similar to FishNet's `SyncVar`, but for the
Steam lobby - so you can sync data host-authoritatively in a way that feels a lot like MelonPreferences.
This is additive and does not break existing usage.

- SyncVars docs: <https://ifbars.github.io/SteamNetworkLib/docs/sync-vars.html>

> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1404754610668961832/1456867405287657533)
> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1404754610668961832/1456960898944995542)

## Installing it as a dependency

SteamNetworkLib is a shared library, not a standalone gameplay mod. On IL2CPP it ships as
`SteamNetworkLib-IL2Cpp.dll` and belongs in the game's **`UserLibs`** folder, and mods that depend on it
must state that requirement.

> Source: **Real Name** - [original message](https://discord.com/channels/1349221936470687764/1359340799548199102/1464654049407139956)

:::caution
When installing through Vortex, the packaged DLL could land in the `MelonLoader` folder instead of
`UserLibs`. A FOMOD installer was added to place it correctly - if you install manually, make sure the
DLL ends up in `UserLibs`.
:::

> Source: **Khundian** - [original message](https://discord.com/channels/1349221936470687764/1404754610668961832/1455513402448412799)

## Testing and AI-assisted docs

- You can test mods that use SteamNetworkLib locally with **LocalLobby** (run a host and a client
  instance). See [Local multiplayer testing](/networking/local-multiplayer-testing/).
- Both SteamNetworkLib and S1API are indexed on Context7, so AI coding tools can pull their docs:
  <https://context7.com/ifbars/steamnetworklib>.

> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1404754610668961832/1440589245856088074)
> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1404754610668961832/1440590521495064738)
