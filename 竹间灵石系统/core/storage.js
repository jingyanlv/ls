(function(L){
  'use strict';
  const STORAGE_KEY='lingshi-modular-state-v1';
  const baseState=()=>({schemaVersion:1,profile:{name:'竹间',hero:'把日子过成一段慢慢生长的竹。',note:'今日不必面面俱到，完成一两件重要的小事，就很好。'},economy:{balance:1280,transactions:[]},tasks:{items:[]},shop:{items:[],purchases:[]},themes:{active:null,lastDay:null,access:{}},extensions:{disabled:[],installedData:[],migrationVersions:{}},settings:{sounds:true},extensionData:{}});
  class StorageService{
    constructor(){this.state=this.load()}
    load(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return baseState();const state=JSON.parse(raw);return this.migrate(state)}catch(error){L.errors.push({extension:'core.storage',stage:'load',message:error.message,time:Date.now()});return baseState()}}
    migrate(state){let current=state;while((current.schemaVersion||0)<1){current.schemaVersion=1}return {...baseState(),...current,economy:{...baseState().economy,...current.economy},tasks:{...baseState().tasks,...current.tasks},shop:{...baseState().shop,...current.shop},themes:{...baseState().themes,...current.themes},extensions:{...baseState().extensions,...current.extensions},settings:{...baseState().settings,...current.settings}}}
    getState(){return this.state}
    replace(next){this.state=this.migrate(next);this.save();L.events.emit('storage.replaced',{schemaVersion:this.state.schemaVersion})}
    save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(this.state));L.events.emit('storage.saved',{})}
    backup(label='automatic'){const key=`${STORAGE_KEY}-backup-${Date.now()}`;localStorage.setItem(key,JSON.stringify({label,createdAt:new Date().toISOString(),state:this.state}));return key}
    reset(){this.state=baseState();this.save()}
  }
  L.services.storage=new StorageService();
})(window.Lingshi);
