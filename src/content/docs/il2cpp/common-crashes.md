---
title: Common Crashes
description: The recurring IL2CPP error messages Schedule I modders hit, what each one actually means, and how to fix it.
sidebar:
  order: 7
---

IL2CPP errors are noisy and often point at the interop layer rather than the real cause. This page collects
the ones that come up again and again, with what each is actually telling you. For anything that hard-crashes
with no useful trace at all, set up the [Ghidra debugger](/il2cpp/debugging-with-ghidra/).

## "Could not resolve type with token ..."

```text
Could not resolve type with token 0100001c from typeref
(expected class 'Il2CppScheduleOne....' in assembly 'Assembly-CSharp, Version=0.0.0.0, ...')
```

Your mod references a game type that does not exist on the branch it was loaded into - almost always an
IL2CPP mod loaded on the Mono build or vice versa. The right fix is not to catch this at runtime but to tell
MelonLoader your mod's target domain up front, so it declines to load with a friendly message instead of
crashing. That convention (the `[assembly: MelonPlatformDomain(...)]` attribute) lives in
[Best Practices](/best-practices/); also double-check you shipped the correct DLL for the branch, as covered
in [Mono vs IL2CPP](/getting-started/mono-vs-il2cpp/).

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1413523041123831849)

## `ReflectionTypeLoadException` / `TypeLoadException`

```text
System.Reflection.ReflectionTypeLoadException: Unable to load one or more of the requested types.
Could not load type 'OptionValue' from assembly 'com.rlabrecque.steamworks.net, Version=0.0.0.0, ...'
because the format is invalid.
```

Something enumerated the types in an assembly (`Assembly.GetTypes()`) and one of them could not be loaded.
The named assembly is the culprit - here a Steamworks.NET build whose format the IL2CPP runtime cannot read.
This usually means a dependency you shipped (or that another mod shipped) does not match the interop build
the game expects. Make sure you reference the IL2CPP-compatible version of the library, not the stock Mono
one.

> Source: **MaxtorCoder** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1366350850808873052)

## `MissingMethodException` on a bundled library

```text
System.MissingMethodException: Method not found:
'System.Object Newtonsoft.Json.JsonConvert.DeserializeObject(System.String, System.Type, ...)'.
```

The assembly loaded, but the exact method overload your code calls is not present - a version mismatch
between the copy you compiled against and the copy actually loaded at runtime. Ship the matching version of
the dependency (or use the one already provided by the game / loader) rather than mixing versions.

> Source: **MaxtorCoder** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1366443420561707028)

## `EntryPointNotFoundException` on an abstract method

```text
Il2CppInterop.Runtime.Il2CppException:
System.EntryPointNotFoundException: Attempting to call abstract method
'ScheduleOne.Console+ConsoleCommand::Execute'
```

IL2CPP did not route a virtual/abstract call to your managed override, so it tried to invoke the abstract
base and failed. This is the core reason custom [console commands](/il2cpp/console-commands/) can register
yet do nothing - see that page for the Harmony-prefix workaround. More generally, remember that you
[cannot override native virtual methods](/il2cpp/patching/#overriding-native-virtual-methods) by subclassing
alone.

> Source: **MaxtorCoder** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1367103936435196085)

## `MethodAccessException` on `IEnumerator.MoveNext`

```text
System.MethodAccessException: Attempt to access method 'System.Collections.IEnumerator.MoveNext'
on type 'ScheduleOne.NPCs.Behaviour.StartMixingStationBehaviour' failed.
   at UnityEngine.MonoBehaviour.StartCoroutine(IEnumerator routine)
```

This fires when a patch starts a coroutine on a game behaviour whose `IEnumerator` implementation the interop
layer cannot reach. If you are injecting behaviour around a coroutine-driven method, avoid re-entering
`StartCoroutine` on the game type from your patch; drive the work from your own injected `MonoBehaviour`
instead.

> Source: **ArcheNovalis** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1365991643500515348)

## `TypeInitializationException` when injecting a type

```text
System.TypeInitializationException: The type initializer for
'MethodInfoStoreGeneric_AddComponent_Public_T_0`1' threw an exception.
```

Seen while registering a `MonoBehaviour` that implements Unity interfaces via
`[RegisterTypeInIl2CppWithInterfaces]`. The interface injection did not take. Fall back to the
`EventTrigger` approach documented in the [Unity Event System](/il2cpp/unity-event-system/) page.

> Source: **Overweight Unicorn** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1364845597718351953)

## Fields full of garbage instead of `null`

Not a crash, but a frequent cause of one: IL2CPP object fields are not zero-initialized. If you inspect a
freshly constructed object in UnityExplorer and see dictionaries or references set to random values rather
than `null`, that is expected. Assign every field you depend on explicitly in your constructor or `Awake`.
This bites hardest when subclassing FishNet's `NetworkBehaviour`, whose internal RPC/sync dictionaries must
be initialized by hand in `OnStartNetwork` - see [Networking](/networking/).

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1362296724579811399)
