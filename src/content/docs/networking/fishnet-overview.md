---
title: FishNet Overview
description: What FishNet is, the version Schedule I uses, where to read its docs, and the Mono vs IL2CPP split that shapes all multiplayer modding.
sidebar:
  order: 1
---

Schedule I's multiplayer runs on [FishNet](https://fish-networking.gitbook.io/), a free open-source
networking solution for Unity. FishNet handles the connection between host and clients, spawning of
networked objects (`NetworkObject`), synchronized fields (`SyncVar`/`SyncObject`), and remote procedure
calls (RPCs). If you have seen `ServerRpc`, `ObserversRpc`, `TargetRpc`, `NetworkBehaviour`, or
`InstanceFinder` while decompiling the game, that is FishNet.

## Which version the game uses

Schedule I uses **FishNet v3**. This matters because the current live FishNet documentation is for
**v4**, which has diverged.

- Live docs (v4, not what the game runs): <https://fish-networking.gitbook.io/docs>
- Archived v3 docs on the Wayback Machine (readable but slow):
  <https://web.archive.org/web/20240324100202/https://fish-networking.gitbook.io/docs/>

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1359978396708245675/1359978396708245675)
> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1359978396708245675/1360904601565659248)

## Get IntelliSense for FishNet types

FishNet ships as `FishNet.Runtime.dll` in the game, but with no XML doc file next to it you get no
inline documentation while coding. A `FishNet.Runtime.xml` file exists that you can drop next to the
`FishNet.Runtime.dll` you reference; your IDE will then show documentation for FishNet classes,
properties, and methods as you type. The file is shared in the FishNet documentation thread on the
modding Discord.

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1359978396708245675/1361693258681417850)

## The Mono vs IL2CPP split (read this before you start)

How you do networking depends entirely on which branch your mod targets. This single decision shapes
everything else in this section.

### Mono branch

On Mono you can write normal FishNet code - custom RPCs, `NetworkBehaviour` subclasses, and custom
serializers. FishNet needs a code-generation step that normally only runs inside the Unity editor, so
you add a NuGet package that runs it during your build. See
[Custom RPCs and code generation](/networking/custom-rpcs-and-codegen/).

### IL2CPP branch

On IL2CPP the FishNet code generator does not run against your mod assembly, so the clean custom-RPC
path is effectively unavailable.

> Source: **j0ckinjz** - [original message](https://discord.com/channels/1349221936470687764/1359340799548199102/1383148447602835506)

Two practical routes remain:

1. **Sync through the Steam lobby instead of FishNet.** This is what most IL2CPP multiplayer mods do:
   put small pieces of state into Steam lobby data / member data, or use P2P messaging. See
   [Steam lobby data sync](/networking/steam-lobby-data-sync/) and the
   [SteamNetworkLib wrapper](/networking/steamworks-net-wrapper/).
2. **Hand-roll FishNet interop.** It is possible to drive FishNet directly under IL2CPP by manually
   building broadcasts and initializing the internal RPC/SyncVar tables yourself, but it is fiddly and
   was reported as unreliable. The advanced notes are in
   [Custom RPCs and code generation](/networking/custom-rpcs-and-codegen/#il2cpp-there-is-no-code-generator).

:::note
Mono namespaces are `FishNet.*` and `ScheduleOne.*`. On IL2CPP the same types appear under
`Il2CppFishNet.*` and `Il2CppScheduleOne.*`, and any objects you pass through FishNet must be IL2CPP
types (see the IL2CPP interop notes on the RPC page).
:::
