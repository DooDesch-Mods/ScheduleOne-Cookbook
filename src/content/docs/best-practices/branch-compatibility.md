---
title: Handling Incompatible Branches Gracefully
description: Declare which scripting backend your mod targets so MelonLoader declines it cleanly instead of crashing with "Could not resolve type".
sidebar:
  order: 4
---

Schedule I ships in two flavours: the main branch is **IL2CPP**, and the alternate-beta branch is
**Mono**. A mod built against one backend cannot run on the other. If a user installs an IL2CPP mod on
the Mono branch (or vice versa), the mod crashes at load with an ugly, confusing error like:

```
Could not resolve type with token 0100001c from typeref (expected class 'Il2CppScheduleOne....' in assembly 'Assembly-CSharp, Version=0.0.0.0,
```

You can do much better than that. Tell MelonLoader in advance which domain your mod is compatible with,
and it will refuse to load the mod with a clear, user-friendly message instead of throwing.

## Declare the compatible domain

Add the platform-domain attribute for the backend you built against:

```csharp
[assembly: MelonPlatformDomain(MelonPlatformDomainAttribute.CompatibleDomains.IL2CPP)]
```

When this mod lands on the wrong branch, MelonLoader now prints:

```
------------------------------
'Hardcore v1.0.0' is incompatible:
- Hardcore is only compatible with the following Domain:
    - IL2CPP
------------------------------
```

That, plus a missing-dependencies notice, is far friendlier than a raw `Could not resolve type` stack.

## Supporting both branches from one codebase

If you build both a Mono and an IL2CPP version using conditional compilation, wrap the attribute so each
build declares the right domain:

```csharp
#if MONO
[assembly: MelonPlatformDomain(MelonPlatformDomainAttribute.CompatibleDomains.MONO)]
#else
[assembly: MelonPlatformDomain(MelonPlatformDomainAttribute.CompatibleDomains.IL2CPP)]
#endif
```

This attribute pairs naturally with tagging your uploads correctly - see
[Packaging and Tagging](/publishing/packaging-and-tagging/) for the mono / IL2CPP tag rules on
Thunderstore. For a deeper walkthrough of maintaining both backends, the community docs cover
[supporting both branches](https://s1modding.github.io/docs/moddevs/il2cpp/#supporting-both-branches).

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1413523041123831849)
