---
title: Referencing Game Assemblies with Wildcards
description: Reference the whole Managed folder in one csproj line instead of listing every game DLL by hand, with optional publicizing.
sidebar:
  order: 3
---

Listing every game DLL you depend on by hand in your `.csproj` is tedious and breaks the moment the game
adds or renames an assembly. Instead you can reference the whole `Managed` folder with a wildcard and
exclude only the runtime assemblies you do not want.

## The wildcard reference

Point the `Include` at your game's `Managed` folder and exclude the .NET runtime DLLs (`System*`,
`mscorlib`, `netstandard`) so they do not clash with your project's own framework references:

```xml
<ItemGroup>
    <Reference Include="<schedule 1 managed folder>\*.dll"
               Exclude="<schedule 1 managed folder>\System*.dll;<schedule 1 managed folder>\mscorlib.dll;<schedule 1 managed folder>\netstandard.dll"
               Private="false"
               Publicize="True" /> <!-- Only use Publicize="true" if you have BepInEx.AssemblyPublicizer.MSBuild package installed -->
</ItemGroup>
```

- `Private="false"` keeps these assemblies out of your build output - they already ship with the game,
  so you must not copy them next to your DLL.
- `Publicize="True"` exposes private and internal members so you can access them without reflection. It
  only works if you add the publicizer package below.

## Enabling publicize

`Publicize="True"` needs the `BepInEx.AssemblyPublicizer.MSBuild` package. Add it as a build-only
reference:

```xml
<ItemGroup>
    <PackageReference Include="BepInEx.AssemblyPublicizer.MSBuild" Version="0.5.0-beta.1" PrivateAssets="all" />
</ItemGroup>
```

Replace `<schedule 1 managed folder>` with the real path to your install's managed assemblies, for
example `...\Schedule I\Schedule I_Data\Managed`. If you would rather not hardcode a machine-specific
path, define it as an MSBuild property (or import a local `paths` file) and reuse it in the `Include`
and `Exclude`.

> Source: **MaxtorCoder** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1360911653960679617)
