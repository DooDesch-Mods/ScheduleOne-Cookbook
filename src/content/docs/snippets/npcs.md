---
title: NPCs
description: A hotkey helper that prints your live player coordinates, handy for placing NPCs and props.
sidebar:
  order: 2
---

Helpers for working with NPCs. When you are hand-placing NPCs (or anything else) in the world, the hardest
part is finding good coordinates. This snippet prints your live position to the MelonLoader console on a
keypress, already formatted as a `new Vector3(...)` you can paste straight into code.

## Print player coordinates on a hotkey

Add this to your `MelonMod`. Press **F6** in game and your current position is logged, including a
ready-to-copy `Vector3` literal.

```csharp
using ScheduleOne.PlayerScripts;

public override void OnUpdate()
{
    base.OnUpdate();

    // F6 - Display current player coordinates
    if (Input.GetKeyDown(KeyCode.F6))
    {
        DisplayPlayerCoordinates();
    }
}

private void DisplayPlayerCoordinates()
{
#if MONO
    try
    {
        var player = Player.Local;
        if (player == null)
        {
            LoggerInstance.Error("[Coordinates] Player instance not found!");
            return;
        }

        Vector3 position = player.transform.position;

        LoggerInstance.Msg("========================================");
        LoggerInstance.Msg($"[Coordinates] Player Position:");
        LoggerInstance.Msg($"[Coordinates] X: {position.x:F2}");
        LoggerInstance.Msg($"[Coordinates] Y: {position.y:F2}");
        LoggerInstance.Msg($"[Coordinates] Z: {position.z:F2}");
        LoggerInstance.Msg($"[Coordinates] Vector3: new Vector3({position.x:F1}f, {position.y:F3}f, {position.z:F1}f)");
        LoggerInstance.Msg("========================================");
    }
    catch (System.Exception ex)
    {
        LoggerInstance.Error($"[Coordinates] Failed to get player coordinates: {ex.Message}");
    }
#endif
}
```

The body is wrapped in `#if MONO`, so on the Mono branch it just works. For the IL2CPP branch, drop the
guard and use the `Il2CppScheduleOne.PlayerScripts` namespace.

> Source: **HazDS** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1444694882932228168)
