---
title: The Stripped-Scripts Unity Project
description: Skippeh's pre-built Unity project containing the game's stripped scripts, so custom prefabs bind to the right components on the Mono branch.
sidebar:
  order: 1
---

To attach a real game component (say the pot's grow logic) to your own prefab in the Unity editor, the
editor has to know that component's type. Skippeh maintains a Unity project that already contains the
game's scripts in stripped form (the class shells, no method bodies), so the editor can bind prefabs and
scenes to the correct `MonoBehaviour`s. This is the fastest way to start authoring assets, and it saves
you from doing a full AssetRipper export yourself.

Repository: [Skippeh/ScheduleOne_UnityProject](https://github.com/Skippeh/ScheduleOne_UnityProject)

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1359304379462713715/1359304379462713715)

:::caution[Mono branch only]
This project targets the game's **Mono** branch. On Steam that is the `alternate` (and `alternate-beta`)
branch; in the repo the matching branches are named `alternate` and `alternate-beta` so the names line
up. There is no IL2CPP version - for IL2CPP you rip the project yourself (see
[Shaders and the AssetRipper workflow](/unity-assetbundles/shaders-and-assetripper/)).
:::

## What it is (and is not) for

A few ground rules from the author:

- **You cannot write new game scripts inside Unity.** The game scripts are present only as references
  so prefabs bind correctly at runtime. To add your own `MonoBehaviour`, ship it in your mod DLL - drop
  the plugin into the game's plugins folder and it works the same as a component authored in Unity.
- **You cannot modify the existing game scripts.** They exist as reference shells only; changing them
  does nothing at runtime.
- **The asset GUIDs are stable across re-exports.** Only the `timeCreated` value in a `.meta` file
  changes between exports, so prefabs keep binding to the same scripts even after the project is
  refreshed for a new game version.

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1359304379462713715/1359316509821894903)

## Setup

You need Unity Editor **2022.3.62f2** (match the version the repo README states for the current game
release - the engine version can change between game updates).

1. **Match the branches.** Check out the repo branch that matches your installed game branch (the
   `alternate` game branch needs the `alternate` repo branch).
2. **Find the game's managed DLLs.** Open your game install and locate the `Schedule I_Managed` folder.
3. **Open the drop target.** In the project, open `Assets/Plugins/ScheduleOne`.
4. **Copy the dependencies.** Drag the game's `Managed` folder onto the `DropManagedFolderHere.bat`
   file in the project - the script copies the required DLLs into `Assets/Plugins/ScheduleOne`.
   Without these DLLs the project will not work.
5. **Manual alternative.** If you would rather not use the batch file, do **not** copy every DLL from
   the game's `Managed` folder - copy only the DLLs that already have a matching `.meta` file in
   `Assets/Plugins/ScheduleOne`.
6. **Open in Unity.** There should be no errors; warnings are expected and can be ignored.

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1359304379462713715/1359304379462713715)

The project ships with a fix for a shader issue that made ripped materials invisible in-game, and its
dependency list has been trimmed - if you are updating an older checkout, delete the stray Unity DLLs and
`Cinemachine.dll` from `Assets/Plugins/ScheduleOne` (compare against the tracked `.meta` files to see
what should remain).

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1359304379462713715/1360261303448371401)

## Finding "missing script" references

After importing, some scene objects can show up with missing scripts. In practice these were mostly
built-in UI components - `Image`, `Button` and TextMeshPro scripts - rather than game logic. To identify
what a missing reference should be, run UnityExplorer in-game and inspect the live object; some objects
only appear once you switch the inspected scene to `DontDestroyOnLoad`.

> Source: **Hellbound™** - [original message](https://discord.com/channels/1349221936470687764/1359304379462713715/1359923539779649576)

## Next steps

With the project open you can lay out prefabs and scenes, then pack them - see
[Building AssetBundles](/unity-assetbundles/building-assetbundles/). If you need the game's actual
meshes, materials and shaders (not just script references), do a full rip instead:
[Shaders and the AssetRipper workflow](/unity-assetbundles/shaders-and-assetripper/).
