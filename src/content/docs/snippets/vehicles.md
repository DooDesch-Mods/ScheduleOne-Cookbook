---
title: Vehicles
description: A drop-in VehicleEvents singleton replacing the removed LandVehicle enter/exit events.
sidebar:
  order: 3
---

The `LandVehicle.onPlayerEnter/ExitVehicle` events were removed from the game, which broke mods that
relied on knowing when a player got in or out of a car. This is an almost drop-in replacement: a small
singleton that re-derives those events from `Player.onEnterVehicle` / `onExitVehicle` and exposes them as
clean delegates.

:::caution
The original events were removed in **v0.4.1f6**. This snippet targets the game around that point - check
the `Player` / `LandVehicle` members still exist on the build you are shipping against.
:::

## The `VehicleEvents` singleton

```csharp
public class VehicleEvents : Singleton<VehicleEvents>
{
    public delegate void PlayerEnterVehicleDelegate(Player player, LandVehicle vehicle);
    public delegate void PlayerExitVehicleDelegate(Player player, LandVehicle vehicle, Transform exitPoint);

    /// <summary>
    /// Called when a player enters a vehicle.
    /// Note: This is called for every player that is currently in a vehicle when this singleton is created.
    /// </summary>
    public PlayerEnterVehicleDelegate? PlayerEnterVehicle { get; set; }

    /// <summary>
    /// Called when a player exits a vehicle.
    /// </summary>
    public PlayerExitVehicleDelegate? PlayerExitVehicle { get; set; }

    private void OnEnable()
    {
        Player.onPlayerSpawned += OnPlayerSpawned;

        foreach (Player player in Player.PlayerList)
        {
            OnPlayerSpawned(player);
        }
    }

    private void OnDisable()
    {
        Player.onPlayerSpawned -= OnPlayerSpawned;
    }

    private void OnPlayerSpawned(Player player)
    {
        player.onEnterVehicle += (vehicle) => OnPlayerEnterVehicle(player, vehicle);
        player.onExitVehicle += (vehicle, exitPoint) => OnPlayerExitVehicle(player, vehicle, exitPoint);

        if (player.CurrentVehicle != null)
        {
            OnPlayerEnterVehicle(player, player.CurrentVehicle.GetComponent<LandVehicle>());
        }
    }

    private void OnPlayerEnterVehicle(Player player, LandVehicle vehicle)
    {
        PlayerEnterVehicle?.Invoke(player, vehicle);
    }

    private void OnPlayerExitVehicle(Player player, LandVehicle vehicle, Transform exitPoint)
    {
        PlayerExitVehicle?.Invoke(player, vehicle, exitPoint);
    }
}
```

## Creating it

Somewhere in your startup / init code, spawn the singleton's host GameObject once:

```csharp
// Create singleton for VehicleEvents
{
    var go = new GameObject("VehicleEvents", typeof(VehicleEvents));
    go.hideFlags = HideFlags.HideAndDontSave;
}
```

## Subscribing

```csharp
VehicleEvents.Instance.PlayerEnterVehicle += OnPlayerEnterVehicle;
VehicleEvents.Instance.PlayerExitVehicle += OnPlayerExitVehicle;

private void OnPlayerEnterVehicle(Player player, LandVehicle vehicle)
{
}

private void OnPlayerExitVehicle(Player player, LandVehicle vehicle, Transform exitPoint)
{
}
```

One behavior to be aware of: `OnEnable` fires the enter event for every player *already* sitting in a
vehicle when the singleton is created, which the original event did not do. In the author's experience that
makes multiplayer handling easier (players joining mid-game are covered), but if you want exact parity with
the old event, remove that initial loop.

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1436383548780318891)
