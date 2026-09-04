(function(global){
  'use strict';
  const L=global.Lingshi=global.Lingshi||{};
  L.CORE_VERSION='1.0.0';
  L.escape=value=>String(value??'').replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':'&quot;'}[ch]));
  L.uid=(prefix='id')=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

  class EventBus{
    constructor(){this.listeners=new Map();this.history=[]}
    on(name,handler,owner='anonymous'){if(!this.listeners.has(name))this.listeners.set(name,[]);const item={handler,owner};this.listeners.get(name).push(item);return()=>this.off(name,handler)}
    off(name,handler){this.listeners.set(name,(this.listeners.get(name)||[]).filter(x=>x.handler!==handler))}
    emit(name,payload={}){this.history.push({name,payload,time:Date.now()});if(this.history.length>200)this.history.shift();for(const item of [...(this.listeners.get(name)||[]),...(this.listeners.get('*')||[])]){try{item.handler(payload,name)}catch(error){L.errors.push({extension:item.owner,stage:'event:'+name,message:error.message,time:Date.now()})}}}
  }

  class Registry{
    constructor(name){this.name=name;this.items=new Map()}
    register(id,value,owner){if(!id)throw new Error(`${this.name} registration requires id`);if(this.items.has(id))throw new Error(`${this.name}:${id} already registered`);this.items.set(id,{...value,id,__owner:owner});return this.items.get(id)}
    get(id){return this.items.get(id)}
    has(id){return this.items.has(id)}
    list(){return [...this.items.values()]}
  }
  class SlotRegistry{
    constructor(){this.slots=new Map()}
    register(slotId,value,owner){if(!this.slots.has(slotId))this.slots.set(slotId,[]);this.slots.get(slotId).push({...value,__owner:owner})}
    list(slotId){return (this.slots.get(slotId)||[]).slice().sort((a,b)=>(a.order||0)-(b.order||0))}
  }

  L.events=new EventBus();L.errors=[];L.extensionDefinitions=new Map();L.extensionManifests=[];
  L.registries={taskTypes:new Registry('taskType'),productTypes:new Registry('productType'),pages:new Registry('page'),statistics:new Registry('statistic'),settingsSections:new Registry('settingsSection'),themes:new Registry('theme'),systems:new Registry('system'),dataSeeds:new Registry('dataSeed'),migrations:new Registry('migration'),slots:new SlotRegistry()};
  L.services={};
  L.defineExtension=(id,factory)=>{if(L.extensionDefinitions.has(id))throw new Error(`Extension ${id} defined twice`);L.extensionDefinitions.set(id,factory)};
  L.registerManifest=manifest=>L.extensionManifests.push(manifest);

  function compatible(range,version){if(!range||range==='*')return true;const wanted=String(range).match(/(\d+)/),actual=String(version).match(/(\d+)/);return !!wanted&&!!actual&&wanted[1]===actual[1]}
  function depId(spec){return String(spec).split('@')[0]}
  class ExtensionLoader{
    constructor(){this.loaded=new Map();this.failed=new Map()}
    order(manifests){const byId=new Map(manifests.map(m=>[m.id,m])),out=[],visiting=new Set(),done=new Set();const visit=m=>{if(done.has(m.id))return;if(visiting.has(m.id))throw new Error(`扩展依赖循环：${[...visiting,m.id].join(' → ')}`);visiting.add(m.id);for(const raw of m.dependencies||[]){const d=byId.get(depId(raw));if(!d)throw new Error(`${m.id} 缺少依赖 ${raw}`);visit(d)}visiting.delete(m.id);done.add(m.id);out.push(m)};manifests.forEach(visit);return out}
    apiFor(manifest){const owner=manifest.id;const ownData=defaults=>{const state=L.services.storage?.getState();if(!state)return null;state.extensionData=state.extensionData||{};if(!state.extensionData[owner])state.extensionData[owner]=JSON.parse(JSON.stringify(defaults||{}));return state.extensionData[owner]};return Object.freeze({coreVersion:L.CORE_VERSION,manifest,events:L.events,services:L.services,registries:L.registries,shell:L.shell,register:(kind,id,value)=>{const r=L.registries[kind];if(!r)throw new Error(`Unknown registry ${kind}`);return r.register(id,value,owner)},registerSlot:(slot,value)=>L.registries.slots.register(slot,value,owner),on:(event,handler)=>L.events.on(event,handler,owner),data:Object.freeze({get:ownData,save:()=>L.services.storage?.save()}),getState:()=>L.services.storage?.getState(),save:()=>L.services.storage?.save(),toast:message=>L.shell?.toast(message),openModal:spec=>L.shell?.openModal(spec),closeModal:()=>L.shell?.closeModal(),refresh:()=>L.shell?.render()})}
    load(state){const disabled=new Set(state?.extensions?.disabled||[]);const candidates=L.extensionManifests.filter(m=>m.enabled!==false&&!disabled.has(m.id));let ordered;try{ordered=this.order(candidates)}catch(error){L.errors.push({extension:'loader',stage:'dependencies',message:error.message,time:Date.now()});ordered=candidates}
      for(const manifest of ordered){try{if(!manifest.id||!manifest.version||!manifest.type)throw new Error('manifest 缺少 id/version/type');if(!compatible(manifest.compatibleCoreVersion,L.CORE_VERSION))throw new Error(`需要核心 ${manifest.compatibleCoreVersion}，当前 ${L.CORE_VERSION}`);for(const dep of manifest.dependencies||[])if(!this.loaded.has(depId(dep)))throw new Error(`依赖 ${dep} 未加载`);const factory=L.extensionDefinitions.get(manifest.id);if(typeof factory!=='function')throw new Error('入口文件未注册 factory');factory(this.apiFor(manifest));this.loaded.set(manifest.id,manifest);L.events.emit('extension.loaded',{manifest})}catch(error){this.failed.set(manifest.id,error);L.errors.push({extension:manifest.id,stage:'load',message:error.message,time:Date.now()})}}
      L.events.emit('extensions.ready',{loaded:[...this.loaded.keys()],failed:[...this.failed.keys()]});return this
    }
  }
  L.ExtensionLoader=ExtensionLoader;
})(window);
