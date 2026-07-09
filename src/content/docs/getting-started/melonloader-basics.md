---
title: MelonLoader Basics
description: The MelonMod lifecycle, the assembly attributes worth knowing (compatibility, version, credits, priority), and preferences/debug helpers.
sidebar:
  order: 4
---

Every Schedule I mod is a MelonLoader mod. This page covers the entry point, the assembly attributes you will
reach for, and a couple of preferences/debug helpers. The full reference is the
[MelonLoader wiki](https://melonwiki.xyz/#/) - see its [quick start](https://melonwiki.xyz/#/modders/quickstart),
[attributes](https://melonwiki.xyz/#/modders/attributes), [preferences](https://melonwiki.xyz/#/modders/preferences)
and [patching](https://melonwiki.xyz/#/modders/patching) pages.

> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1519805733946785944)
> Source: **Dor** - [original message](https://discord.com/channels/1349221936470687764/1359517806609039543/1359517806609039543)

## The MelonMod entry point

Your mod is a class that derives from `MelonMod`. MelonLoader calls the lifecycle methods for you - you
override the ones you need:

```csharp
using MelonLoader;

public class MyMod : MelonMod
{
    public override void OnInitializeMelon()
    {
        MelonLogger.Msg("MyMod loaded!");
    }

    public override void OnSceneWasLoaded(int buildIndex, string sceneName)
    {
        // Runs every time a scene finishes loading.
    }
}
```

:::caution[Don't use `OnApplicationStart`]
Modern MelonLoader (the community targets **0.7.0+**) no longer uses `OnApplicationStart` - use
`OnInitializeMelon` instead. If a tutorial references `OnApplicationStart`, it predates the current API. Also
do not create your own Harmony instance just to patch: `MelonMod` already exposes one (`HarmonyInstance`).
:::

> Source: **coolpaca** - [original message](https://discord.com/channels/1349221936470687764/1358830084919656619/1359313637797531798)

## Useful assembly attributes

These go at assembly scope (typically in your main file or an `AssemblyInfo`). They are documented from
reading the MelonLoader source and are easy to miss on the wiki.

### Restrict which backend can load the mod

```csharp
[assembly: MelonPlatformDomain(MelonPlatformDomainAttribute.CompatibleDomains.IL2CPP)]
```

Marks the mod as IL2CPP-only (change the enum value for Mono). In practice this reliably stops a **Mono** mod
from loading in the IL2CPP game with a clear message; the reverse (an IL2CPP mod in the Mono game) may still
error on load before MelonLoader prints its nice headers. One known gotcha: a field in your main mod class
that references a game assembly can defeat the check - removing such dead references let the attribute work
correctly.

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1416910674197745765/1416910674197745765)
> Source: **Cyberlight** - [original message](https://discord.com/channels/1349221936470687764/1416910674197745765/1420258742326526032)
> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1416910674197745765/1426171919748825110)
> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1416910674197745765/1432445666705018942)

### Require a MelonLoader version

```csharp
[assembly: VerifyLoaderVersion(0, 7, 0)]        // exact version
[assembly: VerifyLoaderVersion(0, 7, 0, true)]  // minimum version
```

The mod won't load if the loader version doesn't satisfy the requirement.

### Console colors, credits, and load order

```csharp
[assembly: MelonAuthorColor(1, 255, 255, 255)]  // RGBA - author name color
[assembly: MelonColor(1, 0, 255, 255)]          // RGBA - mod name color

[assembly: MelonAdditionalCredits("S1 Modding Discord!", "someone else")]

[assembly: MelonPriority(1000)]  // higher = loads later; default is 0
```

### Declare dependencies and incompatibilities

```csharp
// Soft dependency: warns (does not block) if the named assembly isn't loaded.
[assembly: MelonAdditionalDependencies("SomeOtherMod")]

// Hard incompatibility: prevents MelonLoader from loading the named Melon alongside yours.
[assembly: MelonIncompatibleAssemblies("SomeAssembly")]
```

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1416910674197745765/1416910674197745765)

### Check a dependency's version yourself

For a real version gate (rather than a soft warning), inspect the loaded Melons at runtime, e.g. inside
`OnInitializeMelon`:

```csharp
var s1api = RegisteredMelons.FirstOrDefault(
    m => m.MelonAssembly.Assembly.GetName().Name == "S1API");
if (s1api == null)
{
    MelonLogger.Error("S1API not found");
    return;
}

var s1apiVersion = s1api.Info.SemanticVersion;
if (s1apiVersion < new SemVersion(1, 7, 4))
    MelonLogger.Warning("S1API version too old! Some features may not work.");
```

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1416910674197745765/1416910674197745765)

## Preferences (hot-reloadable config)

MelonLoader's preferences system persists your config. To react to changes at runtime, subscribe to the
change events rather than polling:

```csharp
// React to a single entry changing:
colorEntry.OnEntryValueChanged.Subscribe((oldValue, newValue) =>
    MelonLogger.Msg($"Color changed from {oldValue} to {newValue}"));

// React to a save of the whole preferences file:
MelonPreferences.OnPreferencesSaved.Subscribe((filePath) =>
    MelonLogger.Msg("Preferences saved to: " + filePath));
```

You can also override `OnPreferencesSaved()` on your `MelonMod`. Use the event subscription **or** the
override, not both, to avoid double handling. There is a fuller write-up on hot-reloading preferences in
k073l's [PREFERENCES.md](https://github.com/k073l/s1-modsapp/blob/master/PREFERENCES.md).

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1416910674197745765/1416910701116653598)

## Debug-only logging

For logs that should only appear when the game is launched with the `--melonloader.debug` flag, use
`MelonDebug` instead of `MelonLogger`:

```csharp
MelonDebug.Msg($"Hello from {(MelonUtils.IsGameIl2Cpp() ? "Il2Cpp" : "Mono")}!");
MelonDebug.Error("This only shows in debug mode.");
```

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1416910674197745765/1416910701116653598)
