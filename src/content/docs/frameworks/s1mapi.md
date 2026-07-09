---
title: S1MAPI (Mapping & Geometry)
description: S1MAPI is ifBars' GPL-3.0 companion to S1API for runtime procedural meshes, glTF/GLB loading and grid-based building - with no dependency on ScheduleOne game types.
sidebar:
  order: 2
---

**S1MAPI** by [ifBars](https://github.com/ifBars/S1MAPI) is the geometry and asset companion to
[S1API](/frameworks/s1api/). Where S1API wraps the game's systems (items, quests, NPCs, money), S1MAPI
is about building and loading 3D content at runtime. It is what you reach for when you need to spawn your
own structures, meshes or imported models into the world.

The important design point: S1MAPI does its work **without depending on the game's `ScheduleOne` types**.
Its meshes and buildings are plain client-local Unity objects, so they are not tied to the game's internal
classes and tend to survive game updates that would otherwise break a mod. This is exactly why it pairs so
well with S1API - one library absorbs the gameplay churn, the other the geometry churn.

## What it gives you

- **Runtime procedural mesh** - build primitives in code: box, sphere, cylinder and capsule. No prefab,
  no AssetBundle, no editor round-trip.
- **glTF / GLB loading** - load standard 3D model files at runtime and drop them into the scene.
- **`BuildingBuilder`** - a fluent API for assembling whole structures (floors, walls, ceilings, roofs,
  lights and furniture) instead of hand-placing every piece.
- **`Prefabs` catalog** - a set of ready-made building blocks you can instantiate.
- **Material and utility helpers** - for example `S1MAPI.Utils.MaterialPresets` for quick emissive/opaque
  materials on generated geometry.

All of it is usable from a single codebase because the library ships for both game branches.

## Mono and IL2CPP

S1MAPI ships two DLLs, one per branch:

- IL2CPP (default Steam branch): `S1MAPI_Il2Cpp.dll`
- Mono (alternate beta branch): `S1MAPI_Mono.dll`

Requirements: **MelonLoader 0.7.0+** and **.NET Framework 4.7.2+ (Mono)** or **.NET 6.0+ (IL2CPP)**. You
write against the same `S1MAPI.*` API on both branches - just reference the DLL that matches the branch you
are building for.

## Depending on it

S1MAPI is a shared library, not a gameplay mod. The player installs it once; you reference it at build time
without shipping it.

The players install it as a runtime dependency. Declare it in your `manifest.json` so mod managers pull it
in automatically:

```json
{
  "dependencies": ["ifBars-S1MAPI-x.y.z"]
}
```

:::caution[Version string moves]
Do not hardcode a version as if it were permanent. Check the current version on
[Thunderstore](https://thunderstore.io/c/schedule-i/p/ifBars/S1MAPI/) and use that exact
`ifBars-S1MAPI-<ver>` string in your manifest.
:::

At build time, reference the DLL but do not copy it into your output - the installed library mod provides it
at runtime. `<Private>false</Private>` is what says "provided, do not bundle":

```xml
<Reference Include="S1MAPI_Il2Cpp">
  <HintPath>$(S1mapiPath)/S1MAPI_Il2Cpp.dll</HintPath>
  <Private>false</Private>
</Reference>
```

:::note
S1MAPI's DLL belongs in the game's **`UserLibs`** folder (not `Mods`). If you install manually, make sure
`S1MAPI_Il2Cpp.dll` (or `S1MAPI_Mono.dll` on the Mono branch) ends up there. Mod managers handle this for
you.
:::

Alternatively, external devs can pull it from NuGet (package id `S1MAPI`):

```xml
<PackageReference Include="S1MAPI" Version="*" />
```

## Example: procedural mesh

Building geometry in code is a single call. This creates a box primitive - no prefab required:

```csharp
using UnityEngine;
using S1MAPI.ProceduralMesh;

// name, world position, size (in world units), base color
GameObject body = PrimitiveBuilder.CreateBox("Body", Vector3.zero, new Vector3(1f, 2f, 1f), Color.gray);

// Swap in a quick emissive material for generated geometry
body.GetComponent<Renderer>().sharedMaterial =
    S1MAPI.Utils.MaterialPresets.Emissive(Color.white, 1.5f);
```

## Example: glTF load + BuildingBuilder grid

Loading an external model and assembling a structure both use the higher-level API. Keep the model
file next to your mod and load it at runtime, then build the structure with the fluent `BuildingBuilder`:

```csharp
using UnityEngine;
using S1MAPI.Building;         // BuildingBuilder
using S1MAPI.Building.Config;  // BuildingConfig presets
using S1MAPI.S1;               // Prefabs / Meshes / Materials registries

// 1) Load a glTF/GLB model at runtime. It comes in as a plain GameObject -
//    no ScheduleOne types are involved.
GameObject model = /* S1MAPI GltfLoader, e.g. GltfLoader.LoadFromFile(path) - see the glTF docs for the exact entry point and namespace */;
model.transform.position = new Vector3(0f, 0f, 0f);

// 2) Assemble a whole structure with the fluent BuildingBuilder API.
GameObject shop = new BuildingBuilder("MyBuilding")
    .WithConfig(BuildingConfig.Medium)
    .AddFloor()
    .AddWalls(southDoor: true, eastWindow: true)
    .AddLights()
    .Build();
```

:::note
`PrimitiveBuilder.CreateBox`, `MaterialPresets.Emissive` and the `BuildingBuilder` fluent API shown here
match the current release, but the library keeps evolving - the glTF loader entry point and the full
`BuildingBuilder` surface in particular. Confirm the current signatures against the API docs before wiring
them in: [glTF loading](https://ifbars.github.io/S1MAPI/docs/gltf-loading.html) and the
[Prefabs API](https://ifbars.github.io/S1MAPI/api/S1MAPI.S1.Prefabs.html).
:::

## Licensing caution

:::caution[S1MAPI is GPL-3.0]
S1MAPI is licensed under **GPL-3.0**. Depending on a GPL-3 library has licensing implications for how you
can license and distribute your own mod - GPL-3 is a copyleft license, unlike the MIT license S1API uses.
Understand what that means for your project before you build on it. This is not legal advice; if you are
unsure, read the license text and decide accordingly.
:::

## Links

- Repo: <https://github.com/ifBars/S1MAPI>
- Docs: <https://ifbars.github.io/S1MAPI/>
- glTF loading: <https://ifbars.github.io/S1MAPI/docs/gltf-loading.html>
- Prefabs API: <https://ifbars.github.io/S1MAPI/api/S1MAPI.S1.Prefabs.html>
- Thunderstore (dependency `ifBars-S1MAPI-<ver>`): <https://thunderstore.io/c/schedule-i/p/ifBars/S1MAPI/>
- NuGet (package id `S1MAPI`): <https://www.nuget.org/packages/S1MAPI/>

Created by **ifBars** - [github.com/ifBars/S1MAPI](https://github.com/ifBars/S1MAPI).
