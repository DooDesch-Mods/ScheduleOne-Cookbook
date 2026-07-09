---
title: Automated Publishing with GitHub Actions
description: A GitHub Actions workflow that builds, packages and publishes your Schedule I mod to Thunderstore whenever you push a version tag.
sidebar:
  order: 2
---

Publishing by hand every release gets old fast. This workflow does it for you: push a `v*` tag (like
`v1.0.0`) and GitHub Actions builds your mod in Release, generates the Thunderstore `manifest.json`,
zips up the package, and uploads it to Thunderstore.

## How it works

- **Trigger:** any pushed tag starting with `v`.
- **Version:** taken straight from the tag (`v1.0.0` becomes `1.0.0`).
- **Manifest:** `manifest.json` is generated on the fly from the repo name and description, with
  `LavaGang-MelonLoader-0.7.0` as a dependency.
- **Build:** `dotnet build`/`dotnet publish` in Release.
- **Package:** the DLL, `README.md`, `icon.png` and `manifest.json` are zipped into a Thunderstore
  package.
- **Publish:** the [`MaxtorCoder/thunderstore-publish`](https://github.com/MaxtorCoder/thunderstore-publish)
  action uploads it, authenticated with a `TS_TOKEN` repository secret.

## Before you use it

- Add a `TS_TOKEN` secret (your Thunderstore service-account API token) in the repo settings.
- Make sure `README.md` and `icon.png` exist at the repo root - the package step copies both.
- Set `namespace` and `name` in the publish step to **your** Thunderstore team and package name (the
  example ships `MaxtorCoder` / `SaveUtility`).
- Adjust the `dotnet-version` and the `LavaGang-MelonLoader` dependency version to match your project.

## The workflow

Save this as `.github/workflows/publish.yml`:

```yaml
name: Publish .NET Project

on:
  push:
    tags:
      - 'v*'  # Triggers on tags starting with 'v' (e.g., v1.0.0)

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v3

      - name: Extract version from tag
        id: get_version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_ENV

      - name: Generate manifest.json
        run: |
          REPO_NAME="${{ github.event.repository.name }}"
          REPO_DESCRIPTION="${{ github.event.repository.description }}"
          VERSION="${{ env.VERSION }}"
          # Remove 'ScheduleOne' from REPO_NAME
          REPO_NAME="${REPO_NAME//ScheduleOne/}"
          cat <<EOF > manifest.json
          {
            "name": "${REPO_NAME// /_}",
            "version_number": "${VERSION}",
            "website_url": "https://github.com/${{ github.repository }}",
            "description": "${REPO_DESCRIPTION}",
            "dependencies": [
              "LavaGang-MelonLoader-0.7.0"
            ]
          }
          EOF
        shell: bash

      - name: Set up .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '6.0.x'  # Adjust to your project's .NET version

      - name: Restore dependencies
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore --configuration Release

      - name: Publish
        run: dotnet publish --no-build --configuration Release --output ./publish

      - name: Prepare Thunderstore Package
        run: |
          REPO_NAME="${{ github.event.repository.name }}"
          VERSION="${{ env.VERSION }}"
          PACKAGE_NAME="${REPO_NAME//ScheduleOne/}"  # Remove 'ScheduleOne' from REPO_NAME
          echo "PACKAGE_NAME=${PACKAGE_NAME}" >> $GITHUB_ENV
          
          mkdir -p ThunderstorePackage/
          cp manifest.json ThunderstorePackage/
          cp README.md ThunderstorePackage/
          cp icon.png ThunderstorePackage/
          cp ./publish/${REPO_NAME}.dll ThunderstorePackage/
          cd ThunderstorePackage
          
          zip -r ../${PACKAGE_NAME}-v${VERSION}.zip .
          readlink -f ../${PACKAGE_NAME}-v${VERSION}.zip
        shell: bash

      - name: Publish to Thunderstore
        id: publish-thunderstore
        uses: MaxtorCoder/thunderstore-publish@v1.0.2
        with:
          token: ${{ secrets.TS_TOKEN }}
          communities: 'schedule-i'
          namespace: 'MaxtorCoder'
          name: 'SaveUtility'
          description: '${{ github.event.repository.description }}'
          version: '${{ env.VERSION }}'
          file: '/home/runner/work/${{ github.event.repository.name }}/${{ github.event.repository.name }}/${{ env.PACKAGE_NAME }}-v${{ env.VERSION }}.zip'
          categories: mods
          deps: |
            "LavaGang-MelonLoader@0.7.0"

      - name: Output URL
        run: echo "Published Thunderstore package to ${{ steps.publish-thunderstore.outputs.url }}"
```

The `file:` path is an absolute path into the runner's workspace - if you rename the package or change
the repo layout, update that path to match the zip produced by the packaging step.

> Source: **Red** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1361080053525643274)
> Source: **MaxtorCoder** (original workflow author) - [reference](https://github.com/MaxtorCoder/ScheduleOneSaveUtility/blob/master/.github/workflows/publish.yml)
