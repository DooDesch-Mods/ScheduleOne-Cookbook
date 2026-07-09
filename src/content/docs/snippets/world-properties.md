---
title: Properties & World
description: Check owned properties, react to ownership changes, and find furniture placement grids.
sidebar:
  order: 5
---

Snippets for working with the player's properties (Barn, Bungalow, Manor, RV and so on) and the world
around them.

## Check which properties the player owns

Ownership data is not ready the instant your mod loads, so wait for `Property.OwnedProperties` to populate
before reading it. This coroutine blocks until at least one owned property exists, then logs them.

```csharp
private IEnumerator WaitForPropertiesLoaded()
{
    while (Property.OwnedProperties == null || Property.OwnedProperties.Count == 0)
        yield return null;

    Log($"OwnedProperties count: {Property.OwnedProperties.Count}");

    foreach (var p in Property.OwnedProperties)
        Log($"Owned property: {p.name}");
}
```

`PropertyManager.Owned` is the higher-level entry point if you just want the managed list rather than
polling.

> Source: **IPPO** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1378397869010059374)
> Source: **Dreous** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1378393916671525005)

## React to ownership changes without polling

Rather than checking ownership every frame, hook the moment a property changes state. A Harmony `Postfix`
on `Property.SetOwned()` fires exactly when ownership flips, so nothing runs unnecessarily. If your code
should also run on clients (not just the server), patch `ReceiveOwned()` instead.

> Source: **Olipro** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1378509225428385944)
> Source: **Olipro** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1378509396170248282)

## Furniture placement-grid paths

If you need to know where the game lets players place furniture - every grid in every property and business
(Sweatshop, Motel room, Barn, Manor, RV, Bungalow, the Docks warehouse, plus the Laundromat, Post Office,
Car Wash and Taco Ticklers businesses) - the community keeps a maintained list of the full transform paths.

See [Furniture Grid Paths](/core-concepts/furniture-grid-paths/) for the complete reference.
