---
title: Interop and Types
description: Converting between System and Il2CppSystem collections, constructing and registering IL2CPP objects, and casting safely with TryCast.
sidebar:
  order: 1
---

On the Mono branch you write ordinary managed C#. On IL2CPP the game's types live behind an interop layer,
so managed and native types are **not** the same thing. A `System.Collections.Generic.List<T>` is not an
`Il2CppSystem.Collections.Generic.List<T>`, a plain `new MyClass()` is not enough to construct an object
the runtime can see, and a downcast that would just work on Mono needs `TryCast` here. This page collects
the interop patterns you reach for constantly.

## Converting between `List<T>` and `Il2CppSystem.List<T>`

Game methods that take or return a list expect the `Il2CppSystem` variant, but you usually want to work
with a normal `System` list in your own code. These helpers convert both directions. The type parameter is
constrained to `Il2CppSystem.Object` because only reference types the runtime knows about can live in an
IL2CPP list.

```csharp
/// <summary>
/// Converts a System.Collections.Generic.List<T> to an Il2CppSystem.Collections.Generic.List<T>.
/// </summary>
public static Il2CppSystem.Collections.Generic.List<T> ConvertList<T>(List<T> systemList)
    where T : Il2CppSystem.Object
{
    if (systemList == null)
        return new Il2CppSystem.Collections.Generic.List<T>();

    Il2CppSystem.Collections.Generic.List<T> il2cppList = new(systemList.Count);
    foreach (var item in systemList)
    {
        if (item != null)
            il2cppList.Add(item);
    }
    return il2cppList;
}

/// <summary>
/// Converts an Il2CppSystem.Collections.Generic.List<T> to a System.Collections.Generic.List<T>.
/// </summary>
public static List<T> ConvertList<T>(Il2CppSystem.Collections.Generic.List<T> il2cppList)
    where T : Il2CppSystem.Object
{
    if (il2cppList == null)
        return new List<T>();

    List<T> systemList = new(il2cppList.Count);
    for (int i = 0; i < il2cppList.Count; i++)
    {
        var item = il2cppList[i];
        if (item != null)
            systemList.Add(item);
    }
    return systemList;
}
```

> Source: **ArcheNovalis** - [original message](https://discord.com/channels/1349221936470687764/1365109996416925757/1365109996416925757)

For primitive element types (`int`, `float`, and so on) that do not satisfy the
`where T : Il2CppSystem.Object` constraint, the quickest path is `ToArray()`, since the array constructor
of a `System.List` accepts an `Il2CppSystem` array:

```csharp
Il2CppSystem.Collections.Generic.List<int> il2cpp_ints = new();
il2cpp_ints.Add(1);
il2cpp_ints.Add(2);

System.Collections.Generic.List<int> ints = new(il2cpp_ints.ToArray());
```

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1364648533696839720)

Whenever a game field or method wants a list, hand it an `Il2CppSystem` list directly rather than a managed
one - for example when assigning `EventTrigger.triggers`:

```csharp
trigger.triggers = new Il2CppSystem.Collections.Generic.List<EventTrigger.Entry>();
```

## Constructing IL2CPP objects

If you write a class that derives from `Il2CppSystem.Object` (or `MonoBehaviour`), or that you will
instantiate from managed code, you must provide two constructors. The `IntPtr` constructor is what IL2CPP
uses when it hands you back an existing native object; the parameterless constructor is what your own
managed code calls to allocate a new one.

```csharp
public class MyClass : Il2CppSystem.Object
{
    // Used by IL2CPP when it wraps an existing native instance
    public MyClass(IntPtr ptr) : base(ptr) { }

    // Used by managed code when creating a new instance
    public MyClass() : base(ClassInjector.DerivedConstructorPointer<MyClass>())
    {
        ClassInjector.DerivedConstructorBody(this);
    }

    // Your fields and methods
    public Il2CppSystem.Guid PlantGuid;
}
```

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1365068327264976957)
> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1362264265784037438)

:::caution
IL2CPP object fields are **not** zero-initialized the way managed fields are. Reading a field you never
set can return garbage rather than `null`. If your class relies on a field being `null`/empty at start,
assign it explicitly in your constructor or an `Awake`.
:::

## Registering your own types

For the runtime to recognise a class you define - so it can be added as a component, injected into a bundle,
or used as a game type - it has to be registered with the IL2CPP domain. The simplest way is the
`[RegisterTypeInIl2Cpp]` attribute; MelonLoader calls `ClassInjector` for you at load time. A minimal
injected `MonoBehaviour` looks like this:

```csharp
[RegisterTypeInIl2Cpp]
public class MyBehaviour : MonoBehaviour
{
    public MyBehaviour(IntPtr ptr) : base(ptr) { }

    void Start() { }
    void Update() { }
}
```

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1364841598202019860)
> Source: **Overweight Unicorn** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1367218162700914730)

If your class needs to implement Unity interfaces (like the UI pointer handlers), use
`[RegisterTypeInIl2CppWithInterfaces]` instead - see [Unity Event System](/il2cpp/unity-event-system/) for
the details and the caveats.

## Casting IL2CPP objects with `TryCast` and `Cast`

You cannot use a plain C# cast to downcast an interop object. Use `TryCast<T>()`, which returns `null` on
failure (like `as`), or `Cast<T>()`, which throws if the object is not that type. This comes up constantly
when the game hands you a base type and you need the concrete one:

```csharp
var productItemInstance = itemInstance.TryCast<ProductItemInstance>();
if (productItemInstance == null)
    return;

var product = productItemInstance.Definition.TryCast<ProductDefinition>();
```

> Source: **Peron** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1366888883744411718)

When you only have a raw `IntPtr` to a native object (for example inside a low-level patch), you can wrap
and cast it in one step:

```csharp
var writer = new Il2CppObjectBase(writerPtr).Cast<PooledWriter>();
```

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1363936391393841293)
