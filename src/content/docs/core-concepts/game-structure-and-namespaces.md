---
title: Game Structure & Namespaces
description: How Schedule I's code is organized - the ScheduleOne.* namespace layout, the Mono vs IL2CPP naming split, and how to find classes.
sidebar:
  order: 1
---

Almost all of Schedule I's own code lives in one assembly, `Assembly-CSharp`, under the root
namespace `ScheduleOne`. Everything you patch, read, or subclass hangs off that tree. This page maps
out the layout so you can guess where a class lives before you even open a decompiler.

## Two backends, two namespace prefixes

The game ships in two flavours depending on the Steam branch, and the backend decides how every game
type is named:

| Steam branch | Backend | Root namespace |
|---|---|---|
| `alternate`, `alternate-beta` | Mono | `ScheduleOne.*` |
| `main`, `beta` | IL2CPP | `Il2CppScheduleOne.*` |

The class tree is otherwise identical - `ScheduleOne.PlayerScripts.Player` on Mono is
`Il2CppScheduleOne.PlayerScripts.Player` on IL2CPP. IL2CPP mods and Mono mods are not
interchangeable: they use different runtimes and compilation methods (IL2CPP compiles to native code
via C++, Mono runs IL on a JIT), so a DLL built against one prefix will not load on the other. When
you see an error like `Could not resolve type ... 'Il2CppScheduleOne....'`, a Mono/IL2CPP mismatch is
almost always the cause. For choosing a backend and setting up conditional compilation, see
[Getting Started](/getting-started/).

> Source: **Estonia** - [original message](https://discord.com/channels/1349221936470687764/1371588181509537802/1417276043261116566)

## The main namespace map

The `ScheduleOne` root splits into feature areas. These are the ones you will reach for most (drop the
`Il2Cpp` prefix mentally on Mono; add it back on IL2CPP):

| Namespace | What lives here |
|---|---|
| `ScheduleOne.DevUtilities` | The singleton base classes (`Singleton<T>`, `NetworkSingleton<T>`, `PlayerSingleton<T>`) that most managers use |
| `ScheduleOne.PlayerScripts` | `Player`, `PlayerInventory`, `PlayerMovement`, `PlayerCamera` |
| `ScheduleOne.PlayerScripts.Health` | `PlayerHealth` and health-related logic |
| `ScheduleOne.ItemFramework` | `ItemDefinition`, `ItemInstance`, `StorableItemDefinition` - the item system |
| `ScheduleOne.Product` / `ScheduleOne.Product.Packaging` | Product definitions and packaging |
| `ScheduleOne.NPCs` (`.Behaviour`, `.Actions`, `.Schedules`, `.Relation`) | NPC characters, AI behaviours, schedules, relationships |
| `ScheduleOne.Economy` / `ScheduleOne.Money` | Customers, deals, cash and online balance |
| `ScheduleOne.Property` | Owned properties and businesses |
| `ScheduleOne.Vehicles` (`.AI`, `.Modification`) | `LandVehicle` and vehicle systems |
| `ScheduleOne.Law` / `ScheduleOne.Police` | Crime, wanted level, police behaviour |
| `ScheduleOne.Map` | World map, POIs, regions |
| `ScheduleOne.UI` (`.Phone`, `.Shop`, `.Handover`, `.MainMenu`, ...) | All in-game UI, including the phone apps |
| `ScheduleOne.Persistence` | Save/load system and save-data classes |
| `ScheduleOne.Quests` | Quests and quest entries |
| `ScheduleOne.Networking` | FishNet networking glue |
| `ScheduleOne.Growing` / `ScheduleOne.StationFramework` | Growing pots, seeds and crafting stations |
| `ScheduleOne.AvatarFramework` (`.Customization`, `.Equipping`) | Character avatars, appearance layers, clothing |
| `ScheduleOne.ObjectScripts` | World object behaviours (soil, cash, watering can, mix operations) |

There are many more (`ScheduleOne.Audio`, `ScheduleOne.GameTime`, `ScheduleOne.Storage`,
`ScheduleOne.Employees`, `ScheduleOne.Casino`, `ScheduleOne.Cartel`, and so on) - the tree closely
mirrors the game's features, so browse by the area you care about.

## The singleton access pattern

Most game managers are exposed as singletons through `ScheduleOne.DevUtilities`. Once you know the
pattern you can reach almost any manager in one line:

```csharp
using ScheduleOne.DevUtilities;
using ScheduleOne.PlayerScripts;

// Plain singleton managers
var registry = Singleton<Registry>.Instance;

// Player-owned singletons
var inventory = PlayerSingleton<PlayerInventory>.Instance;

// Networked singletons (host-authoritative managers)
// NetworkSingleton<T>.Instance
```

`Player` also exposes handy statics like `Player.Local` and `Player.PlayerList` for the local and all
connected players.

> Source: **Raining_Death** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1436486492158693386)

## Finding a class

- **Decompile the game.** Open `Assembly-CSharp.dll` in dnSpy/ILSpy and browse the `ScheduleOne`
  namespace. See [Decompilers & Inspection](/tooling/decompilers-and-inspection/).
- **Read the Mono build for logic.** Even if you ship for IL2CPP, the Mono assembly has readable
  method bodies; the IL2CPP dump gives you exact signatures and member names. The community docs cover
  this at [s1modding.github.io/docs/moddevs/reading_game_code](https://s1modding.github.io/docs/moddevs/reading_game_code/).
- **Inspect the live game.** UnityExplorer lets you browse the actual scene, find the class attached
  to an object, and prototype before writing a patch.

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1496836882854576189)
