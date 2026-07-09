---
title: S1API
description: The cross-branch, cross-version modding API for Schedule I - what it covers, how to depend on it, and verified starter examples.
sidebar:
  order: 1
---

**S1API** is a modding API and cross-compatibility layer for Schedule I. Instead of reverse-engineering
the game and re-doing it every patch, you write against S1API's clean, stable surface and it absorbs the
game's internal churn for you. It is, for most mods, the single biggest lever you have: one codebase runs
on **both** game branches, you write far less version-specific code, and a game update is much less likely
to break you.

If you take one recommendation from this whole section, it is this - build on S1API where you can.

- Repo: [ifBars/S1API](https://github.com/ifBars/S1API) (the actively maintained fork)
- Docs: [ifbars.github.io/S1API](https://ifbars.github.io/S1API/) (full per-class reference)
- License: **MIT**

:::note[Two branches, one API]
Schedule I ships two runtimes: the **default Steam branch is IL2CPP**, and the **"alternate" beta branch
is Mono**. Mods normally have to be written twice or ship two builds. S1API's entire reason to exist is
that you write once and it works on both. See [Mono vs IL2CPP](/getting-started/mono-vs-il2cpp/) for the
background.
:::

## Why it is the biggest lever

- **Less reverse-engineering.** S1API already wraps the game's items, NPCs, quests, money, phone, world,
  law and more behind plain C# types, so you call a method instead of digging through decompiled code.
- **Mono + IL2CPP from one codebase.** No `#if` walls in your mod, no `Il2Cpp*` types leaking into your
  logic - S1API hides that entirely.
- **Version resilience.** When the game shuffles its internals, the library is what breaks and gets
  fixed - your mod keeps compiling against the same S1API surface.

## How it works across branches and versions

You do not have to understand the internals to use S1API, but knowing the shape helps when you read its
source (and its `.cs` signatures are the source of truth - see the caution below).

- **Four build configurations.** S1API builds as `MonoMelon`, `MonoBepInEx`, `Il2CppMelon` and
  `Il2CppBepInEx` (Mono targets `netstandard2.1`, IL2CPP targets `net6.0`). Every game-facing file uses
  `#if` to alias the game namespace - `Il2CppScheduleOne.*` on IL2CPP versus `ScheduleOne.*` on Mono -
  behind a single alias, so **your** mod never sees an `Il2Cpp*` type.
- **`CrossType` unifies the runtime-different operations.** The three casts/type checks that behave
  differently per backend are funneled through `S1API.Internal.Utils.CrossType`: `CrossType.Of<T>()`,
  `CrossType.Is<T>(obj, out T)` and `CrossType.As<T>(obj)`.
- **Static facades wrap game singletons and events.** For example `GameLifecycle` re-exposes the game's
  `LoadManager` / `SaveManager` `UnityEvent`s as plain C# `event Action`, so you subscribe with normal
  C# instead of touching Unity events across two runtimes.
- **It ships both compiled DLLs plus a loader.** The package contains the Mono and the IL2CPP assemblies
  and an `S1APILoader` MelonPlugin that calls `MelonUtils.IsGameIl2Cpp()` at startup, enables the correct
  DLL and disables the other. S1API also declares `[assembly: MelonPriority(Int32.MinValue)]` so it loads
  first, before the mods that depend on it.

## Module map

S1API is broad. This is a capability map, not an exhaustive class list - for every member and overload,
read the [official docs](https://ifbars.github.io/S1API/). Namespaces below are the public entry points;
`S1API.Internal.*` is marked "do not use directly".

| Area | Key entry points | What it gives you |
| --- | --- | --- |
| Lifecycle & save | `S1API.Lifecycle.GameLifecycle`, `S1API.Saveables.Saveable` | Load/save events (`OnPreLoad`, `OnLoadComplete`, `OnPreSceneChange`, `OnSaveInfoLoaded`, `OnSaveStart`, `OnSaveComplete`); mark fields `[SaveableField("name")]` for auto JSON persistence (auto-discovered by reflection, `SaveableLoadOrder.BeforeBaseGame` / `AfterBaseGame`, `Saveable.RequestGameSave()`). |
| Items & inventory | `S1API.Items.ItemManager`, `S1API.Items.Storable.ItemCreator`, `ItemCategory` | `GetDefinition`, `RegisterItem`, `EnsureItemRegistered`; `CreateItem(...)`, `CreateBuilder()`, `CloneFrom(id)`; definition builders for Storable / Quality / Clothing / Additive / Buildable / MixIngredient / Equippable. |
| Products & effects | `ProductDefinition` / `ProductManager`, `WeedDefinition`, `CocaineDefinition`, `MethDefinition`, `ShroomDefinition`, `MixReactions`, `CustomEffect` / `CustomEffectBuilder` / `EffectCreator` | Define custom drugs/products and mix reactions; `~40` built-in effect tokens plus fully custom effects. |
| NPCs & entities | `S1API.Entities.NPC`, `S1API.Entities.Player` | Derive custom NPCs (appearance, dialogue, inventory, movement, relationships, schedules) with customer / dealer builders; `~100` base-game NPC identifiers. |
| Quests | `S1API.Quests.Quest`, `S1API.Quests.QuestManager.CreateQuest<T>()` | Author quests by subclassing `Quest` (override `Title` / `Description` / `AutoBegin` / `QuestIcon`). |
| Money & economy | `S1API.Money.Money`, `S1API.Economy` | `ChangeCashBalance`, `CreateOnlineTransaction`, `GetNetWorth`, `GetCashBalance`, `OnBalanceChanged`; contracts and dealers. |
| Phone, TV, calls & messaging | `S1API.PhoneApp.PhoneApp`, `S1API.TVApp.TVApp`, `S1API.PhoneCalls`, `S1API.Messaging` | Build custom phone apps and TV apps, trigger phone calls, send in-game messages. |
| World & map | `S1API.Map` (`Building` / `DeliveryLocation` / `Parking` / `Region`), `S1API.Vehicles`, `S1API.Doors` | Reference `~80` building, `~45` delivery and `~22` parking identifiers; interact with vehicles and doors. |
| Law | `S1API.Law` | Police, wanted level, checkpoints and curfew. |
| Leveling | `S1API.Leveling.LevelManager` | `Rank` / `Tier` / `XP`, `AddXP`, `OnRankUp`. |
| Console, input & time | `S1API.Console.BaseConsoleCommand`, `ConsoleHelper`, `S1API.Input.Controls`, `S1API.GameTime` | Auto-registering console commands, input controls, and the game clock. |
| Storage & property | `S1API.Storages` / `S1API.Storage`, `S1API.Property` | Storage containers and owned property / business. |
| UI, rendering & assets | `S1API.UI.UIFactory`, `S1API.Rendering` (`IconFactory`, `AvatarLayerFactory`, `MaterialHelper`), `S1API.AssetBundles.AssetLoader`, `S1API.Avatar` | Build uGUI, generate icons / avatar layers / materials, load AssetBundles, edit avatars. |
| Other systems | `S1API.Cartel`, `S1API.Growing`, `S1API.DeadDrops`, `S1API.Stations`, `S1API.Shops`, `S1API.Casino`, `S1API.Trash`, `S1API.Building` | Cartel, growing, dead drops, chemistry stations/recipes, shops, casino, trash, and placement. |
| Utilities | `S1API.Utils.*` (`ReflectionUtils`, `ColorUtils`, `ImageUtils`, ...) | Assorted helpers used across the API. |

:::note[Saveables gotcha]
When you mark fields with `[SaveableField("name")]`, do **not** name a field `"QuestData"` - that key
collides with the game's own save data.
:::

## How to depend on S1API

You reference S1API at build time but you do **not** ship it. At runtime the player's installed S1API mod
provides the assembly. There are two ways to reference it.

### Option A - NuGet (recommended for external devs)

Add the package reference to your `.csproj`:

```xml
<PackageReference Include="S1API.Forked" Version="*" />
```

Pin an explicit version rather than `*` for reproducible builds - check the current version on the
[NuGet listing](https://www.nuget.org/packages/S1API.Forked) or Thunderstore (see the caveat below) and set it there.

### Option B - DLL reference (how the DooDesch mods do it)

Reference the shipped DLL directly and set `<Private>false</Private>` so it is **not** copied into your
build output - the installed S1API mod provides it at runtime:

```xml
<Reference Include="S1API.Il2Cpp.MelonLoader">
  <HintPath>.../s1api/S1API.Il2Cpp.MelonLoader.dll</HintPath>
  <Private>false</Private>
</Reference>
```

S1API ships one DLL per branch-and-loader combination (Mono/IL2CPP times MelonLoader/BepInEx), so point
the `HintPath` at the one matching your target - for example `S1API.Il2Cpp.MelonLoader.dll` for the
default IL2CPP branch under MelonLoader.

### Declare it as a dependency (so mod managers pull it in)

Add S1API to your `manifest.json` dependencies so managers install it automatically alongside your mod:

```json
{
  "dependencies": ["ifBars-S1API_Forked-<ver>"]
}
```

Replace `<ver>` with the current version string from Thunderstore. The Thunderstore dependency string is
the authoritative one for manifests.

### How players get it

Players install S1API like any other mod - from
[Thunderstore](https://thunderstore.io/c/schedule-i/p/ifBars/S1API_Forked/) (via a mod manager or
manually) or from [Nexus mod 1194](https://www.nexusmods.com/schedule1/mods/1194). Because you declared
the dependency, a mod manager pulls it in for them.

:::caution[Version numbers move - do not hardcode one as permanent]
S1API's version strings are not in lockstep across sources (for example the `.csproj`, the NuGet nuspec,
the Thunderstore page and the GitHub tag can each read a different `3.x` number at the same time). Treat
it as "3.x" and **check the current version on Thunderstore** before you pin one. For your `manifest.json`,
the Thunderstore dependency string is authoritative.
:::

## Minimal examples

:::caution[Use these, not the official quickstart]
The official quickstart is stale - `OnSaveLoaded` and `Log.Info` do **not** exist in the current API. The
snippets below match the real source signatures. When docs and the shipped `.cs` disagree, trust the
`.cs`.
:::

Log when a save has finished loading:

```csharp
using MelonLoader;
using S1API.Lifecycle;
using S1API.Logging;

public sealed class MyFirstS1Mod : MelonMod
{
    private static readonly Log Logger = new Log("MyFirstS1Mod");
    public override void OnInitializeMelon() => GameLifecycle.OnLoadComplete += OnLoaded;
    private static void OnLoaded() => Logger.Msg("save fully loaded.");
}
```

Register a custom item at the right time (subscribe to `OnPreLoad` so the item exists before the save
finishes loading):

```csharp
using S1API.Items;
using S1API.Items.Storable;
using S1API.Lifecycle;

public override void OnInitializeMelon() => GameLifecycle.OnPreLoad += () =>
    ItemCreator.CreateItem(
        id: "myfirst_widget", name: "Widget", description: "A test widget.",
        category: ItemCategory.Tools, stackLimit: 5, basePurchasePrice: 25f);
```

Change the cash balance, and expose it as an auto-registering console command:

```csharp
S1API.Money.Money.ChangeCashBalance(1000f);

using System.Collections.Generic;
using S1API.Console;
public sealed class GiveCash : BaseConsoleCommand
{
    public override string CommandWord => "givecash";
    public override string CommandDescription => "Adds cash.";
    public override string ExampleUsage => "givecash 500";
    public override void ExecuteCommand(List<string> args)
        => S1API.Money.Money.ChangeCashBalance(float.Parse(args[0]));
}
```

## Credits

S1API is maintained by **[ifBars](https://github.com/ifBars/S1API)** as an actively developed fork. The
original S1API was created by **[KaBooMa](https://github.com/KaBooMa/S1API)** - its description reads "A
Schedule One Mono / Il2Cpp Cross Compatibility Layer (Forked from the original S1API by Kabooma)", and the
`MelonInfo` author string still credits KaBooMa. The legacy original is also on
[Thunderstore](https://thunderstore.io/c/schedule-i/p/KaBooMa/S1API/); build against the ifBars fork for
current work.

## Further reading

- **Full API reference:** [ifbars.github.io/S1API](https://ifbars.github.io/S1API/) and the
  [releases page](https://github.com/ifBars/S1API/releases).
- **Starter template:** the [S1API project template](/getting-started/project-templates/) scaffolds a mod
  that already leans on S1API.
- **Doc links roundup:** the [External Documentation](/tooling/external-docs/) page collects S1API,
  MelonLoader and FishNet documentation in one place.
