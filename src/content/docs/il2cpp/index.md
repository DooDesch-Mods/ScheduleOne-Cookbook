---
title: IL2CPP Specifics
description: The extra techniques you need when modding the IL2CPP branch of Schedule I - interop, patching, delegates, console commands and debugging.
sidebar:
  order: 0
---

The default Steam build of Schedule I runs on **IL2CPP**: the game's C# was compiled to C++ and then to
native machine code, and MelonLoader talks to it through an interop layer. Your references show up under
`Il2Cpp`-prefixed namespaces (`Il2CppScheduleOne.*`, `Il2CppSystem.*`), and a lot of things that "just
work" on the Mono branch need extra ceremony here.

If you have not already, read [Mono vs IL2CPP](/getting-started/mono-vs-il2cpp/) first - it explains why
the two builds are not binary-compatible and how one codebase can target both. This section covers the
IL2CPP-only techniques that trip people up once they start writing real code.

## What is here

- **[Interop and Types](/il2cpp/interop-and-types/)** - converting between `System` and `Il2CppSystem`
  collections, constructing IL2CPP objects, registering your own types, and casting safely with `TryCast`.
- **[Harmony Patching](/il2cpp/patching/)** - what differs from Mono when you write patches, and how to
  override native virtual methods that the interop layer will not let you subclass.
- **[Delegates and Method Groups](/il2cpp/delegates-and-method-groups/)** - the fix for
  "Cannot convert method group to `System.IntPtr`" and how to wire up listeners, lambdas and game events.
- **[Unity Event System](/il2cpp/unity-event-system/)** - handling UI pointer/drag events when the
  interfaces you would normally implement have been compiled into concrete classes.
- **[Console Commands](/il2cpp/console-commands/)** - registering custom in-game console commands, and the
  workaround for the abstract `Execute` method not being overridable.
- **[Debugging with Ghidra](/il2cpp/debugging-with-ghidra/)** - setting up a native debugger to track down
  hard crashes when a stack trace is not enough.
- **[Common Crashes](/il2cpp/common-crashes/)** - the recurring IL2CPP error messages and what each one
  actually means.

:::note
Loading AssetBundles on IL2CPP (the `Il2CppAssetBundleManager`) is covered under
[Unity and AssetBundles](/unity-assetbundles/), since it is shared Unity authoring rather than an interop
technique.
:::
