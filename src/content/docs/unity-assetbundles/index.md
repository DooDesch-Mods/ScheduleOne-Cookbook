---
title: Unity & AssetBundles
description: Author custom assets in Unity and ship them to Schedule I as AssetBundles - the stripped-scripts project, shaders, building, loading and runtime UI.
sidebar:
  order: 0
---

Anything that is not pure code - a custom item mesh, a prefab, a phone-app icon, a whole
scene - reaches the game as a Unity **AssetBundle**. You build the assets in a Unity project that
matches the game's engine version, pack them into a bundle, ship the bundle with your mod, and load
it at runtime. This section covers the community's whole Unity workflow.

## Pages in this section

- **[The stripped-scripts Unity project](/unity-assetbundles/stripped-scripts-project/)** - Skippeh's
  pre-built Unity project that already contains the game's stripped scripts, so custom prefabs bind to
  the right `MonoBehaviour`s. The fastest way in on the Mono branch.
- **[Shaders and the AssetRipper workflow](/unity-assetbundles/shaders-and-assetripper/)** - ripping the
  full game into Unity with AssetRipper, and fixing the URP shaders (SIShaderFix, the shader-swapper
  editor script, the fixed Glass / WorldspaceUV graphs) so ripped materials are not invisible in-game.
- **[Building AssetBundles](/unity-assetbundles/building-assetbundles/)** - the AssetBundles-Browser
  tool, the IL2CPP bundle type, and the 16-bit hash used to register networked prefabs.
- **[Loading AssetBundles](/unity-assetbundles/loading-assetbundles/)** - loading a bundle at runtime on
  Mono and IL2CPP, registering items and network prefabs, and the IL2CppAssetBundleManager (including the
  BepInEx port).
- **[The bGUI Unity GUI wrapper](/unity-assetbundles/unity-gui-wrapper/)** - building in-game uGUI from
  code (no bundle needed) with the builder-styled `bGUI` library, a full from-scratch phone-app UI
  example, and an animated-GIF-to-texture helper.

## Mono vs IL2CPP up front

The Unity-authoring story differs by branch:

- **Mono** uses `ScheduleOne.*` types directly. You can grab the pre-stripped project, reference the
  game DLLs, and bundles load with the plain `AssetBundle` API.
- **IL2CPP** uses `Il2Cpp`-prefixed types and needs interop care. Bundles must be built as the
  `il2cppassetbundle` type and loaded through the `Il2CppAssetBundleManager` rather than the raw
  `AssetBundle` API.

Where a step is branch-specific, each page calls it out.

:::note
Embedding a finished bundle as an embedded resource inside your mod DLL is a cross-cutting convention
documented under [best practices](/best-practices/embedding-assetbundles/). The pages here focus on
authoring, building and loading.
:::
