---
title: Live-Apply Config Changes
description: React to MelonPreferences changes at runtime so edits made in-game take effect immediately instead of only after a restart.
sidebar:
  order: 6
---

Tools like ModsApp can edit and save your `MelonPreferences` while the game is running, but saving a
preference does **not** automatically change your mod's behaviour. Unless you react to the change, the
new value just sits there until the next restart. Treating config as *live-apply* - subscribing to
preference changes and applying them on the spot - makes your settings feel instant and is a small,
high-value bit of polish.

## The practice

- Subscribe to MelonLoader's `OnEntryValueChanged` event for the entries you care about (it exists on
  MelonLoader 0.7.x; guard for the case where it is unavailable).
- For cheap settings (a bool toggle), apply the new value **immediately** in the callback.
- For expensive changes (rebuilding meshes, re-reading a lot of state), **debounce** the apply and do
  the actual work on the main thread from `OnUpdate()`, so a user dragging a slider does not trigger a
  rebuild on every tick.

This reacts to runtime changes (ModsApp "Apply", or code setting `.Value`). It does not watch the
`.cfg` file on disk, so hand-editing the file while the game runs is out of scope.

## Usage shape

```csharp
// Immediate apply (no pump needed)
MelonPreferencesHotReload.SubscribeSafe(MyBoolEntry, (oldVal, newVal) =>
{
    ApplyMyFeatureToggle(newVal);
});

// Debounced apply (requires calling Pump() from OnUpdate)
MelonPreferencesHotReload.SubscribeDebounced(MyStringEntry, debounceMs: 500, (oldVal, newVal) =>
{
    RebuildEverything();
});

public override void OnUpdate()
{
    MelonPreferencesHotReload.Pump();
}
```

The full drop-in `MelonPreferencesHotReload` helper (plus a smoke test) is documented in the snippets
section: see [Preferences and Config](/snippets/preferences-config/) for the complete code you can paste
into your mod.

> Source: **Khundian** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1464249667255533628)
