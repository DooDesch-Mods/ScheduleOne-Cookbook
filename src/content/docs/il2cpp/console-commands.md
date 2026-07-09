---
title: Console Commands
description: Registering custom in-game console commands on IL2CPP, and the workaround for the abstract Execute method not being overridable.
sidebar:
  order: 5
---

Adding a custom command to the in-game developer console means subclassing the game's `ConsoleCommand`
type, registering it, and - on IL2CPP - working around the fact that its `Execute` method is abstract and
[cannot be overridden the normal way](/il2cpp/patching/#overriding-native-virtual-methods). This page walks
through the whole thing.

## Defining and registering a command

Your command derives from `ConsoleCommand`, provides the two IL2CPP constructors, and overrides the word,
description, example and `Execute`. On the IL2CPP branch this type is `Il2CppScheduleOne.Console.ConsoleCommand`
(on Mono it is `ScheduleOne.Console.ConsoleCommand`):

```csharp
[RegisterTypeInIl2Cpp]
public class TestCommand : Il2CppScheduleOne.Console.ConsoleCommand
{
    public TestCommand(IntPtr ptr) : base(ptr) { }

    public TestCommand() : base(ClassInjector.DerivedConstructorPointer<TestCommand>())
    {
        ClassInjector.DerivedConstructorBody(this);
    }

    public override string CommandWord => "testcommand";
    public override string CommandDescription => "Prints a string to test this command";
    public override string ExampleUsage => "testcommand";

    public override void Execute(Il2CppSystem.Collections.Generic.List<string> args)
    {
        Il2CppScheduleOne.Console.Log("Test console command called");
    }
}
```

Register it by adding the instance to **both** of the console's stores: the `Commands` list (which drives
the in-game help / "view commands" screen) and the `commands` dictionary (which is what actually looks the
command up when the player runs it):

```csharp
var cc = new TestCommand();
Il2CppScheduleOne.Console.Commands.Add(cc);
Il2CppScheduleOne.Console.commands.Add("testcommand", cc);
```

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1367119818586853458)
> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1380614443112857700)

:::tip[Register after the game console exists]
Register one frame after the `Main` scene has loaded, otherwise the console's stores are not ready. A simple
way is a one-frame `WaitLoader` `MonoBehaviour` you spawn from `SceneManager.sceneLoaded` when
`scene.name == "Main"`, then run your registration from its second `Update`.
:::

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1380595169228754975)

## When `Execute` fails silently

Because `ConsoleCommand.Execute` is abstract and IL2CPP does not route virtual calls to your managed
override, the command can register and appear in the help list but do nothing when run - the game logs
`Il2CppInterop.Runtime.Il2CppException: System.EntryPointNotFoundException: Attempting to call abstract
method 'ScheduleOne.Console+ConsoleCommand::Execute'` to `Player.log` (not the MelonLoader console). The fix
is to Harmony-prefix `ConsoleCommand.Execute` and call your instance's `Execute` directly, which forces the
managed body to run:

```csharp
#if !MONO
using HarmonyLib;
using Console = Il2CppScheduleOne.Console;
using List = Il2CppSystem.Collections.Generic.List<string>;

[HarmonyPatch(typeof(Console.ConsoleCommand), "Execute")]
public static class Il2CppConsolePatch
{
    public static bool Prefix(Console.ConsoleCommand __instance, List args)
    {
        // Call directly; IL2CPP gets confused by the virtual/abstract method
        __instance.Execute(args);
        return false;
    }
}
#endif
```

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1380217118775312404)

:::caution[This is version-sensitive]
Whether the plain override works depends on the build. Some game versions run the registered command fine
with no patch, while on other builds (notably a beta) overriding the abstract `Execute` throws and only the
Harmony-prefix approach above works reliably. If your command registers but does not run, add the prefix.
:::

> Source: **Olipro** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1380615248515694692)

## Alternative: patch `SubmitCommand`

Instead of registering a `ConsoleCommand` at all, you can Harmony-patch `Console.SubmitCommand` and dispatch
on the incoming text yourself. Patch both the single-string and the `List<string>` overloads to cover single
and multi-argument commands:

```csharp
[HarmonyPrefix]
[HarmonyPatch(typeof(Il2CppScheduleOne.Console), "SubmitCommand",
    typeof(Il2CppSystem.Collections.Generic.List<string>))]
public static bool Prefix(Il2CppSystem.Collections.Generic.List<string> args)
{
    // Inspect args[0], run your command, return false to swallow it
    return true;
}
```

This does not add your command to the in-game help list, but it avoids the abstract-method problem
entirely.

> Source: **hiemdallh** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1380564753017081926)
