---
title: Preferences & Config
description: Hot-reload MelonPreferences at runtime, apply per-save config, and run code after load.
sidebar:
  order: 6
---

Configuration helpers: applying MelonPreferences changes the instant the user edits them, keying settings
to the current save, and running code once the savegame has finished loading.

## Live-apply MelonPreferences (hot reload)

ModsApp (and code that sets `.Value`) can change your `MelonPreferences` at runtime, but your mod will not
*act* on a change unless you subscribe to it. This single-file helper wraps `OnEntryValueChanged` (using
reflection so it works across MelonLoader versions, and returns `false` if the runtime does not support it)
and offers two modes:

- **Immediate** apply via `SubscribeSafe` - for cheap changes (a toggle, a color).
- **Debounced** apply via `SubscribeDebounced` - for expensive rebuilds; coalesces rapid edits and runs
  your handler from `Pump()`, which you call in `OnUpdate()` to stay on the main thread.

It reacts to runtime changes only - it does not watch the `.cfg` file on disk.

### Usage

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

### The helper

```csharp
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Reflection;
using MelonLoader;

namespace Khundian.S1.HotReload
{
    /// <summary>
    /// Drop-in helpers for reacting to MelonPreferences changes immediately (via OnEntryValueChanged).
    /// This does not watch the .cfg file on disk.
    /// </summary>
    internal static class MelonPreferencesHotReload
    {
        private sealed class Pending
        {
            public long DueAtTicks;
            public Action? Action;
        }

        private static readonly Dictionary<string, Pending> PendingByKey = new(StringComparer.Ordinal);

        private static long NowTicks() => Stopwatch.GetTimestamp();

        private static long MsToTicks(int ms)
        {
            if (ms <= 0) return 0;
            // Convert ms to ticks using Stopwatch frequency (works on net48 and net6.0).
            return (long)ms * Stopwatch.Frequency / 1000;
        }

        /// <summary>
        /// Runs due debounced actions. Call this from your MelonMod.OnUpdate() if you use SubscribeDebounced.
        /// </summary>
        public static void Pump()
        {
            if (PendingByKey.Count == 0) return;

            long now = NowTicks();

            string[]? keys = null;
            int keyCount = 0;

            foreach (var kv in PendingByKey)
            {
                var pending = kv.Value;
                if (pending.Action == null) continue;
                if (pending.DueAtTicks > now) continue;

                keys ??= new string[PendingByKey.Count];
                keys[keyCount++] = kv.Key;
            }

            if (keys == null) return;

            for (int i = 0; i < keyCount; i++)
            {
                var key = keys[i];
                if (!PendingByKey.TryGetValue(key, out var pending)) continue;
                var action = pending.Action;
                pending.Action = null;
                if (action == null) continue;

                try { action(); }
                catch (Exception ex) { SafeLogWarning($"[HotReload] Debounced handler threw for key='{key}': {ex}"); }
            }
        }

        /// <summary>
        /// Subscribes to OnEntryValueChanged if available. Returns false if the runtime does not support it.
        /// </summary>
        public static bool SubscribeSafe<T>(MelonPreferences_Entry<T> entry, Action<T, T> onChanged, string? nameForLogs = null)
        {
            if (entry == null) throw new ArgumentNullException(nameof(entry));
            if (onChanged == null) throw new ArgumentNullException(nameof(onChanged));

            nameForLogs ??= entry.GetType().Name;

            Action<T, T> wrapped = (oldVal, newVal) =>
            {
                try { onChanged(oldVal, newVal); }
                catch (Exception ex) { SafeLogWarning($"[HotReload] Handler threw for '{nameForLogs}': {ex}"); }
            };

            return TrySubscribeOnEntryValueChanged(entry, wrapped);
        }

        /// <summary>
        /// Debounced variant: coalesces rapid changes and runs your handler from Pump() (main thread).
        /// </summary>
        public static bool SubscribeDebounced<T>(
            MelonPreferences_Entry<T> entry,
            int debounceMs,
            Action<T, T> onChanged,
            string? key = null,
            string? nameForLogs = null)
        {
            if (entry == null) throw new ArgumentNullException(nameof(entry));
            if (onChanged == null) throw new ArgumentNullException(nameof(onChanged));
            if (debounceMs < 0) throw new ArgumentOutOfRangeException(nameof(debounceMs));

            key ??= $"{entry.GetHashCode():x}";
            nameForLogs ??= entry.GetType().Name;

            Action<T, T> wrapped = (oldVal, newVal) =>
            {
                try
                {
                    EnqueueDebounced(
                        key,
                        debounceMs,
                        () =>
                        {
                            try { onChanged(oldVal, newVal); }
                            catch (Exception ex) { SafeLogWarning($"[HotReload] Handler threw for '{nameForLogs}': {ex}"); }
                        });
                }
                catch (Exception ex)
                {
                    SafeLogWarning($"[HotReload] Failed to enqueue debounced handler for '{nameForLogs}': {ex}");
                }
            };

            return TrySubscribeOnEntryValueChanged(entry, wrapped);
        }

        private static void EnqueueDebounced(string key, int debounceMs, Action action)
        {
            if (!PendingByKey.TryGetValue(key, out var pending))
            {
                pending = new Pending();
                PendingByKey[key] = pending;
            }

            pending.Action = action;
            pending.DueAtTicks = NowTicks() + MsToTicks(debounceMs);
        }

        private static bool TrySubscribeOnEntryValueChanged<T>(MelonPreferences_Entry<T> entry, Action<T, T> handler)
        {
            try
            {
                // Use reflection to avoid hard dependency on OnEntryValueChanged presence across MelonLoader versions.
                var entryType = entry.GetType();
                object? eventObj = null;

                // Some MelonLoader builds expose this as a public field (not a property).
                var eventProp = entryType.GetProperty("OnEntryValueChanged", BindingFlags.Instance | BindingFlags.Public);
                if (eventProp != null)
                {
                    eventObj = eventProp.GetValue(entry);
                }
                else
                {
                    var eventField = entryType.GetField("OnEntryValueChanged", BindingFlags.Instance | BindingFlags.Public);
                    if (eventField == null) return false;
                    eventObj = eventField.GetValue(entry);
                }

                if (eventObj == null) return false;

                var subscribeMethods = eventObj.GetType().GetMethods(BindingFlags.Instance | BindingFlags.Public);
                MethodInfo? subscribe = null;
                ParameterInfo[]? parameters = null;

                foreach (var m in subscribeMethods)
                {
                    if (!string.Equals(m.Name, "Subscribe", StringComparison.Ordinal)) continue;
                    var ps = m.GetParameters();
                    if (ps.Length == 1)
                    {
                        subscribe = m;
                        parameters = ps;
                        break;
                    }
                }

                if (subscribe == null)
                {
                    // MelonLoader 0.7.x uses Subscribe(LemonAction<T,T>, int priority, bool something)
                    foreach (var m in subscribeMethods)
                    {
                        if (!string.Equals(m.Name, "Subscribe", StringComparison.Ordinal)) continue;
                        var ps = m.GetParameters();
                        if (ps.Length == 3 && ps[1].ParameterType == typeof(int) && ps[2].ParameterType == typeof(bool))
                        {
                            subscribe = m;
                            parameters = ps;
                            break;
                        }
                    }
                }

                if (subscribe == null)
                {
                    // Some builds may expose Subscribe(delegate, int)
                    foreach (var m in subscribeMethods)
                    {
                        if (!string.Equals(m.Name, "Subscribe", StringComparison.Ordinal)) continue;
                        var ps = m.GetParameters();
                        if (ps.Length == 2 && ps[1].ParameterType == typeof(int))
                        {
                            subscribe = m;
                            parameters = ps;
                            break;
                        }
                    }
                }

                if (subscribe == null || parameters == null) return false;

                var expectedDelegateType = parameters[0].ParameterType;
                Delegate del;

                // Some MelonLoader builds accept System.Action<T,T>, others use LemonAction<T,T>.
                if (expectedDelegateType.IsInstanceOfType(handler))
                {
                    del = (Delegate)(object)handler;
                }
                else if (handler.Target == null)
                {
                    del = Delegate.CreateDelegate(expectedDelegateType, handler.Method);
                }
                else
                {
                    del = Delegate.CreateDelegate(expectedDelegateType, handler.Target, handler.Method);
                }

                if (parameters.Length == 1)
                {
                    subscribe.Invoke(eventObj, new object[] { del });
                }
                else if (parameters.Length == 2)
                {
                    subscribe.Invoke(eventObj, new object[] { del, 0 });
                }
                else
                {
                    subscribe.Invoke(eventObj, new object[] { del, 0, false });
                }

                return true;
            }
            catch
            {
                return false;
            }
        }

        private static void SafeLogWarning(string message)
        {
            try { MelonLogger.Warning(message); } catch { }
        }
    }
}
```

> Source: **Khundian** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1464249667255533628)

## Per-save configuration

To apply different configuration per save slot (`save_1`, `save_2`, ...), key off the loaded game folder.
This coroutine waits until the game is fully loaded and the folder path is known, then uses the folder name
as a stable per-save identifier.

```csharp
private IEnumerator CheckCurrentSave()
{
    // Wait until the LoadManager is ready and the game is loaded.
    yield return new WaitUntil(() => Singleton<LoadManager>.Instance != null && Singleton<LoadManager>.Instance.IsGameLoaded);

    // Wait until the LoadedGameFolderPath is non-empty.
    yield return new WaitUntil(() => !string.IsNullOrEmpty(Singleton<LoadManager>.Instance.LoadedGameFolderPath));

    // Use the loaded game folder path as the unique identifier.
    string savePath = Singleton<LoadManager>.Instance.LoadedGameFolderPath;
    string newOrg = Path.GetFileName(savePath);
    if (!string.IsNullOrEmpty(newOrg))
    {
        // other code here for configuration based off save file
    }
    else
    {
        MelonLogger.Warning("Could not determine save organization from the loaded game folder path.");
    }
}
```

> Source: **hiccup** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1358678034760208496)

## Run code after the savegame loads

A lot of mod logic needs to run *after* the save is loaded, not during startup. Subscribe to
`LoadManager.Instance.onLoadComplete`:

```csharp
void Start()
{
    if (LoadManager.Instance != null)
    {
        LoadManager.Instance.onLoadComplete.AddListener(OnLoadComplete);
    }
}

void OnLoadComplete()
{
    // Do something amazing
}
```

Note on timing: `onLoadComplete` fires after the map is loaded but before the save data is fully applied.
If you need the game to be *completely* loaded, look for the later save-loaded event instead.

> Source: **DooDesch** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1358957837321244682)
> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1359322069132775696)
