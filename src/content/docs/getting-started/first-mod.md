---
title: Your First Mod
description: A minimal MelonMod that logs on load and pokes at the scene, plus how to build, install, and test it.
sidebar:
  order: 5
---

Once you have a [project set up](/getting-started/project-setup/) (or cloned a
[template](/getting-started/project-templates/)), a first mod is just a `MelonMod` subclass. This walkthrough
keeps to "pure" MelonLoader + Unity calls, so the same code works on either
[branch](/getting-started/mono-vs-il2cpp/) without touching game types.

## The smallest possible mod

```csharp
using MelonLoader;
using UnityEngine;

public class MyFirstMod : MelonMod
{
    public override void OnInitializeMelon()
    {
        MelonLogger.Msg("MyFirstMod is alive!");
    }
}
```

Build it, drop the resulting DLL into the game's `Mods/` folder, launch, and look for `MyFirstMod is alive!`
in the MelonLoader console. If you see it, your project, references and loader are all wired correctly.

## Reacting to scenes and touching the world

`OnInitializeMelon` runs once, very early - before any game scene exists. To do anything with the world, wait
for a scene to load via `OnSceneWasLoaded` and gate on the scene name. This example finds a hair mesh on the
main-menu avatar and tints it red, with null-checks at every step (objects may not exist yet):

```csharp
using MelonLoader;
using UnityEngine;

public class MyFirstMod : MelonMod
{
    public override void OnInitializeMelon()
    {
        MelonLogger.Msg("MyFirstMod is alive!");
    }

    public override void OnSceneWasLoaded(int buildIndex, string sceneName)
    {
        if (sceneName != "Menu")
            return;

        GameObject hair = GameObject.Find(
            "Menu/Rig/Avatar/BodyContainer/Armature/mixamorig:Hips/mixamorig:Spine/mixamorig:Spine1/mixamorig:Spine2/mixamorig:Neck/mixamorig:Head/Spiky(Clone)/Spiky_LOD1");
        if (hair == null)
        {
            MelonLogger.Msg("Hair object not found");
            return;
        }

        MeshRenderer renderer = hair.GetComponent<MeshRenderer>();
        if (renderer != null)
            renderer.material.color = new Color(1, 0, 0); // red
    }
}
```

Two habits worth forming from the start:

- **Always null-check** the result of `GameObject.Find` / `GetComponent`. Scene objects come and go, and a
  missing object is a normal condition, not a crash.
- **Gate scene work by name.** `OnSceneWasLoaded` fires for every scene; check `sceneName` before acting.

> Source: **➶𝓐foxpython** - [original message](https://discord.com/channels/1349221936470687764/1357084455897923725/1359715065015570443)

To discover exact object paths and component names like the one above, run
[UnityExplorer](https://github.com/yukieiji/UnityExplorer/releases/latest) in-game and browse the live scene
hierarchy - see [Project Setup](/getting-started/project-setup/).

## Hooking the game's load event

Beyond scene loads, the game raises its own events you can subscribe to. A common one is "the save finished
loading", via `LoadManager`:

```csharp
if (LoadManager.Instance != null)
{
    LoadManager.Instance.onLoadComplete.AddListener(OnLoadComplete);
}

void OnLoadComplete()
{
    // The player is in-game and the save is ready.
}
```

Remember that `LoadManager` lives under the game's namespace, so this line is branch-specific
(`ScheduleOne.*` on Mono, `Il2Cpp`-prefixed on IL2CPP) - see [Mono vs IL2CPP](/getting-started/mono-vs-il2cpp/).

> Source: **Deleted User** - [original message](https://discord.com/channels/1349221936470687764/1357084455897923725/1359911911151374336)

## Build, install, test

1. **Build** your project - the output is a `.dll`.
2. **Copy** the DLL into the `Mods/` folder of your Schedule I install.
3. **Launch** the game and read the MelonLoader console for your log lines (and any errors).
4. **Iterate.** The [templates](/getting-started/project-templates/) can auto-copy the DLL and even launch the
   matching game build on each compile, which shortens this loop considerably.

## Where to go next

- Video walkthroughs help if you prefer to watch: the
  [Create Your First MelonMod](https://www.youtube.com/watch?v=_8B80owys4w) series is a good visual reference
  for newcomers.
- To patch existing game methods, read [MelonLoader patching](https://melonwiki.xyz/#/modders/patching) and
  the Harmony sections; for the IL2CPP-specific caveats see [IL2CPP Specifics](/il2cpp/).
- For higher-level building blocks (custom NPCs, quests, items, phone apps) consider
  [S1API](https://ifbars.github.io/S1API/), which handles a lot of the branch differences for you.

> Source: **chi chi** - [original message](https://discord.com/channels/1349221936470687764/1358830084919656619/1360416672745525412)
