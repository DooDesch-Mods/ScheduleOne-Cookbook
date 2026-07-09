---
title: Getting Started
description: Start here - the Mono vs IL2CPP split, setting up a project, community templates, MelonLoader basics, and building your first Schedule I mod.
sidebar:
  order: 0
---

New to modding Schedule I? Start here. Almost every Schedule I mod is a [MelonLoader](https://melonwiki.xyz/#/)
mod written in C#, and the single most important thing to understand up front is that the game ships in
**two different runtimes** - a **Mono** branch and an **IL2CPP** branch - and which one you target changes
how you write, reference, and load your mod.

Work through these pages roughly in order:

- **[Mono vs IL2CPP](/getting-started/mono-vs-il2cpp/)** - the two game branches, how you tell them apart,
  the namespace difference (`ScheduleOne.*` vs `Il2Cpp`-prefixed), and the `#if MONO` swap pattern that
  lets one codebase build for both.
- **[Project Setup](/getting-started/project-setup/)** - installing MelonLoader, referencing the game
  assemblies, the publicizer and the CS0012 fix, and decompiling the game so you can read its code.
- **[Project Templates](/getting-started/project-templates/)** - the community's ready-made `dotnet new`
  and clone-and-go templates for both branches, so you don't wire everything by hand.
- **[MelonLoader Basics](/getting-started/melonloader-basics/)** - the mod lifecycle, the assembly
  attributes worth knowing, and preferences/debug helpers.
- **[Your First Mod](/getting-started/first-mod/)** - a minimal `MelonMod` that logs on load and pokes at
  the scene, plus how to load and test it.

Once you are comfortable here, the deeper sections take over: [IL2CPP Specifics](/il2cpp/) for interop
details, [Networking](/networking/) for FishNet and multiplayer, [Unity & AssetBundles](/unity-assetbundles/)
for custom assets, and [Publishing](/publishing/) when you are ready to release.

Pages in this section are curated from the community's `dev-resources`, `il2cpp-resources` and `dev-general`
channels, with credit and a link back to each source.
