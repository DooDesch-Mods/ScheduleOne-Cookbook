---
title: Embedding AssetBundles
description: Ship your Unity AssetBundles inside the mod DLL as an embedded resource so users never have to place them by hand.
sidebar:
  order: 1
---

Please embed your AssetBundles into your mod's DLL. Shipping the bundle as a loose file next to the DLL
means the end user has to drop it in exactly the right path - and if the game is ever released on a
non-Windows OS, those paths may differ. Embedding the bundle as a resource removes both problems and
cuts the number of files a user has to copy down to one.

## 1. Add the bundle to your project

Put your `AssetBundle` file somewhere inside your **project** folder. It can live in a subdirectory;
the location does not matter.

## 2. Embed it via the `.csproj`

Reference the bundle as an `EmbeddedResource` so it is compiled into the DLL:

```xml
<ItemGroup>
    <EmbeddedResource Include="Path/To/assetbundle" />
</ItemGroup>
```

## 3. Load it from the embedded stream

At runtime, pull the bundle out of the assembly's manifest resource stream and load it. Close the
stream afterwards to free the memory it was using:

```csharp
var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(STREAM_NAME_GOES_HERE); // Get the AssetBundle Stream
if (stream == null) // If it doesn't exist...
{
    // ...log an error, and return
    return;
}

AssetBundle assetBundle = AssetBundle.LoadFromStream(stream); // Load the AssetBundle from the Stream
stream.Close(); // Close it to remove it from RAM (saves system resources!)
```

## Working out the stream name

The manifest resource name is your root namespace followed by the folder path to the file, joined with
dots. Say your project looks like this:

- Project (namespace: `MyCoolMod`)
  - `MyFolder` (folder)
    - `assetbundle` (file)
  - `MyCoolMod.cs`
  - `MyCoolMod.csproj`

Then the stream name is `MyCoolMod.MyFolder.assetbundle`, and the load line becomes:

```csharp
var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("MyCoolMod.MyFolder.assetbundle");
```

It is a small change that keeps your download to a single DLL and takes an entire category of "the mod
does nothing" install mistakes off the table.

:::note
On the IL2CPP branch, load AssetBundles through `Il2CppAssetBundleManager` rather than
`AssetBundle.LoadFromStream` directly. The embedding technique above is identical on both branches - only
the load call differs. See the Unity AssetBundles section for the IL2CPP loader details.
:::

> Source: **Deleted User** - [original message](https://discord.com/channels/1349221936470687764/1357145642010411048/1359902306329432226)
