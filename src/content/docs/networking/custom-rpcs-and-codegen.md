---
title: Custom RPCs and Code Generation
description: Set up the FishNet V3 code-generation NuGet package for Mono mods, register generated serializers under a mod loader, and understand the IL2CPP situation.
sidebar:
  order: 2
---

FishNet generates a lot of hidden code for you: the serializers ("readers" and "writers") for RPC
arguments, and the plumbing that wires up `ServerRpc`/`ObserversRpc`/`TargetRpc` methods. Inside a
normal Unity project this code generation runs automatically. When you build a **mod** outside the
editor it does not, so custom RPCs and other FishNet features silently fail to work. The fix on the
**Mono** branch is a NuGet package that runs FishNet V3's code generator as part of your build.

## The NuGet package (Mono only)

Add a `PackageReference` to your mod's `.csproj`:

```xml
<PackageReference Include="FishNetV3.CodeGenerator.MSBuild" Version="1.0.0-beta.11" PrivateAssets="all" ExcludeAssets="runtime" />
```

- Package: [`FishNetV3.CodeGenerator.MSBuild`](https://www.nuget.org/packages/FishNetV3.CodeGenerator.MSBuild)
- It runs the FishNet code generator automatically during build - no extra tag or CLI call needed.
- Works with both **MelonLoader** and **BepInEx**.
- **Mono only.** It does not work on IL2CPP (see below).
- `PrivateAssets="all"` and `ExcludeAssets="runtime"` keep the generator out of your shipped output.

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1361590886529630320/1361590886529630320)
> Source: **MaxtorCoder** - [original message](https://discord.com/channels/1349221936470687764/1361590886529630320/1378628141563777094)

Check NuGet for the latest version - the package went through many beta releases as bugs were found and
fixed.

## Critical: register your generated serializers at mod init

This is the single most important thing to get right, and it is easy to miss because your code compiles
fine and only fails at runtime.

FishNet registers its generated readers and writers using Unity's `RuntimeInitializeOnLoadMethod`
attribute. **That attribute does not fire for assemblies loaded by a mod loader** (MelonLoader or
BepInEx). The result: your custom serializers never register, and networking that relies on them does
not fully work. It especially bites when you use a generated serializer *indirectly* - for example you
have a serializer for `YourClass` but pass a `YourClass[]` as an RPC parameter.

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1361590886529630320/1377638154873471097)

The workaround is to find and invoke those `InitializeOnce` methods yourself with reflection, once,
when your mod initializes:

```csharp
private void InitFishNet()
{
    // FishNet normally uses RuntimeInitializeOnLoadMethod to invoke these methods, but those do not get
    // invoked when using a mod loader. So we invoke them manually here.
    var types = Assembly.GetExecutingAssembly()
        .GetExportedTypes()
        .Where(t => t.Namespace == "FishNet.Serializing.Generated");

    foreach (var type in types)
    {
        MethodInfo method = type.GetMethod("InitializeOnce", BindingFlags.NonPublic | BindingFlags.Static);
        method.Invoke(null, []);
    }
}
```

Call `InitFishNet()` from your mod's startup (for example in `OnInitializeMelon` / your plugin's
`Load`). This is the workaround referenced from the package's install post.

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1361590886529630320/1377642382174060609)

## Build troubleshooting

### "Retarget assembly" popup during build

You may see a Visual Studio assembly-retarget prompt when the generator runs. Press **No** - the build
continues normally afterward.

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1361590886529630320/1361593036798169219)

### "Unknown error occurred while processing assembly file"

If the generator cannot resolve the assemblies it needs, point it at your game's `Managed` folder (where
`mscorlib.dll` and the game/Unity assemblies live) via a search-path item:

```xml
<ItemGroup>
    <FishNetCodeGenAssemblySearchPaths Include="C:\Path\To\Schedule I_Data\Managed" />
</ItemGroup>
```

> Source: **MaxtorCoder** - [original message](https://discord.com/channels/1349221936470687764/1361590886529630320/1362747671307227227)
> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1361590886529630320/1362748814737539204)

### Do not feed it stripped DLLs

Running code generation against stripped/publicized assemblies that are missing their real bodies causes
processing errors. Reference the actual game `Managed` assemblies for the generation step.

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1361590886529630320/1362374860155785369)

### Custom target ordering

If you need to run your own MSBuild step before generation, hook a target that runs before
`GenerateFishNetCode`. Note that generation happens before the assembly is copied to `bin`, so if you
need the generated DLL from a pre-copy step, grab it from the intermediate (`obj`/`lib`) output folder.

> Source: **Skippy** - [original message](https://discord.com/channels/1349221936470687764/1361590886529630320/1361592116920451102)

## IL2CPP: there is no code generator

The NuGet package above does not run on IL2CPP, and there is no drop-in equivalent. If you must drive
FishNet directly on IL2CPP (rather than falling back to the
[Steam lobby](/networking/steam-lobby-data-sync/)), you have to hand-build the pieces the generator
would normally produce. This path was pioneered on the modding Discord and reported as workable but
**unreliable** - treat it as advanced and expect to fight it.

:::caution
The IL2CPP FishNet approach below was reported to work in real multiplayer but not consistently
(serializers sometimes never fire on load, and some paths needed Harmony patches to stabilize). If you
just need to move small amounts of data, the Steam lobby route is far less painful.
:::

**Manual broadcasts.** Instead of generated RPCs, you can write broadcasts to the server or a client
directly through FishNet's `TransportManager`:

```csharp
private void BroadcastServer<T>(T msg)
{
    PooledWriter pooledWriter = WriterPool.Retrieve();
    var channel = Channel.Reliable;
    var writer = Util.FishNet.WriteBroadcast(NetworkManager, pooledWriter, msg, ref channel);
    var arraySegment = writer.GetArraySegment();
    TransportManager.SendToServer((byte)channel, arraySegment, true, DataOrderType.Default);
}

private void BroadcastClient<T>(T msg, NetworkConnection conn)
{
    PooledWriter pooledWriter = WriterPool.Retrieve();
    var channel = Channel.Reliable;
    var writer = Util.FishNet.WriteBroadcast(NetworkManager, pooledWriter, msg, ref channel);
    var arraySegment = writer.GetArraySegment();
    TransportManager.SendToClient((byte)channel, arraySegment, conn);
}
```

The reader side then reconstructs the object and pushes it onto a queue on your derived
`NetworkBehaviour`.

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1362262930967494686)

**Message types must be IL2CPP objects.** The `msg` you broadcast has to be a registered IL2CPP type:

```csharp
[RegisterTypeInIl2Cpp]
public class SendStatusMessage : Il2CppSystem.Object
{
    public unsafe SendStatusMessage(IntPtr ptr) : base(ptr) { }

    public SendStatusMessage() : base(ClassInjector.DerivedConstructorPointer<SendStatusMessage>())
    {
        ClassInjector.DerivedConstructorBody(this);
    }

    public Il2CppSystem.Guid PlantGuid;
    public int seedCount;
    public byte gender;
    public bool inspected;
}
```

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1362264265784037438)

**Initialize the internal tables yourself.** Under IL2CPP the internal dictionaries a `NetworkBehaviour`
relies on come up as garbage rather than empty, so your derived behaviour should initialize them in
`OnStartNetwork`:

```csharp
public override void OnStartNetwork()
{
    this._rpcLinks = new Il2CppSystem.Collections.Generic.Dictionary<uint, RpcLinkType>();
    this._syncVars = new Il2CppSystem.Collections.Generic.Dictionary<uint, SyncBase>();
    this._syncObjects = new Il2CppSystem.Collections.Generic.Dictionary<uint, SyncBase>();
    this._bufferedRpcs = new Il2CppSystem.Collections.Generic.Dictionary<uint, BufferedRpc>();
    this._serverRpcDelegates = new Il2CppSystem.Collections.Generic.Dictionary<uint, ServerRpcDelegate>();
    this._observersRpcDelegates = new Il2CppSystem.Collections.Generic.Dictionary<uint, ClientRpcDelegate>();
    this._targetRpcDelegates = new Il2CppSystem.Collections.Generic.Dictionary<uint, ClientRpcDelegate>();
    this._reconcileRpcDelegates = new Il2CppSystem.Collections.Generic.Dictionary<uint, ReconcileRpcDelegate>();
}
```

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1362296724579811399)

`SyncVar`s were eventually made to sync across the network this way, but only unreliably and, at the
time, only with Harmony patches that re-implemented `InitializeOnceSyncTypes`, `WriteDirtySyncTypes`,
and `OnSyncTypes` to skip the originals.

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1362653814125105202)

One more gotcha seen with IL2CPP FishNet: if the server spawns a `NetworkObject` before a client has
finished connecting, that client can hang on an infinite load. A crude mitigation was to delay the
spawn 10-15 seconds so pending clients get in first; new invites after the spawn still could not join.

> Source: **XmusJackson (cheger32)** - [original message](https://discord.com/channels/1349221936470687764/1359965746326929650/1361971083556946033)
