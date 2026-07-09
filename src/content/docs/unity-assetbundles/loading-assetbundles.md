---
title: Loading AssetBundles
description: Load a bundle at runtime on Mono and IL2CPP, register items and network prefabs, and use the Il2CppAssetBundleManager (including the BepInEx port).
sidebar:
  order: 4
---

At runtime your mod loads the bundle it shipped, pulls assets out of it, and hands them to the game.
How you load differs between branches: Mono uses the plain `AssetBundle` API, while IL2CPP needs the
`Il2CppAssetBundleManager`.

:::note
This page assumes you already have the bundle bytes. The convention of embedding the bundle as an
embedded resource in your DLL (and reading those bytes back) is documented under
[best practices](/best-practices/embedding-assetbundles/).
:::

## Loading on Mono

With the bytes in hand, the plain Unity API loads a bundle and pulls typed assets out of it:

```csharp
// From an embedded resource (bytes) ...
AssetBundle bundle = AssetBundle.LoadFromMemory(bundleBytes);
// ... or from a file on disk:
// AssetBundle bundle = AssetBundle.LoadFromFile(path);

GameObject prefab = bundle.LoadAsset<GameObject>("MyPrefab");
UnityEngine.Object.Instantiate(prefab);
```

If instead you load from a path under `StreamingAssets` (or a URL), zo shared a coroutine-based loader
that waits on the request before using the bundle:

```csharp
using UnityEngine;
using UnityEngine.Networking;

public class AssetBundleLoader : MonoBehaviour
{
    public string bundleName = "mybundle"; // Name of your asset bundle
    private AssetBundle assetBundle;

    void Start()
    {
        StartCoroutine(LoadAssetBundle());
    }

    IEnumerator LoadAssetBundle()
    {
        // Load from StreamingAssets (replace with your actual path)
        string path = Application.streamingAssetsPath + "/" + bundleName;
        WWW www = new WWW(path);
        yield return www;

        if (www.error != null)
        {
            Debug.LogError("Error loading asset bundle: " + www.error);
        }
        else
        {
            assetBundle = www.assetBundle;
            if (assetBundle != null)
            {
                Debug.Log("Asset bundle loaded successfully: " + bundleName);
            }
            else
            {
                Debug.LogError("Asset bundle failed to load");
            }
        }
    }

    // Example: Load and instantiate a prefab from the bundle
    public void LoadAndInstantiatePrefab(string prefabName)
    {
        if (assetBundle != null)
        {
            GameObject prefab = assetBundle.LoadAsset<GameObject>(prefabName);
            if (prefab != null)
            {
                Instantiate(prefab);
            }
            else
            {
                Debug.LogWarning("Prefab not found in bundle: " + prefabName);
            }
        }
        else
        {
            Debug.LogWarning("Asset bundle not loaded yet.");
        }
    }

    void OnDestroy()
    {
        if (assetBundle != null)
        {
            assetBundle.Unload(true); // Unload the asset bundle when done
        }
    }
}
```

> Source: **zo** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1356646188383998074)

:::caution[WWW is legacy]
`WWW` is a deprecated Unity API. For a bundle embedded in your DLL prefer `AssetBundle.LoadFromMemory`;
for a loose file prefer `AssetBundle.LoadFromFile`. The snippet above is a useful reference for the
StreamingAssets / URL case, but you rarely need it for a shipped mod.
:::

## Registering items and network prefabs from a bundle

Loading a prefab is only half the job for content mods - the game has to know about your
`ItemDefinition`s, and any FishNet `NetworkObject` prefabs must be registered so they replicate. Skippy's
approach is to hook `Registry.Awake` with a Harmony prefix and call this from it. It walks every asset in
the bundle, registers `ItemDefinition`s into the game registry, and registers `NetworkObject`s into a
FishNet prefab collection keyed by the [16-bit bundle hash](/unity-assetbundles/building-assetbundles/):

```csharp
internal static void Register(Registry registry, NetworkManager networkManager, AssetBundle assetBundle)
{
    ushort assetBundleHash = assetBundle.Get16BitHash();
    var netPrefabs = networkManager.GetPrefabObjects<SinglePrefabObjects>(assetBundleHash, createIfMissing: true);

    foreach (string assetName in assetBundle.GetAllAssetNames())
    {
        var itemDefinition = assetBundle.LoadAsset<ItemDefinition>(assetName);

        if (itemDefinition != null)
        {
            Plugin.Logger.LogInfo($"Registering ItemDefinition {itemDefinition.ID} from {assetName}");

            if (registry.ItemRegistry.Any(x => x.ID == itemDefinition.ID))
            {
                Plugin.Logger.LogWarning($"ItemDefinition {itemDefinition.ID} is already registered");
                continue;
            }

            registry.ItemRegistry.Add(new Registry.ItemRegister
            {
                ID = itemDefinition.ID,
                AssetPath = assetName,
                Definition = itemDefinition
            });
            continue;
        }

        GameObject gameObject = assetBundle.LoadAsset<GameObject>(assetName);

        if (gameObject != null)
        {
            var networkObject = gameObject.GetComponent<NetworkObject>();

            if (networkObject != null)
            {
                Plugin.Logger.LogInfo($"Registering NetworkObject {networkObject.name} from {assetName}");
                netPrefabs.AddObject(networkObject, checkForDuplicates: true);
            }

            continue;
        }
    }
}
```

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1359965714672517302/1359991926522380460)

The `Plugin.Logger` here is the BepInEx logger; on MelonLoader use `MelonLogger` instead. The FishNet
registration side is covered under [networking](/networking/).

## Loading on IL2CPP: Il2CppAssetBundleManager

On IL2CPP the raw `AssetBundle` API does not work directly. Loading goes through LavaGang's
`Il2CppAssetBundleManager`, which is built into MelonLoader. You load bytes and pull out `Il2Cpp` types:

```csharp
// IL2CPP - types are Il2Cpp variants
Il2CppAssetBundle bundle = Il2CppAssetBundleManager.LoadFromMemory(bundleBytes);
GameObject prefab = bundle.LoadAsset<GameObject>("MyPrefab");
```

Remember the bundle itself must have been built as the `il2cppassetbundle` type (see
[Building AssetBundles](/unity-assetbundles/building-assetbundles/)).

### Using it under BepInEx

`Il2CppAssetBundleManager` originally only supported MelonLoader. XmusJackson ported it so it works under
BepInEx too, giving BepInEx IL2CPP mods the same bundle-loading path.

- Assembly:
  [UnityEngine.BE.Il2CppAssetBundleManager](https://github.com/xmusjackson/UnityEngine.BE.Il2CppAssetBundleManager/releases/)
  (a small-change port of LavaGang's
  [original](https://github.com/LavaGang/UnityEngine.Il2CppAssetBundleManager)).
- Download the assembly, drop it in `Schedule I/BepInEx/core`, and reference it in your project. From
  there the API is the same as under MelonLoader.

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1380419485739253791/1380419485739253791)

:::note[IL2CPP interop]
Assets loaded on IL2CPP come back as `Il2Cpp`-prefixed types, and collections are `Il2CppSystem`
generics. If you need to move between `System` and `Il2CppSystem` collections, see the interop notes
under [il2cpp](/il2cpp/).
:::
