---
title: Items & Inventory
description: Drop-in C# for giving item stacks on pickup and injecting custom avatar equippables.
sidebar:
  order: 1
---

Self-contained helpers for the item framework - handing the player multiple items from a single pickup,
and slotting your own avatar equippables into the game's equip pipeline.

## Multi-item pickup (give stacks)

The vanilla `ItemPickup` gives a single item instance. This subclass hands the player a random-sized stack
between `MinCount` and `MaxCount`, checking inventory space first. Drop it on your pickup prefab in place
of `ItemPickup`.

```csharp
using ScheduleOne.DevUtilities;
using ScheduleOne.ItemFramework;
using ScheduleOne.PlayerScripts;

public class MultiItemPickup : ItemPickup
{
    public int MinCount = 2;
    public int MaxCount = 5;

    protected override bool CanPickup()
    {
        if (ItemToGive == null) return false;

        var inv = PlayerSingleton<PlayerInventory>.Instance;
        if (inv == null) return false;

        // Vanilla only checks one instance; that's fine as a coarse gate.
        var probe = ItemToGive.GetDefaultInstance();
        return inv.CanItemFitInInventory(probe);
    }

    protected override void Pickup()
    {
        if (ItemToGive == null) return;

        var inv = PlayerSingleton<PlayerInventory>.Instance;
        if (inv == null) return;

        int count = UnityEngine.Random.Range(MinCount, MaxCount + 1);

        for (int i = 0; i < count; i++)
        {
            var inst = ItemToGive.GetDefaultInstance();
            inv.AddItemToInventory(inst);
        }

        if (onPickup != null)
            onPickup.Invoke();

        if (DestroyOnPickup)
        {
            if (Networked)
                Destroy();
            else
                gameObject.SetActive(false);
        }
    }
}
```

:::caution
This only works with **stackable** items. It uses the Mono namespaces (`ScheduleOne.*`); on IL2CPP use the
`Il2CppScheduleOne.*` equivalents.
:::

> Source: **Raining_Death** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1436486492158693386)

## Custom avatar equippables

To make the game equip *your* prefab as an avatar equippable, prefix-patch `Avatar.SetEquippable`. Give
your custom asset paths a marker the game never uses (here `<EH>`); when a matching path comes through,
instantiate your own prefab and short-circuit the original. Keep your prefabs in a `string -> GameObject`
dictionary keyed by that path.

```csharp
[HarmonyPatch(typeof(Avatar))]
internal class PAvatar
{
    // This returns a bool because we don't want the original to run if it matches
    [HarmonyPatch(nameof(Avatar.SetEquippable))]
    [HarmonyPrefix]
    public static bool SetEquippable(Avatar __instance, ref AvatarEquippable __result, string assetPath)
    {
        if (__instance == null) return true;
        if (assetPath != null && assetPath.Length > 4)
        {
            // Some custom identifier (something an asset path will never start with)
            if (assetPath[0] == '<' && assetPath[1] == 'E' && assetPath[2] == 'H' && assetPath[3] == '>')
            {
                if (__instance.CurrentEquippable != null)
                {
                    __instance.CurrentEquippable.Unequip();
                }

                if (assetPath == string.Empty)
                {
                    __result = null;
                    return false;
                }
                // Store a dict of string to GameObject and store your AE prefab there
                GameObject gameObject = ExpandedHorticulture.Current.m_avatar_equippables[assetPath];
                if (gameObject == null)
                {
                    Util.Logger.Log("Couldn't find equippable at path " + assetPath, Util.Logger.LogType.UnityDebug);
                    __result = null;
                    return false;
                }

                __instance.CurrentEquippable = UnityEngine.Object.Instantiate<GameObject>(gameObject, null).GetComponent<AvatarEquippable>();
                __instance.CurrentEquippable.Equip(__instance);
                __result = __instance.CurrentEquippable;
                return false;
            }
        }
        return true;
    }
}
```

:::caution
Shared as IL2CPP-oriented and, in the author's words, "not tested in mono". Swap `ExpandedHorticulture`
and `Util.Logger` for your own prefab store and logger.
:::

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359969930073866382/1366088571836039308)
