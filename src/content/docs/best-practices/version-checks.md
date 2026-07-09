---
title: Checking the Game / Loader Version
description: Detect a known-bad MelonLoader version at startup and warn the user loudly in the console instead of failing silently.
sidebar:
  order: 5
---

Some MelonLoader versions are known to cause problems with Schedule I mods. Rather than let a user sit
with mysterious crashes, you can detect the loader version at startup and print a loud, unmissable
warning telling them to switch to a known-good build.

:::caution
This helper hardcodes MelonLoader **0.7.1** as the problematic version and recommends **0.7.0** or
**0.7.2-nightly**. Those specific versions are a point-in-time recommendation - update the constants at
the top of the class as the ecosystem moves on, and treat the version numbers as an example of the
technique rather than a permanent list.
:::

## Wiring it up

Add a new `.cs` file to your project with the `VersionChecker` code below, then call it once from your
mod's startup:

```csharp
// in OnApplicationStart()
VersionChecker.VersionChecker.CheckMelonLoaderVersion();
```

## The full helper

```csharp
using MelonLoader;
using System;
using System.Reflection;
using System.Text;

namespace VersionChecker
{
    public static class VersionChecker
    {
        private const string PROBLEMATIC_VERSION = "0.7.1.0";
        private const string RECOMMENDED_VERSION_1 = "0.7.0";
        private const string RECOMMENDED_VERSION_2 = "0.7.2-nightly";

        public static void CheckMelonLoaderVersion()
        {
            try
            {
                string melonVersion = GetMelonLoaderVersion();

                if (string.IsNullOrEmpty(melonVersion))
                {
                    MelonLogger.Warning("[VersionChecker] Could not determine MelonLoader version!");
                    return;
                }

                MelonLogger.Msg("========================================");
                MelonLogger.Msg("[VersionChecker] MelonLoader Version Detected: " + melonVersion);
                MelonLogger.Msg("========================================");

                if (melonVersion == PROBLEMATIC_VERSION)
                {
                    ShowBigWarning(melonVersion);
                }
                else if (IsVersionCloseToProblematic(melonVersion))
                {
                    MelonLogger.Warning("[VersionChecker] Warning: You are using a version very close to " + PROBLEMATIC_VERSION);
                    MelonLogger.Warning("[VersionChecker] It is recommended to use " + RECOMMENDED_VERSION_1 + " or " + RECOMMENDED_VERSION_2);
                }
                else
                {
                    MelonLogger.Msg("[VersionChecker] Your MelonLoader version appears to be compatible!");
                }
            }
            catch (Exception ex)
            {
                MelonLogger.Warning("[VersionChecker] Version check failed: " + ex.Message);
            }
        }

        private static string GetMelonLoaderVersion()
        {
            try
            {
                Assembly melonAssembly = Assembly.GetExecutingAssembly();
                string assemblyName = melonAssembly.FullName;

                Type melonType = Type.GetType("MelonLoader.MelonMod, MelonLoader");
                if (melonType != null)
                {
                    Assembly melonLoaderAssembly = melonType.Assembly;
                    Version assemblyVersion = melonLoaderAssembly.GetName().Version;

                    if (assemblyVersion != null)
                    {
                        return assemblyVersion.ToString();
                    }
                }

                foreach (Assembly assembly in AppDomain.CurrentDomain.GetAssemblies())
                {
                    string name = assembly.GetName().Name;
                    if (name != null && (name.Equals("MelonLoader") || name.Equals("MelonLoader.Core")))
                    {
                        Version v = assembly.GetName().Version;
                        if (v != null)
                        {
                            return v.ToString();
                        }
                    }
                }

                return null;
            }
            catch
            {
                return null;
            }
        }

        private static bool IsVersionCloseToProblematic(string version)
        {
            try
            {
                if (version.StartsWith("0.7.1"))
                {

                    if (version == "0.7.1" || version == "0.7.1.0")
                    {
                        return false; 
                    }
                    return true; 
                }
                return false;
            }
            catch
            {
                return false;
            }
        }

        private static void ShowBigWarning(string detectedVersion)
        {
            StringBuilder warning = new StringBuilder();

            warning.AppendLine("");
            warning.AppendLine("╔════════════════════════════════════════════════════════════════════════╗");
            warning.AppendLine("║                                                                        ║");
            warning.AppendLine("║                    !!! URGENT WARNING !!!                              ║");
            warning.AppendLine("║                                                                        ║");
            warning.AppendLine("║           YOU ARE USING MELONLOADER VERSION " + detectedVersion.PadRight(8) + "                  ║");
            warning.AppendLine("║                                                                        ║");
            warning.AppendLine("║  This version is KNOWN TO HAVE CRITICAL ISSUES and may cause:        ║");
            warning.AppendLine("║                                                                        ║");
            warning.AppendLine("║    - Game crashes and unexpected behavior                             ║");
            warning.AppendLine("║    - Mod incompatibility and loading failures                          ║");
            warning.AppendLine("║    - Performance issues and memory leaks                               ║");
            warning.AppendLine("║    - Random errors and instability                                     ║");
            warning.AppendLine("║                                                                        ║");
            warning.AppendLine("║  PLEASE UPDATE IMMEDIATELY to one of these recommended versions:       ║");
            warning.AppendLine("║                                                                        ║");
            warning.AppendLine("║    ► " + RECOMMENDED_VERSION_1.PadRight(20) + " (Stable Release)                          ║");
            warning.AppendLine("║    ► " + RECOMMENDED_VERSION_2.PadRight(20) + " (Latest Nightly)                          ║");
            warning.AppendLine("║                                                                        ║");
            warning.AppendLine("║  Download from: https://melonwiki.xyz/#/?id=automated-installation      ║");
            warning.AppendLine("║                                                                        ║");
            warning.AppendLine("║      ║");
            warning.AppendLine("║                                                                        ║");
            warning.AppendLine("╚════════════════════════════════════════════════════════════════════════╝");
            warning.AppendLine("");

            for (int i = 0; i < 3; i++)
            {
                MelonLogger.Error(warning.ToString());
            }

            MelonLogger.Error("[VersionChecker] DETECTED PROBLEMATIC MELONLOADER VERSION: " + detectedVersion);
            MelonLogger.Error("[VersionChecker] PLEASE UPDATE TO " + RECOMMENDED_VERSION_1 + " OR " + RECOMMENDED_VERSION_2);
            MelonLogger.Error("[VersionChecker] Download: https://github.com/LavaGang/MelonLoader/releases");
        }
    }
}
```

The helper reads the loaded MelonLoader assembly version via reflection, so it works without a compile
-time dependency on a specific loader build. Swap the three version constants for whatever the current
known-good / known-bad set is.

> Source: **Estonia** - [original message](https://discord.com/channels/1349221936470687764/1354830847659737122/1454791538948309137)
