---
title: Networking (FishNet)
description: Multiplayer modding for Schedule I - FishNet RPCs, code generation, Steam lobby sync, Steamworks.NET, and local multiplayer testing.
sidebar:
  order: 0
---

Schedule I is a co-op game built on [FishNet](https://fish-networking.gitbook.io/), a Unity networking
library. When you add multiplayer behaviour to a mod you are working with (or around) FishNet, plus the
underlying Steam lobby that connects players. This section collects the networking topics that come up
most for Schedule I modders.

## What is here

- **[FishNet overview](/networking/fishnet-overview/)** - what FishNet is, the exact version the game
  uses, where to find its docs, and the important Mono-vs-IL2CPP split that decides how you network at
  all.
- **[Custom RPCs and code generation](/networking/custom-rpcs-and-codegen/)** - the NuGet package that
  runs FishNet's code generator outside the Unity editor (required for custom RPCs), how to set it up,
  and the reflection workaround you need so your generated serializers actually register under a mod
  loader.
- **[Steam lobby data sync](/networking/steam-lobby-data-sync/)** - syncing small pieces of data between
  players through the Steam lobby with Steamworks.NET, including the host-to-client vs client-to-host
  recipe.
- **[Steamworks.NET wrapper (SteamNetworkLib)](/networking/steamworks-net-wrapper/)** - a Mono/IL2CPP
  compatible library that wraps Steamworks.NET lobby data and P2P messaging so you can network data in
  a few lines.
- **[Local multiplayer testing](/networking/local-multiplayer-testing/)** - how to run two game
  instances on one machine to test multiplayer, using LocalMultiplayer (native FishNet) or LocalLobby
  (Steam lobbies via a Steam emulator).

## The one thing to know first

FishNet's custom-RPC path works cleanly on the **Mono** branch. On the **IL2CPP** branch that same code
generation does not run, so most IL2CPP mods sync data through the **Steam lobby** instead (directly via
Steamworks.NET or through SteamNetworkLib). Which branch you target changes your whole networking
approach, so read the [FishNet overview](/networking/fishnet-overview/) before you pick one.
