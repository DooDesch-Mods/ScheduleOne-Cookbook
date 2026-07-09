---
title: Delegates and Method Groups
description: The fix for "Cannot convert method group to System.IntPtr", plus how to wire up UnityAction listeners, lambdas and game events on IL2CPP.
sidebar:
  order: 3
---

On IL2CPP you cannot hand a bare C# method to something that expects a native delegate. Try it and you get
errors like `cannot convert Method Group to UnityAction` or `Cannot convert method group to System.IntPtr`.
The interop layer needs the method wrapped into a delegate type it understands. This page consolidates the
recipes for doing that - for Unity listeners, lambdas, the game's own delegate types, and C# events.

> Source: **Overweight Unicorn** - [original message](https://discord.com/channels/1349221936470687764/1370482833872781363/1370482833872781363)
> Source: **Overweight Unicorn** - [original message](https://discord.com/channels/1349221936470687764/1374562168309289071/1374562168309289071)

## Method group to `UnityAction`

For a Unity `UnityEvent` listener (like `Button.onClick`), an explicit cast to `UnityAction` is usually
enough:

```csharp
button.onClick.AddListener((UnityAction)handleClick);

void handleClick()
{
    MelonLogger.Msg("OMG I've been clicked");
}
```

If the event passes a parameter, cast to the matching generic `UnityAction<T>`:

```csharp
inputField.onValueChanged.AddListener((UnityAction<string>)handleChanged);

void handleChanged(string value)
{
    MelonLogger.Msg($"You entered {value}");
}
```

> Source: **Overweight Unicorn** - [original message](https://discord.com/channels/1349221936470687764/1370482833872781363/1370482833872781363)
> Source: **Mini** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1361553856667844819)

If a direct cast still complains, wrapping the call in a tiny local method sidesteps it:

```csharp
void FuncThatCallsFunc() => handleClick();
filterButton.onClick.AddListener((UnityAction)FuncThatCallsFunc);
```

> Source: **Mini** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1361551111554601010)

## Lambdas and `DelegateSupport.ConvertDelegate`

For lambdas, or when a plain cast will not do, `Il2CppInterop.Runtime.DelegateSupport.ConvertDelegate<T>`
builds the delegate explicitly:

```csharp
UnityAction act = DelegateSupport.ConvertDelegate<UnityAction>(
    () => MelonLogger.Msg("Lambda test"));
```

The same call works for a `System.Action` you already hold, and for parameterised events:

```csharp
System.Action action = OnSomething;
UnityAction act = DelegateSupport.ConvertDelegate<UnityAction>(action);

route.Product.onItemChanged.AddListener(
    DelegateSupport.ConvertDelegate<UnityAction<ItemDefinition>>(OnProductItemChanged));
```

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1364656125084958790)
> Source: **ArcheNovalis** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1364660495730216970)

:::caution[Type the lambda parameters explicitly]
If you inline a lambda into `ConvertDelegate` and get `The delegate type could not be inferred`, spell out
the parameter type. This fails to infer:

```csharp
DelegateSupport.ConvertDelegate<UnityAction<ItemDefinition>>(item => Refresh(item))
```

This works:

```csharp
DelegateSupport.ConvertDelegate<UnityAction<ItemDefinition>>((ItemDefinition item) => Refresh(item))
```
:::

> Source: **ArcheNovalis** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1365718177304154184)

## Converting to a game delegate type

Some game APIs take one of the game's own delegate types rather than a `UnityAction`. `ConvertDelegate`
handles those too. For example, to close a UI popup when the player presses `Esc`, you register with
`GameInput.RegisterExitListener`, which wants a `GameInput.ExitDelegate` - passing your method directly
throws `Cannot convert method group to System.IntPtr`, so convert it first:

```csharp
// Your handler
public void Exit(ExitAction action)
{
    if (action.Used || !this.IsOpen) return;
    action.Used = true;
    this.OnClose();
}

// Convert the method group to the game's delegate type, then register it
Action<ExitAction> func = this.Exit;
var controlledDelegate = DelegateSupport.ConvertDelegate<GameInput.ExitDelegate>(func);
GameInput.RegisterExitListener(controlledDelegate, 4);
```

> Source: **Overweight Unicorn** - [original message](https://discord.com/channels/1349221936470687764/1370482833872781363/1370482879485968485)

## Subscribing to game C# events

The game exposes plain C# events (`System.Action`-style) too, like `TimeManager.onDayPass`. Wrap your
handler in a `new System.Action(...)` when subscribing so the interop layer gets a concrete delegate:

```csharp
using Il2CppScheduleOne.GameTime;

var timeManager = TimeManager.Instance;
timeManager.onDayPass += new System.Action(OnDayPass);

void OnDayPass()
{
    MelonLogger.Msg("A day passed");
}
```

> Source: **hiemdallh** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1381247236717023293)
