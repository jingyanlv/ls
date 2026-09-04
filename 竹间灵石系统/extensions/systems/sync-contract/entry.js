Lingshi.defineExtension('system.sync-contract',api=>{
  const random=()=>{try{return crypto.getRandomValues(new Uint32Array(3)).join('-')}catch(e){return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}};
  const initial=()=>({schemaVersion:1,deviceId:'device-'+random(),providers:{},lastSyncAt:null});
  api.register('migrations','migration.sync-contract',{targetVersion:1,order:5,migrate:data=>Object.assign(data,{schemaVersion:1,deviceId:data.deviceId||'device-'+random(),providers:data.providers||{},lastSyncAt:data.lastSyncAt||null})});
  const data=()=>api.data.get(initial()),now=()=>new Date().toISOString();
  const createMeta=(kind='record')=>{const time=now(),deviceId=data().deviceId;return {id:`${deviceId}:${kind}:${Date.now().toString(36)}:${random()}`,updatedAt:time,revision:1,deletedAt:null,deviceId}};
  const touch=record=>({...record,updatedAt:now(),revision:Number(record.revision||0)+1,deviceId:data().deviceId});
  const tombstone=record=>{const next=touch(record);next.deletedAt=next.updatedAt;return next};
  const compare=(a,b)=>Number(a?.revision||0)-Number(b?.revision||0)||String(a?.updatedAt||'').localeCompare(String(b?.updatedAt||''))||String(a?.deviceId||'').localeCompare(String(b?.deviceId||''));
  const resolve=(local,remote)=>!local?remote:!remote?local:compare(local,remote)>=0?local:remote;
  const registerProvider=(id,provider)=>{if(!id||!provider||typeof provider.pull!=='function'||typeof provider.push!=='function')throw new Error('同步提供者需实现 pull 与 push');data().providers[id]={enabled:false,registeredAt:now()};api.data.save();return {id,...provider}};
  const publicApi=Object.freeze({deviceId:()=>data().deviceId,createMeta,touch,tombstone,resolve,compare,registerProvider,contractVersion:1});
  api.register('settingsSections','settings.sync-contract',{label:'联动',order:70,render:ctx=>`<div class="help-box">手机联动的行囊已经留好，但现在不会连接任何网络服务。</div><div class="sync-contract-card"><b>本设备标记</b><code>${ctx.escape(data().deviceId)}</code><p>新记录会携带全局唯一 ID、updatedAt、revision、deletedAt 和 deviceId。</p></div>`});
  api.register('systems','system.sync-contract',{label:'未来联动契约',publicApi});
});