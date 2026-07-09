---
title: Steam Lobby Data Sync
description: Sync small pieces of data between players through the Steam lobby using Steamworks.NET - the go-to networking route when FishNet code generation is unavailable (IL2CPP).
sidebar:
  order: 3
---

When you cannot use FishNet's custom RPCs - most importantly on the **IL2CPP** branch, where
[code generation does not run](/networking/custom-rpcs-and-codegen/#il2cpp-there-is-no-code-generator) -
you can still move data between players through the **Steam lobby** with Steamworks.NET. It is perfect
for settings, configurations, and small mod state. This page covers the raw Steamworks.NET approach; for
a higher-level wrapper see [SteamNetworkLib](/networking/steamworks-net-wrapper/).

## Two kinds of lobby data

Steam gives you two storage buckets, and the difference decides which way data can flow:

- **Lobby data** - global key/value storage. **Only the host may set it**, but every player can read it.
  Use it to broadcast host-authoritative state to everyone.
- **Lobby member data** - per-player key/value storage. **Each player sets their own**, and everyone can
  read anyone's. Use it to send a client's data back to the host (or to other clients).

> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1359340799548199102/1383168191034822716)

### Host-to-client vs client-to-host recipe

A clean way to think about it: lobby data flows host -> clients; lobby member data is what you need when
the host must receive something from a client. A worked example - to sync a track list between players,
the host sets the lobby data key `trackmanifest` to a hash of their list, and each client sets their
member data key `trackmanifest_<steamid>` to their own list. Both ends then read lobby data and member
data and compare.

> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1359340799548199102/1383174711722381314)

For structured data, serialize it (for example a dictionary) into a single string value and store that.
When only the host writes, lobby data alone is enough.

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1359340799548199102/1383139552381632553)
> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1359340799548199102/1383171723125461002)

## Setting up callbacks

Steamworks callbacks are created slightly differently on Mono and IL2CPP - IL2CPP needs an explicit
`System.Action` wrapper around your handler.

```csharp
// Initialize these callbacks in your mod's startup
private Callback<LobbyEnter_t> _lobbyEnteredCallback;
private Callback<LobbyChatUpdate_t> _chatUpdateCallback;

public void Initialize() {
#if MONO
    _lobbyEnteredCallback = Callback<LobbyEnter_t>.Create(OnLobbyEntered);
    _chatUpdateCallback = Callback<LobbyChatUpdate_t>.Create(OnPlayerEnterOrLeave);
#else
    // IL2CPP requires a System.Action wrapper
    _lobbyEnteredCallback = Callback<LobbyEnter_t>.Create(new Action<LobbyEnter_t>(OnLobbyEntered));
    _chatUpdateCallback = Callback<LobbyChatUpdate_t>.Create(new Action<LobbyChatUpdate_t>(OnPlayerEnterOrLeave));
#endif
}
```

## Syncing global lobby data (host only)

```csharp
// HOST sets data for EVERYONE to read
if (Singleton<Lobby>.Instance.IsHost) {
    // Store mod settings for all players to see
    SteamMatchmaking.SetLobbyData(
        Singleton<Lobby>.Instance.LobbySteamID,
        "my_mod_setting",
        "some_value"
    );
}

// ANY PLAYER can read global lobby data
string setting = SteamMatchmaking.GetLobbyData(
    Singleton<Lobby>.Instance.LobbySteamID,
    "my_mod_setting"
);
```

## Syncing per-player data

```csharp
// Set YOUR OWN player-specific data
SteamMatchmaking.SetLobbyMemberData(
    Singleton<Lobby>.Instance.LobbySteamID,
    "player_state",
    "ready"
);

// Read OTHER PLAYERS' data
foreach (var playerId in Singleton<Lobby>.Instance.Players) {
    string playerState = SteamMatchmaking.GetLobbyMemberData(
        Singleton<Lobby>.Instance.LobbySteamID,
        playerId,
        "player_state"
    );

    if (playerState == "ready") {
        // This player is ready!
    }
}
```

## Handling lobby events

```csharp
private void OnLobbyEntered(LobbyEnter_t result) {
    // Called when you join a lobby
    MelonLogger.Msg($"Entered lobby: {result.m_ulSteamIDLobby}");

    // Set your player data immediately
    SteamMatchmaking.SetLobbyMemberData(
        new CSteamID(result.m_ulSteamIDLobby),
        "mod_version",
        "1.2.3"
    );
}

private void OnPlayerEnterOrLeave(LobbyChatUpdate_t result) {
    // Called when lobby membership changes
    MelonLogger.Msg($"Player {result.m_ulSteamIDUserChanged} " +
                    $"event: {result.m_rgfChatMemberStateChange}");
}
```

## Practical limits and tips

- **Data limits:** roughly 8 KB per player for member data, and a limited total size for lobby data.
- **Non-host safety:** only the host can set lobby data, but anyone can set their own member data.
- **Persistence:** lobby data persists as long as the lobby exists.
- **Frequency:** do not spam updates. Detect changes and only write when something actually changed.
- **Storage:** for larger payloads, use Steam P2P packet transfers instead of lobby data.
- Reference: [Steamworks API docs](https://partner.steamgames.com/doc/api).

> Source: **Bars** - [original message](https://discord.com/channels/1349221936470687764/1383377096503463967/1383377096503463967)

:::note
The snippets use `Singleton<Lobby>` from the game's own lobby class (`ScheduleOne.Lobby` on Mono;
`Il2CppScheduleOne.Lobby` on IL2CPP). The Steamworks.NET types (`SteamMatchmaking`, `CSteamID`,
`Callback<T>`) come from `com.rlabrecque.steamworks.net`, which is already shipped with the game.
:::
