---
title: Best Practices
description: Cross-cutting conventions the Schedule I modding community follows - embedding assets, patching cleanly, compatibility and live config.
sidebar:
  order: 0
---

Short, opinionated conventions that make a mod more robust and friendlier to end users. None of these
are hard requirements to get a mod loading, but every one of them removes a class of bug reports and
awkward install steps that the community has run into repeatedly.

## Pages in this section

- [Embedding AssetBundles](/best-practices/embedding-assetbundles/) - ship your bundles inside the DLL
  so users never have to copy them to the right folder.
- [Avoiding Harmony Double-Patching](/best-practices/harmony-double-patching/) - stop MelonLoader and
  your own code from applying the same patches twice.
- [Referencing Game Assemblies with Wildcards](/best-practices/csproj-assembly-references/) - reference
  the whole `Managed` folder in one `.csproj` line instead of listing DLLs by hand.
- [Handling Incompatible Branches Gracefully](/best-practices/branch-compatibility/) - tell MelonLoader
  which backend your mod targets so it declines cleanly instead of crashing with "Could not resolve type".
- [Checking the Game / Loader Version](/best-practices/version-checks/) - warn users on a known-bad
  MelonLoader version instead of failing silently.
- [Live-Apply Config Changes](/best-practices/live-apply-config/) - react to preference changes at
  runtime so edits made in-game take effect immediately.

Curated from the community `best-practices` and `code-snippets` channels.
