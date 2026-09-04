(function(L){
  'use strict';
  try{
    L.shell=new L.Shell();
    L.loader=new L.ExtensionLoader();
    L.loader.load(L.services.storage.getState());
    const state=L.services.storage.getState();
    state.extensions.migrationVersions=state.extensions.migrationVersions||{};
    for(const migration of L.registries.migrations.list().sort((a,b)=>(a.order||0)-(b.order||0))){
      try{
        const current=Number(state.extensions.migrationVersions[migration.__owner]||0),target=Number(migration.targetVersion||1);
        if(current<target){migration.migrate(state.extensionData[migration.__owner]||(state.extensionData[migration.__owner]={}),{state,services:L.services,fromVersion:current,toVersion:target});state.extensions.migrationVersions[migration.__owner]=target}
      }catch(error){L.errors.push({extension:migration.__owner,stage:'migration',message:error.message,time:Date.now()})}
    }
    for(const seed of L.registries.dataSeeds.list()){try{seed.apply(state)}catch(error){L.errors.push({extension:seed.__owner,stage:'seed',message:error.message,time:Date.now()})}}
    L.services.theme.refreshInstalled();
    L.registries.systems.get('system.theme-commerce')?.publicApi?.sync?.();
    L.services.storage.save();
    L.services.theme.apply();
    L.shell.start();
    L.events.emit('app.ready',{coreVersion:L.CORE_VERSION});
  }catch(error){
    document.getElementById('page-root').innerHTML=`<div class="empty status-error">灵石系统启动失败：${L.escape(error.message)}</div>`;
    L.errors.push({extension:'core.boot',stage:'boot',message:error.message,time:Date.now()});
  }
})(window.Lingshi);
