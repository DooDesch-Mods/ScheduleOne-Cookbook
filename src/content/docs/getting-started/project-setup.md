---
title: Project Setup
description: Install MelonLoader, create a C# project, reference the game assemblies, fix the CS0012 error with a publicizer, and decompile the game to read its code.
sidebar:
  order: 2
---

This page covers getting from nothing to a compiling mod project: the loader, a project that references the
game, the publicizer that unblocks the game's internals, and the tools you use to read the game's code.

If you would rather start from a working skeleton than wire this by hand, jump to
[Project Templates](/getting-started/project-templates/) - they set up most of what follows for you.

## 1. Install MelonLoader

Schedule I mods run under [MelonLoader](https://melonwiki.xyz/#/). Follow the MelonLoader
[requirements and quick start](https://melonwiki.xyz/#/?id=requirements) to install it onto your game.

The community targets **MelonLoader 0.7.0** (or newer). Older versions changed some APIs, so if a tutorial
mentions `OnApplicationStart`, it is out of date - see [MelonLoader Basics](/getting-started/melonloader-basics/).

> Source: **Deleted User** - [original message](https://discord.com/channels/1349221936470687764/1357084455897923725/1359823923881185371)
> Source: **Deleted User** - [original message](https://discord.com/channels/1349221936470687764/1357084455897923725/1359911258127728923)

## 2. Create a project and reference the game

A mod is a .NET class library that references MelonLoader plus the game's managed assemblies. You need the
[.NET SDK](https://dotnet.microsoft.com/download) and an IDE (Visual Studio or [Rider](https://www.jetbrains.com/rider/)).

For a Visual Studio starter that fills in the MelonLoader references automatically, the community recommends
the [MelonLoader.VSWizard](https://github.com/TrevTV/MelonLoader.VSWizard) - create a new project and it drops
in the assemblies for you.

> Source: **DooDesch** - [original message](https://discord.com/channels/1349221936470687764/1357084455897923725/1359730698843590717)

The game's own types live in the assemblies under your install:

- **IL2CPP** (default branch): interop assemblies under `MelonLoader/Il2CppAssemblies/`.
- **Mono** (`alternate` branch): the real assemblies under `Schedule I_Data/Managed/`
  (`Assembly-CSharp.dll`, `Assembly-CSharp-firstpass.dll`, `FishNet.Runtime.dll`, the `UnityEngine.*Module`
  DLLs, and so on).

## 3. Fix the CS0012 error with a publicizer

The most common wall a newcomer hits is a build error like:

```
error CS0012: The type 'X' is defined in an assembly that is not referenced.
```

This means your project references one game type but not the whole web of assemblies it depends on. The fix
is to reference **all** of the game's managed DLLs (excluding the framework ones) and, on Mono, to
**publicize** them so their `private`/`internal`/`protected` members become accessible.

Add a wildcard reference to your `.csproj` that pulls in every game DLL except the BCL ones:

```xml
<Reference Include="$(S1Dir)\Schedule I_Data\Managed\*.dll"
           Exclude="$(S1Dir)\Schedule I_Data\Managed\System*.dll;$(S1Dir)\Schedule I_Data\Managed\mscorlib.dll;$(S1Dir)\Schedule I_Data\Managed\netstandard.dll"
           Private="false"
           Publicize="True" />
```

The `Publicize="True"` attribute is provided by a publicizer package. Add one to an `<ItemGroup>`:

```xml
<PackageReference Include="BepInEx.AssemblyPublicizer.MSBuild" Version="0.4.1" PrivateAssets="all" />
```

> Source: **Marfeyx** - [original message](https://discord.com/channels/1349221936470687764/1357084455897923725/1359936406679589206)
> Source: **Deleted User** - [original message](https://discord.com/channels/1349221936470687764/1357084455897923725/1359936833362067599)
> Source: **Deleted User** - [original message](https://discord.com/channels/1349221936470687764/1357084455897923725/1359905244535980072)

If you only need to publicize a single assembly, you can target it directly instead of the wildcard:

```xml
<ItemGroup>
  <PackageReference Include="BepInEx.AssemblyPublicizer.MSBuild" Version="0.4.1" PrivateAssets="all" />
</ItemGroup>

<Reference Include="Assembly-CSharp" Publicize="true">
  <HintPath>D:\SteamLibrary\steamapps\common\Schedule I\Schedule I_Data\Managed\Assembly-CSharp.dll</HintPath>
</Reference>
```

> Source: **coolpaca** - [original message](https://discord.com/channels/1349221936470687764/1358830084919656619/1359322521513492663)

:::note
On **IL2CPP** the interop assemblies already expose everything (member access goes through field offsets, not
C# access modifiers), so the publicizer is essentially a no-op there. On **Mono** it is required - forgetting
it produces `'X' is inaccessible due to its protection level` errors. See
[Mono vs IL2CPP](/getting-started/mono-vs-il2cpp/).
:::

The MelonLoader wiki has the canonical
[assembly references](https://melonwiki.xyz/#/modders/quickstart?id=assembly-references) walkthrough if you
prefer to follow it step by step, and the official
[environment setup](https://s1modding.github.io/docs/moddevs/environment_setup/) docs cover the IL2CPP net6
path in particular. If a reference points at a class or method that does not exist in the build you are
targeting, that also surfaces as a reference error - double-check the type actually exists on your branch.

> Source: **Oksamies** - [original message](https://discord.com/channels/1349221936470687764/1357084455897923725/1359937278767792492)
> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1521226829791498310)

## 4. Decompile the game to read its code

Modding Schedule I means constantly reading how the game does things. Decompile the game's assemblies with
[dnSpyEx](https://github.com/dnSpyEx/dnSpy/releases) (the actively maintained fork of the original dnSpy,
which is no longer downloadable). Other decompilers such as [ILSpy](https://github.com/icsharpcode/ILSpy)
work too.

A useful tip: the **Mono** build decompiles into readable method bodies with the real game logic, whereas the
**IL2CPP** build decompiles mostly into interop stubs. If you want to actually read what the game does,
switch to the Mono (`alternate`) branch to read the code, even if you ship for IL2CPP. The official docs
cover this under [reading game code](https://s1modding.github.io/docs/moddevs/reading_game_code/) and
[decompiling the game code](https://s1modding.github.io/docs/moddevs/reading_game_code/#decompiling-the-game-code).

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1496831580562260039)
> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1496836882854576189)
> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1523268152421650462)

For inspecting objects and the scene hierarchy **while the game runs**, use the maintained
[yukieiji/UnityExplorer](https://github.com/yukieiji/UnityExplorer/releases/latest) fork - pick the build
that matches your loader/backend (`UnityExplorer.MelonLoader.IL2CPP.CoreCLR.zip` for IL2CPP,
`UnityExplorer.MelonLoader.Mono.zip` for Mono).

> Source: **Uncle Nelsons Weird Twin** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1517647030900621353)

## Switching Steam branches

Since the Mono runtime lives on the `alternate` Steam branch, you will occasionally switch branches (to read
Mono code, to test a build, or to target an older version). This is a normal Steam beta-branch opt-in; there
is a short [video walkthrough](https://www.youtube.com/watch?v=xeS7bCwXJ7U) for it.

> Source: **Uncle Nelsons Weird Twin** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1519540523671486605)

## Where the docs live

Two hubs are worth bookmarking now:

- The official **[Schedule I mod developer docs](https://s1modding.github.io/docs/moddevs/)**.
- The **[MelonLoader wiki](https://melonwiki.xyz/#/)** and its [basic mod example](https://melonwiki.xyz/#/modders/quickstart?id=basic-mod-example)
  and [AssetRipper](https://melonwiki.xyz/#/modders/assetripper) pages.

> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1445488494192627844)
> Source: **Dor** - [original message](https://discord.com/channels/1349221936470687764/1359517806609039543/1359517806609039543)
