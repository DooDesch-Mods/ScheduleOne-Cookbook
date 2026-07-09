---
title: Harmony Patching
description: How Harmony patches differ on the IL2CPP branch, and how to override native virtual methods the interop layer will not let you subclass.
sidebar:
  order: 2
---

Harmony works on the IL2CPP branch, and the attributes you already know (`[HarmonyPatch]`, `[HarmonyPrefix]`,
`[HarmonyPostfix]`) behave the same way. What changes is the **types** you reference in your patch and the
shapes some parameters take once the game has been compiled to native code. This page covers those
differences, plus the one thing you genuinely cannot do the normal way: override a native virtual method.

## Patch signatures use `Il2Cpp`-prefixed types

Target the interop types, not the Mono ones. The class you patch, and any game types in your patch method's
parameters, live under `Il2CppScheduleOne.*` (and collections under `Il2CppSystem.*`). A postfix that reads
a compass element looks like this:

```csharp
[HarmonyPatch(typeof(Il2CppScheduleOne.UI.Compass.CompassManager), "AddElement")]
public static class CompassPatch
{
    static void Postfix(Il2CppScheduleOne.UI.Compass.CompassManager __instance,
                        Il2CppScheduleOne.UI.Compass.CompassManager.Element __0)
    {
        if (__0.Visible && __0.Transform != null)
        {
            float distance = Vector3.Distance(
                PlayerSingleton<PlayerCamera>.Instance.transform.position,
                __0.Transform.position);
            __0.DistanceLabel.text = Mathf.CeilToInt(distance).ToString() + "m";
        }
    }
}
```

> Source: **animandan** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1361399500853350560)

When a patched method takes a collection, the parameter is the `Il2CppSystem` list, so match that exactly or
Harmony will not bind the patch:

```csharp
[HarmonyPatch(typeof(RouteListFieldUI), "Refresh")]
public static class RouteListFieldUIRefreshPatch
{
    [HarmonyPostfix]
    public static void Postfix(Il2CppSystem.Collections.Generic.List<AdvancedTransitRoute> newVal,
                              RouteListFieldUI __instance)
    {
        foreach (AdvancedTransitRoute route in newVal)
        {
            AdvancedTransitRouteData routeData = route.GetData();
            // ...
        }
    }
}
```

> Source: **Real Name** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1365027998922969221)

:::tip
On the Mono branch the exact same patch drops the `Il2Cpp` prefixes (`ScheduleOne.*`,
`System.Collections.Generic.List`). If you support both branches, the
[`#if MONO` namespace-swap pattern](/getting-started/mono-vs-il2cpp/) keeps a single patch compiling for
both.
:::

## Overriding native virtual methods

Here is the hard limit: **you cannot override a virtual or abstract method of an IL2CPP game type just by
subclassing it in C#.** The C# `override` compiles fine, but the native side never routes calls to your
managed method - so it either silently runs the original or throws when the base is abstract. (This is
exactly why custom [console commands](/il2cpp/console-commands/) need a workaround for their `Execute`
method.)

When a Harmony prefix on the base method is enough, prefer that - it is the simplest fix. When you need your
override to actually sit in the type's vtable (for example so the game's own internal calls reach your code),
you can replace the vtable slot directly.

### Replacing a vtable slot

Grab the native class pointer, offset to the vtable, and write your function pointer into the method's slot.
The slot index matches the method's order in the original type, and each slot is `0x10` bytes:

```csharp
private unsafe void ReplaceVTableMethodPtr<T>(IntPtr funcPtr, int index)
{
    IntPtr klassPtr = Il2CppClassPointerStore<T>.NativeClassPtr;
    IntPtr vtablePtr = klassPtr + 0x138;
    IntPtr slotPtr = vtablePtr + (index * 0x10);
    *(IntPtr*)slotPtr = funcPtr;
}
```

Your replacement method must be a static function with the native calling convention, and every reference
parameter arrives as an `IntPtr` (even a `bool` may arrive as an integer). Wrap those pointers back into
managed objects with `new Il2CppObjectBase(ptr).Cast<T>()`:

```csharp
[UnmanagedCallersOnly(CallConvs = [typeof(CallConvStdcall)])]
public static unsafe void WriteFull(IntPtr thisPtr, IntPtr writerPtr, IntPtr _)
{
    var writer = new Il2CppObjectBase(writerPtr).Cast<PooledWriter>();
    var thisObj = new Il2CppObjectBase(thisPtr).Cast<MySyncType>();
    // ... write your data
}
```

You can take the function pointer straight from the method with C# 9 function pointers, which avoids
allocating a delegate:

```csharp
private unsafe void SetupOverloads()
{
    ReplaceVTableMethodPtr<MySyncType>(
        (IntPtr)(delegate* unmanaged[Stdcall]<IntPtr, IntPtr, IntPtr, void>)&WriteFull, 17);
}
```

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1363935349453226334)
> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1365611545622614187)
> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1365612154782355578)

:::caution
Vtable patching writes to raw memory at hardcoded offsets - a wrong slot index corrupts the object. The main
real-world use for it here is making FishNet sync types work under IL2CPP; if that is your goal, see
[Networking](/networking/) for the surrounding sync-object setup. To confirm a slot index or a native
signature, step through the method in [Ghidra](/il2cpp/debugging-with-ghidra/).
:::

## Reading native parameter shapes

The original managed signature tells you the logical parameters, but the native version replaces every
object with a pointer and may widen small value types. For example the FishNet method whose managed signature
is:

```csharp
public override void WriteDelta(PooledWriter writer, bool resetSyncTick = true)
```

arrives at the native boundary as `(IntPtr thisPtr, IntPtr writerPtr, long resetSyncTick, IntPtr methodInfo)`
- the implicit `this` and `MethodInfo*` pointers are added, the object becomes an `IntPtr`, and the `bool`
comes through as an integer. When in doubt, compare against the pseudocode Ghidra generates for the function.

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1363936391393841293)
