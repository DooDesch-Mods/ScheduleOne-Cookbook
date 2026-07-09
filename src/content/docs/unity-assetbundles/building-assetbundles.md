---
title: Building AssetBundles
description: Pack your Unity assets into an AssetBundle with the AssetBundles-Browser tool, plus the IL2CPP bundle type and the 16-bit hash for networked prefabs.
sidebar:
  order: 3
---

Once your prefabs and assets are laid out in Unity, you pack them into an **AssetBundle** that ships with
your mod. The community's go-to tool for assigning assets to bundles and building them is Unity's own
AssetBundles-Browser.

## The AssetBundles-Browser tool

[Unity-Technologies/AssetBundles-Browser](https://github.com/Unity-Technologies/AssetBundles-Browser)
adds a window for grouping assets into bundles and building them, which is far nicer than juggling bundle
names by hand.

> Source: **coolpaca** - [original message](https://discord.com/channels/1349221936470687764/1358878716045824171/1358878716045824171)

### Mono vs IL2CPP bundle type

The browser works for both branches - the difference is the **bundle type** you build:

- **Mono:** a normal AssetBundle.
- **IL2CPP:** you need the `il2cppassetbundle` type. You can still use the same browser to build it.

> Source: **coolpaca** - [original message](https://discord.com/channels/1349221936470687764/1358878716045824171/1360598752204947496)

:::note
A bundle built for one branch is not interchangeable with the other. Build the plain AssetBundle for
Mono and the `il2cppassetbundle` for IL2CPP.
:::

## Custom scripts do not go in the bundle

You cannot author new game scripts inside the Unity project - the game scripts are reference-only. Ship
any custom `MonoBehaviour` in your mod DLL instead; it binds to your prefabs at runtime exactly as if it
had been authored in the editor. So a bundle carries meshes, materials, prefabs and scenes - not your
code.

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1359304379462713715/1359316509821894903)

## The 16-bit hash for networked prefabs

If your bundle contains FishNet `NetworkObject` prefabs, they have to be registered under a stable
prefab-collection id so host and clients agree. The community derives that id as a 16-bit hash of the
bundle's asset names, computed as an extension method on `AssetBundle`:

```csharp
public static ushort Get16BitHash(this AssetBundle assetBundle)
{
    if (assetBundle == null)
        throw new ArgumentNullException(nameof(assetBundle));
    int hash = 0;
    unchecked
    {
        foreach (string assetName in assetBundle.GetAllAssetNames())
        {
            hash *= 31 * assetName.GetHashCode();
        }
        hash *= 31 * assetBundle.name.GetHashCode();
    }
    return (ushort)(ushort.MaxValue - (ushort)(hash % ushort.MaxValue));
}
```

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1359965714672517302/1359992376302506196)

The same thing written with LINQ:

```csharp
public static class Extensions
{
    public static ushort Get16BitHash(this AssetBundle assetBundle)
    {
        if (assetBundle == null)
            throw new ArgumentNullException(nameof(assetBundle));

        var hash = 0;
        unchecked
        {
            hash = assetBundle.GetAllAssetNames().Aggregate(hash, (current, assetName) => current * 31 * assetName.GetHashCode());
            hash *= 31 * assetBundle.name.GetHashCode();
        }

        return (ushort)(ushort.MaxValue - (ushort)(hash % ushort.MaxValue));
    }
}
```

> Source: **MaxtorCoder** - [original message](https://discord.com/channels/1349221936470687764/1359965714672517302/1360358491671363765)

You feed that hash into the FishNet prefab registration when the bundle loads - see
[Loading AssetBundles](/unity-assetbundles/loading-assetbundles/) for the registration code.

## Shipping the bundle

Once built, the convention is to embed the bundle as an embedded resource inside your mod DLL rather than
shipping a loose file. That packaging convention is documented under
[best practices](/best-practices/embedding-assetbundles/); loading it back out at runtime is covered in
[Loading AssetBundles](/unity-assetbundles/loading-assetbundles/).
