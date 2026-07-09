---
title: CodeArchiver
description: An automated tool that tracks Schedule I code changes across branches and versions as Git diffs.
sidebar:
  order: 4
---

## CodeArchiver

[CodeArchiver](https://github.com/k073l/s1-codearchiver/) is an automated code tracker for Schedule I.
It switches between branches (alternate / alternate-beta) and captures the game's code as **stripped**
source - method implementations removed, signatures and structure kept - and commits it, so every game
update shows up as a clean Git diff. When you want to know exactly what changed in a patch (renamed
classes, removed methods, new fields), you read the diff instead of guessing.

Self-deployment instructions are in the repo README, so you can run your own archive.

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1465464417821921568/1465464417821921568)

## RefGen (companion)

The same author maintains [RefGen](https://github.com/k073l/RefGen), which turns game builds into
**reference-assembly NuGet packages** - it checks for updates, downloads files, runs post-processing
(cpp2il + Il2CppInterop for IL2CPP, optional publicizing for Mono), and outputs a `.nupkg` you reference
from your project. It can push to NuGet feeds for CI use.

> Source: **k073l** - [original message](https://discord.com/channels/1349221936470687764/1465464417821921568/1490830379509350483)

For how to actually use these when a game update breaks your mod, see
[Tracking Game Updates](/core-concepts/tracking-game-updates/), which shows the RefGen `PackageReference`
setup.
