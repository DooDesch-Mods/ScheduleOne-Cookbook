---
title: Tracking Game Updates
description: How the community tracks what changes between Schedule I versions - version diffs, CodeArchiver, and RefGen.
sidebar:
  order: 4
---

Schedule I updates regularly, and updates rename or remove the classes and methods your mod depends on.
Rather than rediscovering every break by hand, the community maintains tooling that diffs the game's
code between versions so you can see exactly what moved.

## Version-to-version diffs

When a big update lands, a class/method diff between the old and new version is the fastest way to find
what your mod needs to change. One such diff covers **0.3.6f6 to 0.4.0**, published as a `diff.json`:

- [S1DataMining/diff.json](https://github.com/GuysWeForgotDre/S1DataMining/blob/main/diff.json)

:::caution
In that particular diff the arguments were entered backwards, so the `Added` and `Removed` labels are
reversed - read them the other way around.
:::

> Source: **OnlyMurdersSometimes** - [original message](https://discord.com/channels/1349221936470687764/1405691892548763678/1405691892548763678)

## CodeArchiver - automated change tracker

[CodeArchiver](https://github.com/k073l/s1-codearchiver/) tracks game code changes across branches
automatically. It switches between branches (alternate / alternate-beta) and captures **stripped**
code - method implementations removed, signatures kept - so you can see what changed in an update as a
clean Git diff. Self-deployment instructions are in the repo README. This is the go-to when you want to
answer "what actually changed in this patch" for yourself.

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1465464417821921568/1465464417821921568)

## RefGen - reference assemblies as NuGet packages

[RefGen](https://github.com/k073l/RefGen) automates building **reference-assembly NuGet packages** for
the game. It checks for updates, downloads the requested files, and runs post-processing
(cpp2il + Il2CppInterop for IL2CPP branches, optional publicizing for Mono, plus reference-assembly
generation), then produces a `.nupkg` you can reference directly. Instead of a long list of reference
hint-paths for both branches, you reference a package and pin a version - and building against an older
game version is just a version bump:

```xml
<ItemGroup>
  <PackageReference Include="HarmonyX" Version="2.10.2" />
  <PackageReference Include="LavaGang.MelonLoader" Version="0.7.2" />
</ItemGroup>
<ItemGroup Label="IL2CPP-Refs" Condition="'$(IsMono)' != 'true'">
  <PackageReference Include="RefGen.Schedule-I.Il2Cpp" Version="0.4.4-f8" />
  <PackageReference Include="Il2CppInterop.Common" Version="1.5.1" />
  <PackageReference Include="Il2CppInterop.Runtime" Version="1.5.1" />
</ItemGroup>
<ItemGroup Label="Mono-Refs" Condition="'$(IsMono)' == 'true'">
  <PackageReference Include="RefGen.Schedule-I.Mono" Version="0.4.4-f8" />
</ItemGroup>
```

It can also publish the packages to one or more NuGet feeds, which works well in CI. There is no public
NuGet feed for these - they are just reference assemblies, so you self-host (a local feed plus GitHub
Packages is a common setup).

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1465464417821921568/1490830379509350483)

The CodeArchiver tool is also covered from a tooling angle in
[CodeArchiver](/tooling/code-archiver/).
