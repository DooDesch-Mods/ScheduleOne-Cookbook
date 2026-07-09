---
title: Known Harmony Hook Points
description: Useful vanilla methods the community has found for Harmony patching, and what each is good for.
sidebar:
  order: 3
---

A running list of vanilla methods that make good Harmony patch targets, with what each one is useful
for. These come from community mod-testing and reverse engineering. Method names and signatures drift
between game versions - always confirm a target still exists in the build you are targeting (see
[Tracking Game Updates](/core-concepts/tracking-game-updates/)).

For general Harmony patching under IL2CPP, see the [IL2CPP](/il2cpp/) section. Note that MelonLoader
auto-applies your `[HarmonyPatch]` attributes on startup, so you usually do not need to call
`PatchAll()` yourself.

## Registry.Awake - register custom items and prefabs

Prefix-patch `Registry.Awake` to inject your own `ItemDefinition`s and networked prefab objects into
the game's registry as it initialises. This is the classic entry point for adding custom items from an
AssetBundle. A 16-bit asset-bundle hash is used to key the FishNet prefab collection:

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
            if (registry.ItemRegistry.Any(x => x.ID == itemDefinition.ID))
                continue;

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
                netPrefabs.AddObject(networkObject, checkForDuplicates: true);
        }
    }
}
```

The hash extension it relies on:

```csharp
public static ushort Get16BitHash(this AssetBundle assetBundle)
{
    if (assetBundle == null)
        throw new ArgumentNullException(nameof(assetBundle));
    int hash = 0;
    unchecked
    {
        foreach (string assetName in assetBundle.GetAllAssetNames())
        {
            hash *= 31 * assetName.GetHashCode();
        }
        hash *= 31 * assetBundle.name.GetHashCode();
    }
    return (ushort)(ushort.MaxValue - (ushort)(hash % ushort.MaxValue));
}
```

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1359965714672517302/1359991926522380460)

## Player vehicle enter/exit

The old `LandVehicle.onPlayerEnter` / `onPlayerExit` events were removed in v0.4.1f6. Instead, subscribe
to the per-player events `Player.onEnterVehicle` and `Player.onExitVehicle` (hooking `Player.onPlayerSpawned`
so you catch players who join later). The community wrapped this into a drop-in `VehicleEvents` singleton
that re-exposes the enter/exit callbacks:

```csharp
public class VehicleEvents : Singleton<VehicleEvents>
{
    public delegate void PlayerEnterVehicleDelegate(Player player, LandVehicle vehicle);
    public delegate void PlayerExitVehicleDelegate(Player player, LandVehicle vehicle, Transform exitPoint);

    public PlayerEnterVehicleDelegate? PlayerEnterVehicle { get; set; }
    public PlayerExitVehicleDelegate? PlayerExitVehicle { get; set; }

    private void OnEnable()
    {
        Player.onPlayerSpawned += OnPlayerSpawned;
        foreach (Player player in Player.PlayerList)
            OnPlayerSpawned(player);
    }

    private void OnDisable()
    {
        Player.onPlayerSpawned -= OnPlayerSpawned;
    }

    private void OnPlayerSpawned(Player player)
    {
        player.onEnterVehicle += (vehicle) => PlayerEnterVehicle?.Invoke(player, vehicle);
        player.onExitVehicle += (vehicle, exitPoint) => PlayerExitVehicle?.Invoke(player, vehicle, exitPoint);

        if (player.CurrentVehicle != null)
            PlayerEnterVehicle?.Invoke(player, player.CurrentVehicle.GetComponent<LandVehicle>());
    }
}
```

Create it once during startup:

```csharp
var go = new GameObject("VehicleEvents", typeof(VehicleEvents));
go.hideFlags = HideFlags.HideAndDontSave;
```

Firing the enter callback for players already in a vehicle when the singleton spawns is a deliberate
choice - it makes mid-game joins easier to handle in multiplayer. Drop that part of `OnPlayerSpawned`
if you want to match the original event's behaviour exactly.

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1436383548780318891)

## Player name labels and nametag text

To hide player nametags, patch `Player.Update` and disable the label:

```csharp
// In a Player.Update postfix:
__instance.NameLabel.gameObject.SetActive(false);
```

The networked nametag text itself is driven through the player's `RpcLogic`, and related worldspace
label rendering lives in `ScheduleOne.Map.POI.SetMainText` and
`ScheduleOne.UI.WorldspaceDialogueRenderer.ShowText()` - useful starting points if you want to
customise rather than hide the labels.

> Source: **NanobotZ** - [original message](https://discord.com/channels/1349221936470687764/1359340799548199102/1365492373991456820)

## Intercepting mid-game joins

Players can join a multiplayer game already in progress. There is a vanilla join method you can
Harmony-patch to run logic when a client joins mid-session - a good hook for syncing custom state to
late joiners.

> Source: **Real Name** - [original message](https://discord.com/channels/1349221936470687764/1359340799548199102/1365487058772168765)
