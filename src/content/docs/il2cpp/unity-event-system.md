---
title: Unity Event System
description: Handling UI pointer and drag events on IL2CPP, where the event interfaces you would normally implement have been compiled into concrete classes.
sidebar:
  order: 4
---

In most Unity UI tutorials you handle pointer and drag events by implementing interfaces like
`IPointerClickHandler`, `IBeginDragHandler` or `IPointerEnterHandler` on your `MonoBehaviour`. On IL2CPP
those interfaces have been compiled into concrete classes, so implementing several of them at once fails
with `Cannot have multiple base classes`. This page shows both ways to handle events, and which to reach
for.

## The reliable way: `EventTrigger` in `Awake`

Skip the interfaces entirely. Add an `EventTrigger` component and register your callbacks as entries. This
works consistently on IL2CPP. The class still has to be registered (`[RegisterTypeInIl2Cpp]` plus the
`IntPtr` constructor), and the callbacks are method groups so they need the `UnityAction<BaseEventData>`
cast covered in [Delegates and Method Groups](/il2cpp/delegates-and-method-groups/):

```csharp
// Required because we inherit from an Il2Cpp-compiled class (MonoBehaviour).
[RegisterTypeInIl2Cpp]
public class DraggableItem : MonoBehaviour
{
    // The IntPtr constructor is required by the RegisterTypeInIl2Cpp attribute
    public DraggableItem(IntPtr ptr) : base(ptr) { }

    private void Awake()
    {
        EnsureEventTrigger();
    }

    private void EnsureEventTrigger()
    {
        EventTrigger trigger = gameObject.GetComponent<EventTrigger>();
        if (trigger == null)
            trigger = gameObject.AddComponent<EventTrigger>();

        // Use an Il2CppSystem list for the triggers collection
        trigger.triggers = new Il2CppSystem.Collections.Generic.List<EventTrigger.Entry>();

        // Cast the method group to a UnityAction
        AddTrigger(trigger, EventTriggerType.BeginDrag, (UnityAction<BaseEventData>)OnBeginDrag);
    }

    private void AddTrigger(EventTrigger trigger, EventTriggerType type, UnityAction<BaseEventData> action)
    {
        var entry = new EventTrigger.Entry { eventID = type };
        entry.callback.AddListener(action);
        trigger.triggers.Add(entry);
    }

    // The compiled code hands you BaseEventData, not PointerEventData directly
    public void OnBeginDrag(BaseEventData rawEventData)
    {
        if (rawEventData.TryCast<PointerEventData>() is PointerEventData eventData)
        {
            MelonLogger.Msg("Begin Drag");
        }
    }
}
```

> Source: **Overweight Unicorn** - [original message](https://discord.com/channels/1349221936470687764/1379548495324774570/1379548528350859318)

Note the last method: the callback delivers a `BaseEventData`, so `TryCast<PointerEventData>()` to reach the
pointer-specific data (position, button, and so on).

## The attribute way: `RegisterTypeInIl2CppWithInterfaces`

MelonLoader offers `[RegisterTypeInIl2CppWithInterfaces]` to inject a class that does implement the event
interfaces. When it works, you write the handler methods as you normally would:

```csharp
[RegisterTypeInIl2CppWithInterfaces(true, new Type[] {
    typeof(IPointerEnterHandler), typeof(IPointerExitHandler), typeof(IPointerClickHandler) })]
public class TabButton : MonoBehaviour
{
    // Still required so IL2CPP can wrap instances
    public TabButton(IntPtr ptr) : base(ptr) { }

    public TabController controller;

    public void OnPointerClick(PointerEventData eventData) => controller.OnTabSelected(this);
    public void OnPointerEnter(PointerEventData eventData) => controller.OnTabEnter(this);
    public void OnPointerExit(PointerEventData eventData) => controller.OnTabExit(this);
}
```

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1364841598202019860)
> Source: **Overweight Unicorn** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1364842477814546442)
> Source: **Overweight Unicorn** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1365030448765468702)

:::caution
`[RegisterTypeInIl2CppWithInterfaces]` does not reliably work in every case, and getting it wrong shows up
as errors like `The type initializer for 'MethodInfoStoreGeneric_AddComponent...' threw an exception`. If
you hit that, fall back to the `EventTrigger` approach above, which behaves consistently. The BepInEx
Il2CppInterop docs on [implementing interfaces](https://github.com/BepInEx/Il2CppInterop/blob/master/Documentation/Implementing-Interfaces.md)
have more background.
:::

> Source: **Overweight Unicorn** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1364845597718351953)
> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1364874784814534766)
