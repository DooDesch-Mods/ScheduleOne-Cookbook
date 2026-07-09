---
title: Utilities
description: Small drop-in helpers - a 16-bit AssetBundle hash for networked prefabs and a ground detector.
sidebar:
  order: 7
---

Small, self-contained helpers that do not belong to any one system.

## 16-bit AssetBundle hash for networked prefabs

When registering prefabs from an AssetBundle as FishNet network objects, you need a small, stable
identifier derived from the bundle. This extension folds every asset name and the bundle name into a
`ushort`.

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

For the wider networked-prefab registration flow this feeds into, see the [Networking](/networking/)
section.

> Source: **MaxtorCoder** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1360358678771007699)
> Source: **Skippy** (original author, credited in the post)

## Ground / object detection under the player

A `MonoBehaviour` that raycasts straight down and reports whatever GameObject is directly underneath. Add
it to the local player object; read `ObjectCurrentlyUnderneath`, or call the static
`GetObjectUnderneath(...)` for a one-off query. Set the layer mask to whatever counts as "ground" for your
use (the example targets the `Invisible` layer).

```csharp
using UnityEngine;
public class GroundDetector : MonoBehaviour
{
    [Header("Detection Settings")]
    [Tooltip("How far down from the origin point to check.")]
    [SerializeField] private float detectionDistance = 1.1f;

    [Tooltip("Which physics layers should be considered 'ground' or 'interactable below'?")]
    [SerializeField] private LayerMask groundLayerMask;

    [Tooltip("Optional offset from the player's transform position to start the raycast.")]
    [SerializeField] private Vector3 originOffset = Vector3.zero;

    [Tooltip("Should the detection ignore trigger colliders? Usually true for ground checks.")]
    [SerializeField] private QueryTriggerInteraction triggerInteraction = QueryTriggerInteraction.Ignore;

    private GameObject _objectCurrentlyUnderneath = null;
    public GameObject ObjectCurrentlyUnderneath => _objectCurrentlyUnderneath;

    void Start()
    {
        // Change this layer
        this.groundLayerMask = LayerMask.NameToLayer("Invisible");
    }

    void Update()
    {
        _objectCurrentlyUnderneath = FindObjectUnderneathRaycast();
    }

    public GameObject FindObjectUnderneathRaycast()
    {
        Vector3 rayOrigin = transform.position + originOffset;
        RaycastHit hitInfo;

        bool didHit = Physics.Raycast(
            rayOrigin,
            Vector3.down,
            out hitInfo,
            detectionDistance,
            groundLayerMask,
            triggerInteraction
        );

        if (didHit)
        {
            if (hitInfo.collider.transform == this.transform)
            {
                if (hitInfo.collider.gameObject == this.gameObject)
                {
                    return null;
                }
            }
            return hitInfo.collider.gameObject;
        }

        return null;
    }

    public static GameObject GetObjectUnderneath(Transform originTransform, float distance, LayerMask layers, Vector3 offset = default, QueryTriggerInteraction queryTriggers = QueryTriggerInteraction.Ignore)
    {
        Vector3 rayOrigin = originTransform.position + offset;
        RaycastHit hitInfo;

        if (Physics.Raycast(rayOrigin, Vector3.down, out hitInfo, distance, layers, queryTriggers))
        {
            if (hitInfo.collider.transform == originTransform)
            {
                return null;
            }
            return hitInfo.collider.gameObject;
        }
        return null;
    }
}
```

Attach it and poll the result:

```csharp
// Get GroundDetector component. Add if doesn't exist.
GroundDetector groundDetector = this.player.GetComponent<GroundDetector>();
if (groundDetector == null)
{
    groundDetector = this.player.gameObject.AddComponent<GroundDetector>();
}
yield return new WaitUntil(() => groundDetector.ObjectCurrentlyUnderneath != null);
GameObject objectUnderPlayer = groundDetector.ObjectCurrentlyUnderneath;
```

> Source: **Deeej** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1368449377768701972)

## Version and branch checks

Detecting a bad game/MelonLoader version and declaring branch compatibility are cross-cutting conventions,
so they live in [Best Practices](/best-practices/) rather than here:

- Warning users on a known-bad MelonLoader version (the `VersionChecker` approach) - see
  [Best Practices](/best-practices/).
- Declaring your mod's compatible domain with
  `[assembly: MelonPlatformDomain(...)]` so MelonLoader refuses to load it on the wrong branch instead of
  crashing with `Could not resolve type` - see [Best Practices](/best-practices/).
