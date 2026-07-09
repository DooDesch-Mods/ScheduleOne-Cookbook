---
title: Furniture Grid Paths
description: The canonical list of every furniture placement grid across Schedule I's properties and businesses.
sidebar:
  order: 2
---

Schedule I places furniture onto named **grid** transforms inside each property and business. If your
mod needs to find, spawn onto, or reason about placement surfaces, these are the scene paths to the
grid objects. This is the canonical list other pages link back to.

Each entry is the transform path to a placement grid. Grids under `Property Contents/...` and
`@Properties/...` belong to owned properties; `@Businesses/...` are the purchasable businesses. Some
properties expose several grids (for example the Manor's per-room grids, or the numbered `Grid (1)`,
`Grid (2)` variants), so a single property can appear multiple times.

```text
Property Contents/Sweatshop/Grid/ItemContainer
Property Contents/Docks warehouse
Property Contents/Motel room/Grid/ItemContainer
Property Contents/Storage unit/Grid/ItemContainer
Property Contents/Sewer office/Grid

@Properties/Barn/BarnBuilding/UpperGrid
@Properties/Barn/BarnBuilding/LowerGrid
@Properties/Manor/Grids/Downstairs Hallway
@Properties/Manor/Grids/Downstairs Room 1
@Properties/Manor/Grids/Downstairs Room 2
@Properties/Manor/Grids/Upstairs Hallway
@Properties/Manor/Grids/Room1
@Properties/Manor/Grids/Room2
@Properties/Manor/Grids/Room3
@Properties/Manor/Grids/Room4
@Properties/RV/RV/Container/Grid
@Properties/RV/RV/Container/Grid (1)
@Properties/Bungalow/Container/Grid
@Properties/Bungalow/Container/Grid (1)
@Properties/Bungalow/Container/Grid (2)
@Properties/DocksWarehouse/IndustrialShed/MainGrid
@Properties/DocksWarehouse/IndustrialShed/OfficeGrid
@Properties/DocksWarehouse/IndustrialShed/CatwalkGrid
@Properties/DocksWarehouse/IndustrialShed/CatwalkGrid (1)

@Businesses/Laundromat/Grid
@Businesses/PostOffice/Grid
@Businesses/PostOffice/Grid (1)
@Businesses/Car Wash/Grid
@Businesses/Car Wash/Grid (1)
@Businesses/Taco Ticklers/Grid
```

:::caution
This list reflects the properties and businesses present when it was compiled. Game updates can add,
rename, or restructure grids, so confirm a path against the live scene (for example with UnityExplorer)
before relying on it in a shipped mod.
:::

> Source: **Mobrack** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1449043056287416412)
