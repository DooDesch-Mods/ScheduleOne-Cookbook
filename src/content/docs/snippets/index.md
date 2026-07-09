---
title: Code Snippets
description: Drop-in C# snippets for Schedule I mods, grouped by area - items, NPCs, vehicles, UI, world and config.
sidebar:
  order: 0
---

Reusable C# the community has shared, cleaned up and grouped by area. Each snippet keeps its original
author's credit and a link back to the source message. Copy, adapt, ship.

## Pages in this section

- **[Items & Inventory](/snippets/items-inventory/)** - a pickup that gives stacks of items, and a custom
  avatar equippable via Harmony.
- **[NPCs](/snippets/npcs/)** - a hotkey helper that prints your live world coordinates, handy for
  placing NPCs and props.
- **[Vehicles](/snippets/vehicles/)** - a drop-in `VehicleEvents` singleton that replaces the removed
  `LandVehicle.onPlayerEnter/ExitVehicle` events.
- **[UI & Phone Apps](/snippets/ui-apps/)** - a full basic phone-app UI builder and the phone canvas
  dimensions.
- **[Properties & World](/snippets/world-properties/)** - checking owned properties and reacting to
  ownership changes, plus the furniture placement-grid path reference.
- **[Preferences & Config](/snippets/preferences-config/)** - a MelonPreferences live-apply hot-reload
  helper, per-save configuration, and running code after the savegame loads.
- **[Utilities](/snippets/utilities/)** - small helpers: a 16-bit AssetBundle hash for networked prefabs
  and a raycast ground detector.

## A note on game versions and branches

Snippets were written against the game version current at the time they were shared. Where a snippet is
known to depend on a specific build, that is called out with a caution. Always sanity-check against the
current game before shipping.

Most of these use the **Mono** namespaces (`ScheduleOne.*`). On the **IL2CPP** branch the same types live
under `Il2Cpp`-prefixed namespaces (`Il2CppScheduleOne.*`) and often need interop care - see the
[IL2CPP](/il2cpp/) section. Where a snippet is branch-specific, it says so.
