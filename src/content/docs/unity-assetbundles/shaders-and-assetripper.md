---
title: Shaders and the AssetRipper Workflow
description: Rip the full game into Unity with AssetRipper and fix the URP shaders so ripped materials are not invisible in-game.
sidebar:
  order: 2
---

The [stripped-scripts project](/unity-assetbundles/stripped-scripts-project/) gives you script
references but not the game's actual meshes, materials and shaders. When you need those - or you are on
IL2CPP, where no pre-built project exists - you rip the whole game into a Unity project with
**AssetRipper**. The one recurring gotcha is shaders: ripped materials use stub URP shaders that render
as invisible in the game, so you have to swap them back to the real ones.

## Ripping the project with AssetRipper

AssetRipper: [AssetRipper/AssetRipper](https://github.com/AssetRipper/AssetRipper). Use the Unity
Editor version that matches the game (the official docs target **2022.3.32f1**; confirm against the
current release).

1. **Download and launch AssetRipper.** Build the free GUI if a build is not already provided.
2. **Load the game files.** `File > Open Folder` and pick your Schedule I install directory
   (for example `C:\Program Files (x86)\Steam\steamapps\common\Schedule I`). Wait for the green
   "View Loaded Files" button to confirm the files were detected.
3. **Export.** `Export > Export all files`, choose an empty destination folder, and select
   "Export Unity Project". This takes a while.
4. **Create the Unity project** (same Unity version) while the export runs.
5. **Apply the shader fix** (next section) before or right after opening the project.
6. **Merge the export in.** Move the exported `Assets`, `Packages` and `ProjectSettings` folders into
   your Unity project. When prompted to replace the handful of files created by the shader-fix setup,
   **do not replace them**. Then open the project - the first import is slow.

> Source: **spec** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1413344422774571029)

The community's step-by-step lives in the official docs at
[s1modding.github.io/docs/moddevs/ripping_the_project](https://s1modding.github.io/docs/moddevs/ripping_the_project/).

## Fixing invisible materials (URP shaders)

Ripped materials come in with stub / "fake" shaders that do not render under the game's Universal Render
Pipeline, so everything looks invisible. The root cause is the URP shader mismatch.

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1509250586007310448)

There are three ways the community fixes this, in rough order of convenience:

### 1. SIShaderFix (recommended)

[xmusjackson/SIShaderFix](https://github.com/xmusjackson/SIShaderFix) is a URP shader-fix `unitypackage`.
Import it, find and run its **Setup Script**, then let it re-point materials at the correct URP shaders.
It does not fix 100% of materials but gets very close. (This is the package referenced as "SIShaderFix"
in the ripping steps above.)

### 2. The shader-swapper editor script

For fixing shaders one at a time, MedicalMess shared a small editor window. Drop `ShaderSwapper.cs`
into an `Editor` folder (create one if you do not have it), then open **Tools > Shader Swapper**. Assign
the bad ripped shader as the **Target Shader** (a handy trick is to rename the fake shader, for example
to `lit1`, so you can find it) and the real Unity/URP shader as the **New Shader**, then click **Swap
Shaders**. It reassigns every material that used the target shader.

```csharp
using UnityEngine;
using UnityEditor;

public class ShaderSwapper : EditorWindow
{
    Shader targetShader;
    Shader newShader;
    int materialCount = -1;

    [MenuItem("Tools/Shader Swapper")]
    public static void ShowWindow()
    {
        GetWindow<ShaderSwapper>("Shader Swapper");
    }

    void OnGUI()
    {
        GUILayout.Label("Swap Materials' Shaders", EditorStyles.boldLabel);
        targetShader = EditorGUILayout.ObjectField("Target Shader", targetShader, typeof(Shader), false) as Shader;
        newShader = EditorGUILayout.ObjectField("New Shader", newShader, typeof(Shader), false) as Shader;
        if (targetShader != null)
        {
            if (GUILayout.Button("Count Materials"))
            {
                materialCount = CountMaterials(targetShader);
            }

            if (materialCount >= 0)
            {
                EditorGUILayout.LabelField("Materials using target shader:", materialCount.ToString());
            }
        }

        if (GUILayout.Button("Swap Shaders"))
        {
            if (targetShader == null || newShader == null)
            {
                Debug.LogError("Please assign both a Target Shader and a New Shader.");
                return;
            }
            SwapShaders();
            materialCount = CountMaterials(targetShader);
        }
    }

    void SwapShaders()
    {
        string[] materialGuids = AssetDatabase.FindAssets("t:Material");
        int swapCount = 0;

        foreach (string guid in materialGuids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            Material mat = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (mat != null && mat.shader == targetShader)
            {
                mat.shader = newShader;
                EditorUtility.SetDirty(mat);
                swapCount++;
            }
        }

        Debug.Log($"Shader swap complete. Updated {swapCount} material(s).");
        AssetDatabase.SaveAssets();
    }

    int CountMaterials(Shader shader)
    {
        int count = 0;
        string[] materialGuids = AssetDatabase.FindAssets("t:Material");
        foreach (string guid in materialGuids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            Material mat = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (mat != null && mat.shader == shader)
            {
                count++;
            }
        }
        Debug.Log($"Found {count} materials using {shader.name}.");
        return count;
    }
}
```

> Source: **MedicalMess** - [original message](https://discord.com/channels/1349221936470687764/1360313393697001544/1360313393697001544)

### 3. Pre-fixed shader graphs

MaxtorCoder shared corrected shader graphs for two shaders that are especially fiddly - the **Glass**
shader and the **WorldspaceUV_new** shader. Grab `GlassShader.shadergraph` and the accompanying test
graph from the pinned message and use them in place of the ripped versions.

> Source: **MaxtorCoder** - [original message](https://discord.com/channels/1349221936470687764/1359965818787598397/1367177799143657614)

## A note on shaders for code-created materials

If you build a material in code at runtime (instead of shipping it in a bundle), the same URP rules bite
you. On IL2CPP the community's findings:

- `Shader.Find("Universal Render Pipeline/Lit")` is the correct shader for opaque, lit, runtime-created
  3D geometry (props, meshes).
- `Shader.Find("Sprites/Default")` or `Shader.Find("Unlit/Transparent")` for 2D sprites and flat planes.
- `Shader.Find("Standard")` returns null or renders broken under URP - **do not use it.** The legacy
  Standard shader with Fade mode does not render in URP either.

:::caution
These map onto the Universal Render Pipeline the game uses; there is no built-in/standard render
pipeline fallback. Prefer reusing a material off an existing game object over constructing one from a
`Shader.Find` when you can.
:::
