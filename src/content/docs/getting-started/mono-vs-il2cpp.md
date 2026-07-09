---
title: Mono vs IL2CPP
description: Schedule I ships in two non-compatible runtimes. Learn which is which, how to tell them apart, and how one codebase can build for both.
sidebar:
  order: 1
---

Before you write a line of code, you need to know which **runtime** you are targeting. Schedule I is
distributed in two builds that are **not binary-compatible with each other**: a mod compiled for one will
not load in the other. This is the number-one source of confusion for new modders, so it is worth getting
straight first.

## The two branches

The runtime is decided by the Steam branch you install:

| Steam branch | Runtime | Game namespaces | .NET | MelonLoader build |
|---|---|---|---|---|
| `main` (default) / `beta` | **IL2CPP** | `Il2CppScheduleOne.*` | net6 | `MelonLoader/net6` |
| `alternate` / `alternate-beta` | **Mono** | `ScheduleOne.*` | net472 | `MelonLoader/net35` |

The default Steam install is the **IL2CPP** build. The **Mono** build is a separate install you opt into
via the `alternate` Steam branch.

> Source: **Estonia** - [original message](https://discord.com/channels/1349221936470687764/1371588181509537802/1417276043261116566)
> Source: **Virtunerd** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1522576295995900028)

## Why an IL2CPP mod won't run on Mono (and vice versa)

The two builds use different compilation strategies and runtimes:

- **IL2CPP** compiles the game's C# to C++ and then to native machine code. MelonLoader talks to it through
  an interop layer, and the game types show up in your references under an `Il2Cpp`-prefixed namespace
  (`Il2CppScheduleOne.PlayerScripts.Player`, and so on).
- **Mono** compiles to regular .NET intermediate language (IL) running on a JIT. The game types keep their
  real namespaces (`ScheduleOne.PlayerScripts.Player`) and behave like ordinary managed C#.

Because the runtimes, the type identities and even the namespaces differ, a DLL built against one simply
does not load against the other. Build (at least) one DLL per branch.

> Source: **Estonia** - [original message](https://discord.com/channels/1349221936470687764/1371588181509537802/1417276043261116566)

## How to tell which build is running

At runtime, MelonLoader can tell you which backend you are on:

```csharp
using MelonLoader.Utils;

bool isIl2Cpp = MelonUtils.IsGameIl2Cpp();
MelonLogger.Msg($"Running on {(isIl2Cpp ? "IL2CPP" : "Mono")}");
```

While developing, the quickest tell is the game's `Managed` / interop folder: the default install exposes
`Il2Cpp`-prefixed assemblies, while the `alternate` install has plain `Assembly-CSharp.dll` with the real
`ScheduleOne.*` types.

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1416910674197745765/1416910674197745765)

## The `#if MONO` namespace-swap pattern

You do not have to pick a side forever. The common way to support **both** branches from one codebase is a
`MONO` build constant plus conditional `using` directives, so the same code compiles against whichever
namespace the current configuration needs:

```csharp
#if MONO
using ScheduleOne.PlayerScripts;
using ScheduleOne.Money;
using FishNet;
#else
using Il2CppScheduleOne.PlayerScripts;
using Il2CppScheduleOne.Money;
using Il2CppFishNet;
#endif
```

You then set up two build configurations (one that defines `MONO`, one that doesn't), each pointing at the
matching game install and MelonLoader build, and produce two DLLs. The community
[project templates](/getting-started/project-templates/) wire this split up for you, and the official docs
have a dedicated write-up on
[supporting both branches](https://s1modding.github.io/docs/moddevs/il2cpp/#supporting-both-branches).

> Source: **Virtunerd** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1522576295995900028)
> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1494721289678491678)

## What actually changes between the branches

If you only ever write "pure" MelonLoader/Unity code (logging, `GameObject.Find`, Harmony attributes), very
little changes beyond the namespace. The differences show up the moment you touch game types directly:

- **Publicizer.** The Mono `Assembly-CSharp.dll` has real access modifiers, so `private`/`internal` members
  are unreachable unless you publicize it. On IL2CPP the interop assemblies expose everything already, so a
  publicizer is effectively a no-op there. See [Project Setup](/getting-started/project-setup/).
- **Interop ceremony.** IL2CPP needs extra work to subclass game types, register `MonoBehaviour`s
  (`ClassInjector`), convert collections and delegates, and cast safely (`TryCast`). None of that applies on
  Mono, where you just write normal C#. Those interop details live in [IL2CPP Specifics](/il2cpp/).
- **Reading the game's code.** The decompiled Mono build contains the **real method bodies** (actual logic),
  while the IL2CPP decompile is mostly trampolines - useful for exact type/method names but not behavior.
  A common workflow is to read logic from Mono and grab exact `Il2Cpp*` names from the IL2CPP side. See
  [Project Setup](/getting-started/project-setup/) for decompiling.

> Source: **Virtunerd** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1522576295995900028)
> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1496836882854576189)

:::note
Some mods use [S1API](https://ifbars.github.io/S1API/), a cross-version helper library that smooths over a
lot of these differences and can produce a single build that runs on both backends. If you would rather not
manage the branch split yourself, it is worth a look early on.
:::

:::tip[Which one should I build for?]
If you are unsure, target the **default IL2CPP** branch first - that is what most players run. Add a Mono
build later if you want to cover the `alternate` branch too. When you publish, tag your release with the
correct backend so players install the right file - see [Publishing](/publishing/).
:::
