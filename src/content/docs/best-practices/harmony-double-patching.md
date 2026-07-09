---
title: Avoiding Harmony Double-Patching
description: Stop MelonLoader and your own code from applying the same Harmony patches twice with the HarmonyDontPatchAll assembly attribute.
sidebar:
  order: 2
---

MelonLoader automatically calls `PatchAll()` on your mod's Harmony instance when it loads your mod. That
is convenient, but it means every `[HarmonyPatch]` in your assembly is already applied for you. If you
then call `PatchAll()` yourself - for example in `OnInitializeMelon` / `OnApplicationStart` - each patch
gets applied a second time, and your prefixes and postfixes run twice.

## The fix

If you want to control patching yourself (a custom Harmony ID, specific timing, or patching a subset),
tell MelonLoader to skip its automatic pass by adding this assembly attribute:

```csharp
[assembly: HarmonyDontPatchAll]
```

With that in place MelonLoader will no longer auto-patch your assembly, so you are free to call
`PatchAll()` exactly once yourself without double-applying anything.

> Source: **coolpaca** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1358577757730377808)

## Which approach to pick

- **Let MelonLoader do it (default):** do nothing. Do not call `PatchAll()` yourself - MelonLoader
  already did. This is the simplest option for most mods.
- **Patch it yourself:** add `[assembly: HarmonyDontPatchAll]` and call `PatchAll()` once in your init
  method. Use this when you need control over the Harmony ID or the moment patching happens.

The one combination to avoid is calling `PatchAll()` yourself *without* the attribute - that is the
double-patch case.
