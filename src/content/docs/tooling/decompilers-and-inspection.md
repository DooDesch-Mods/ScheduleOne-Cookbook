---
title: Decompilers & Inspection
description: The tools the community uses to read Schedule I's code and assets and to inspect the game live.
sidebar:
  order: 1
---

To mod Schedule I you need to read its code and assets, and often to poke at the running game. These are
the tools the community reaches for. This page just names them and links them; for step-by-step
workflows like ripping the project or debugging IL2CPP with Ghidra, see the linked sections and the
[community docs](/tooling/external-docs/).

## Reading game code (decompilers)

- **[dnSpy](https://github.com/dnSpy/dnSpy)** / **[dnSpyEx](https://github.com/dnSpyEx/dnSpy)** - the
  standard C# decompiler and debugger. dnSpyEx is the maintained fork; prefer it. Best used against the
  **Mono** build, where method bodies are fully readable. dnSpy can also
  [debug Unity games](https://github.com/dnSpyEx/dnSpy/wiki/Debugging-Unity-Games).
- **[ILSpy](https://github.com/icsharpcode/ILSpy)** - a lightweight alternative decompiler for browsing
  `Assembly-CSharp`.

For the IL2CPP branch, method bodies are not directly readable; you work from a dumped SDK plus native
analysis. Naming the tools here, with the how-to in the [IL2CPP](/il2cpp/) section:

- **Il2CppDumper** - dumps type/method metadata from an IL2CPP build so you can recover class and member
  names.
- **[Il2CppInspectorPro](https://github.com/jadis0x/Il2CppInspectorPro)** - a richer IL2CPP inspector/dumper.

To read the game more easily, most people build against the **Mono** branch for logic and cross-check
exact signatures against an IL2CPP dump. See [Game Structure & Namespaces](/core-concepts/game-structure-and-namespaces/).

## Ripping assets and AssetBundles

- **[AssetRipper](https://github.com/AssetRipper/AssetRipper)** - extracts the game's assets into a
  Unity project (models, textures, shaders, scripts). The starting point for building your own
  AssetBundles against the real game. See the [Unity & AssetBundles](/unity-assetbundles/) section.
- **[UABE](https://github.com/SeriousCache/UABE)** (Unity Assets Bundle Extractor) and
  **[AssetsTools.NET](https://github.com/nesrak1/AssetsTools.NET)** - inspect and edit AssetBundles and
  asset files directly.
- **[AssetStudio](https://github.com/Perfare/AssetStudio)** - browse and export assets (meshes, textures,
  audio) from Unity games.

## Inspecting the live game

- **[UnityExplorer](https://github.com/yukieiji/UnityExplorer)** - an in-game object browser and
  inspector. Invaluable for finding which class is attached to an object, reading live field values, and
  prototyping a patch before you write it. The original (`sinai-dev`) is abandoned; use the maintained
  **yukieiji** fork. Download the build that matches your loader and backend:
  - MelonLoader IL2CPP: `UnityExplorer.MelonLoader.IL2CPP.CoreCLR.zip`
  - MelonLoader Mono: `UnityExplorer.MelonLoader.Mono.zip`
- **[CinematicUnityExplorer](https://github.com/originalnicodr/CinematicUnityExplorer)** - a UnityExplorer
  variant with extra camera/screenshot tooling.
- **[RuntimeUnityEditor](https://github.com/ManlyMarco/RuntimeUnityEditor)** - an alternative in-game
  inspector with a REPL and object tree.

> Source: **Uncle Nelsons Weird Twin** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1517647030900621353)
> Source: **chi chi** - [original message](https://discord.com/channels/1349221936470687764/1357494208038043841/1357494208038043841)
> Source: **Estonia** - [original message](https://discord.com/channels/1349221936470687764/1371588181509537802/1417276269887754300)

## Other BepInEx helpers

From the community tool collection, handy when working with BepInEx-based setups:

- **[BepInEx.GameLibsMaker](https://github.com/EnoPM/BepInEx.GameLibsMaker)** - strip game assemblies down
  to reference libraries for building against.
- **[BepInEx.Debug](https://github.com/BepInEx/BepInEx.Debug)** - debugging helpers for BepInEx plugins.
- **[BepInExConfigManager](https://github.com/Vapok/BepInExConfigManager)** - an in-game config editor.

> Source: **chi chi** - [original message](https://discord.com/channels/1349221936470687764/1357494208038043841/1357494208038043841)
