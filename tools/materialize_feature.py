from pathlib import Path
import json, shutil, zipfile

root=Path(__file__).resolve().parents[1]
archive=root/"竹间灵石系统-满意版备份-2026-09-04.zip"
app=root/"竹间灵石系统"
if app.exists():
    shutil.rmtree(app)
with zipfile.ZipFile(archive) as z:
    for info in z.infolist():
        try:
            name=info.filename.encode("cp437").decode("gbk")
        except (UnicodeEncodeError,UnicodeDecodeError):
            name=info.filename
        parts=name.split("/",1)
        if len(parts)<2 or not parts[1]:
            continue
        target=app/parts[1]
        if info.is_dir():
            target.mkdir(parents=True,exist_ok=True)
        else:
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(z.read(info))
shutil.copytree(root/"feature-overlay",app,dirs_exist_ok=True)

runtime=app/"core/runtime.js"
text=runtime.read_text("utf-8")
old="    apiFor(manifest){const owner=manifest.id;return Object.freeze({coreVersion:L.CORE_VERSION,manifest,events:L.events,services:L.services,registries:L.registries,shell:L.shell,register:(kind,id,value)=>{const r=L.registries[kind];if(!r)throw new Error(`Unknown registry __DOLLAR__{kind}`);return r.register(id,value,owner)},registerSlot:(slot,value)=>L.registries.slots.register(slot,value,owner),on:(event,handler)=>L.events.on(event,handler,owner),getState:()=>L.services.storage?.getState(),save:()=>L.services.storage?.save(),toast:message=>L.shell?.toast(message),openModal:spec=>L.shell?.openModal(spec),closeModal:()=>L.shell?.closeModal(),refresh:()=>L.shell?.render()})}".replace("__DOLLAR__","$")
new="    apiFor(manifest){const owner=manifest.id;const ownData=defaults=>{const state=L.services.storage?.getState();if(!state)return null;state.extensionData=state.extensionData||{};if(!state.extensionData[owner])state.extensionData[owner]=JSON.parse(JSON.stringify(defaults||{}));return state.extensionData[owner]};return Object.freeze({coreVersion:L.CORE_VERSION,manifest,events:L.events,services:L.services,registries:L.registries,shell:L.shell,register:(kind,id,value)=>{const r=L.registries[kind];if(!r)throw new Error(`Unknown registry __DOLLAR__{kind}`);return r.register(id,value,owner)},registerSlot:(slot,value)=>L.registries.slots.register(slot,value,owner),on:(event,handler)=>L.events.on(event,handler,owner),data:Object.freeze({get:ownData,save:()=>L.services.storage?.save()}),getState:()=>L.services.storage?.getState(),save:()=>L.services.storage?.save(),toast:message=>L.shell?.toast(message),openModal:spec=>L.shell?.openModal(spec),closeModal:()=>L.shell?.closeModal(),refresh:()=>L.shell?.render()})}".replace("__DOLLAR__","$")
if old not in text:
    raise SystemExit("runtime apiFor anchor missing")
runtime.write_text(text.replace(old,new),"utf-8")

storage=app/"core/storage.js"
text=storage.read_text("utf-8")
old="extensions:{disabled:[],installedData:[]}"
if old not in text:
    raise SystemExit("storage anchor missing")
storage.write_text(text.replace(old,"extensions:{disabled:[],installedData:[],migrationVersions:{}}"),"utf-8")

boot=app/"core/boot.js"
text=boot.read_text("utf-8")
old="    const state=L.services.storage.getState();\n"
insert="""    const state=L.services.storage.getState();
    state.extensions.migrationVersions=state.extensions.migrationVersions||{};
    for(const migration of L.registries.migrations.list().sort((a,b)=>(a.order||0)-(b.order||0))){
      try{
        const current=Number(state.extensions.migrationVersions[migration.__owner]||0),target=Number(migration.targetVersion||1);
        if(current<target){migration.migrate(state.extensionData[migration.__owner]||(state.extensionData[migration.__owner]={}),{state,services:L.services,fromVersion:current,toVersion:target});state.extensions.migrationVersions[migration.__owner]=target}
      }catch(error){L.errors.push({extension:migration.__owner,stage:'migration',message:error.message,time:Date.now()})}
    }
"""
if old not in text:
    raise SystemExit("boot anchor missing")
boot.write_text(text.replace(old,insert,1),"utf-8")

arch=app/"docs/ARCHITECTURE.md"
arch.write_text(arch.read_text("utf-8")+"\n\n"+(root/"feature-overlay-docs/ARCHITECTURE-ADDENDUM.md").read_text("utf-8"),"utf-8")
guide=app/"docs/AI-GUIDE.md"
guide.write_text(guide.read_text("utf-8")+"\n\n"+(root/"feature-overlay-docs/AI-GUIDE-ADDENDUM.md").read_text("utf-8"),"utf-8")

lines=["// GENERATED FILE. Run tools/build-registry.ps1 after adding or removing an extension.","(function(){"]
for manifest_file in sorted((app/"extensions").rglob("manifest.json")):
    manifest=json.loads(manifest_file.read_text("utf-8"))
    for required in ("id","name","version","type","entry","compatibleCoreVersion"):
        if not manifest.get(required):
            raise SystemExit(f"{manifest_file} missing {required}")
    entry=manifest_file.parent/manifest["entry"]
    if not entry.exists():
        raise SystemExit(f"missing entry for {manifest['id']}")
    rel=entry.relative_to(app).as_posix()
    lines.append("Lingshi.registerManifest("+json.dumps(manifest,ensure_ascii=False,separators=(",",":"))+");")
    lines.append("document.write('<script src=\"./"+rel+"\"><\\/script>');")
lines.extend(["})();",""])
(app/"extensions/registry.generated.js").write_text("\n".join(lines),"utf-8")
print(f"Materialized {app} with {len(list((app/'extensions').rglob('manifest.json')))} extensions")
