---
title: Packaging and Tagging
description: Upload a Schedule I mod to Thunderstore, understand where Nexus fits, and tag your package mono or IL2CPP for the correct game branch.
sidebar:
  order: 1
---

Getting a mod to players means packaging it into a zip and uploading it to a distribution platform. The
two the community uses are **Thunderstore** (the primary target, and what the mod managers pull from)
and **Nexus Mods**. Whichever you use, the single most important thing to get right is the branch tag.

## Uploading to Thunderstore

1. Package your mod according to the official docs (links below).
2. Log into Thunderstore.
3. Go to the upload page.
4. Drag and drop or select your zip with the "Choose or drag file here" button.
5. Select a team. If you do not have one yet, create it at
   [thunderstore.io/settings/teams](https://thunderstore.io/settings/teams/).
6. Select **Schedule I** as the community.
7. Add categories.
8. Toggle NSFW if the content is not safe for work.
9. Press submit.

Your package will appear in r2modman, TSMM and Gale in roughly 15 to 120 minutes - the delay varies
because of caches in the Thunderstore API CDNs.

The Schedule I package-creation page and its official packaging docs live here:

- [thunderstore.io/c/schedule-i/create](https://thunderstore.io/c/schedule-i/create/)
- [thunderstore.io/c/schedule-i/create/docs](https://thunderstore.io/c/schedule-i/create/docs/)

> Source: **coolpaca** - [original message](https://discord.com/channels/1349221936470687764/1357080903834144788/1357102203776536647)
> Source: **coolpaca** - [original message](https://discord.com/channels/1349221936470687764/1357080903834144788/1357102850353795283)

## Tag it mono or IL2CPP

Make sure your mod is tagged for the branch you developed it on. Schedule I has two scripting backends,
and a mod built for one will not run on the other, so the tag is how users (and mod managers) know which
build they are installing:

- Built on the **alternate-beta** branch (Mono) -> tag it **mono**.
- Built on the **main** branch (IL2CPP) -> tag it **IL2CPP**.

This is the counterpart to declaring your compatible domain in code - see
[Handling Incompatible Branches Gracefully](/best-practices/branch-compatibility/) so a wrong-branch
install fails cleanly instead of crashing.

> Source: **coolpaca** - [original message](https://discord.com/channels/1349221936470687764/1357080903834144788/1357426871192784969)

## Nexus Mods

Nexus Mods is the other common home for Schedule I mods, and several tools and mods are distributed there
(for example the Schedule I Mod Manager). Nexus does not use Thunderstore's tag system, so make the
branch explicit in the file names or description instead - many authors ship separate downloads or bake
`mono` / `IL2CPP` right into the file name so players grab the right one. The same rule applies: never
leave it ambiguous which backend a download targets.
