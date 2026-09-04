Lingshi.defineExtension('system.theme-commerce',api=>{
  const sync=()=>{for(const theme of api.services.theme.list()){const price=Number(theme.license?.price||0);if(!price)continue;api.services.shop.upsert({id:'theme-product:'+theme.id,type:'product.theme-unlock',title:theme.name,description:`${theme.subtitle||'完整视觉主题'} · 限时 ${theme.license.durationDays||7} 日`,icon:theme.icon||'境',price,payload:{themeId:theme.id,durationDays:theme.license.durationDays||7},generated:true,enabled:true})}};
  api.on('extensions.ready',sync);api.on('config.applied',sync);api.register('systems','system.theme-commerce',{label:'主题商城桥接',publicApi:{sync}});
});
