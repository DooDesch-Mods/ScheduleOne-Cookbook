---
title: Local Multiplayer Testing
description: Test Schedule I multiplayer on one machine by running a host and a client instance, using LocalMultiplayer (native FishNet) or LocalLobby (Steam lobbies via a Steam emulator).
sidebar:
  order: 5
---

Multiplayer bugs are hard to catch alone. Two community mods let you run **two game instances on a single
machine** - one host, one client - so you can iterate on networked features without rounding up testers.
There are two tools and they are **not** interchangeable; which one you need depends on how your mod
networks.

## Which tool for which networking

- **LocalMultiplayer** - for the game's **native FishNet** networking, or your own custom **Mono**
  networking. It launches two instances and connects them directly, no Steam involved.
- **LocalLobby** - for **Steamworks** networking (Steam lobby data, P2P, SteamNetworkLib). It creates
  real local Steam lobbies using a Steam emulator. Since Steamworks is effectively the only networking
  option on **IL2CPP**, this is the one IL2CPP mods use.

They are two different mods for two different jobs.

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1359340799548199102/1473399055295189083)
> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1359340799548199102/1473397880008999128)
> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1371432581979045929/1483557285107073127)

## LocalMultiplayer (native FishNet)

Originally made by Skippy for Mono/BepInEx (in the
[RealRadio mod](https://github.com/Skippeh/Schedule1RealRadioMod/tree/main/LocalMultiplayer)); the
MelonLoader IL2CPP and Mono version is maintained by k073l at
<https://github.com/k073l/LocalMultiplayer>.

Install the build for your branch like any other mod. Then drive it with command-line arguments. A batch
file in the game directory is the easiest way to launch both instances:

```bat
start "" "Schedule I.exe" --host --adjust-window --left-offset 0
timeout /t 1
start "" "Schedule I.exe" --join --adjust-window --left-offset 20
```

This starts two instances - host on the left, a short gap, then the client on the right - and
automatically hosts your last-played (or first) save. `--adjust-window` positions/sizes the windows;
`--left-offset` shifts them horizontally. See the repo `README.md` for the full argument list.

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1371432581979045929/1371432581979045929)

:::caution[Back up your save first]
On some game versions the client instance creates a new character that then **overwrites your real
character's save** (missing cash, NPC greetings, etc.). Always test on a throwaway save. A reliable
workaround: **quit the client instance first**, before the host - that keeps your character's save
assigned to you.
:::

> Source: **Overweight Unicorn** - [original message](https://discord.com/channels/1349221936470687764/1371432581979045929/1383591074014171168)

:::note
LocalMultiplayer can go out of date on newer/beta game versions (for example a
`Could not load type '...MusicPlayer'` `TypeLoadException`). LocalLobby has largely superseded it - if
LocalMultiplayer throws on load, try LocalLobby.
:::

## LocalLobby (Steam lobbies)

LocalLobby (also by k073l, <https://github.com/k073l/LocalLobby>) automates creating a local Steam
lobby, loading in, and moving the windows. It requires a **Steam emulator such as Goldberg** so each
instance has its own Steam identity; the two distinct Steam IDs also help avoid the save-overwrite bug
seen with LocalMultiplayer. Full setup is in the repo `README.md`.

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1371432581979045929/1384182846356197478)

:::tip[Host mismatch on join]
If the second instance fails to join with a host-mismatch error even though both game versions match,
**increase the wait between launches** in your batch script - bumping the second instance's delay to
around 15 seconds has fixed it for multiple people. It is a timing issue, not a version issue.
:::

> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1371432581979045929/1465126895988379721)

### No emulator? Use cloud gaming as a second copy

If you cannot run an emulator but have access to a second real copy of the game (for example a family
Steam copy), a cloud-gaming session can act as your second instance for Steamworks testing. Not ideal,
but it works.

> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1359340799548199102/1383080654463565875)

## A real multiplayer test protocol

Local testing catches a lot, but true two-machine, two-Steam-account testing catches the rest (players
getting stuck on sync when loading into a modded save is a classic that only shows up between real
machines). When you ask others to test, give them an exact, reproducible protocol. A gold-standard
example pinned the precise versions, the steps, and the log files to collect:

- **Pin every version:** the game version and branch (e.g. `0.4.2f9` IL2CPP), MelonLoader, S1API, and
  every shared lib your mod needs (e.g. SteamNetworkLib) - all testers on identical builds.
- **Steps:** install, enable any authoring/logging options, restart, add each other on Steam, host
  invites the tester into the modded save, note whether they load in or get stuck on sync.
- **Collect logs from both sides:**
  - `Latest.log`: `...\Steam\steamapps\common\Schedule I\MelonLoader\Latest.log`
  - `Player.log`: `%USERPROFILE%\AppData\LocalLow\TVGS\Schedule I\Player.log`

> Source: **Khundian** - [original message](https://discord.com/channels/1349221936470687764/1359340799548199102/1456389171131453692)
