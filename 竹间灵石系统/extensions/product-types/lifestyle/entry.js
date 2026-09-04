Lingshi.defineExtension('product.lifestyle',api=>{
  const fields=[{key:'icon',label:'图标',type:'text',default:'🎁'},{key:'title',label:'名称',type:'text',required:true},{key:'description',label:'说明',type:'textarea'},{key:'price',label:'所需灵石',type:'number',min:0,default:300}];
  const render=(product,ctx,label)=>`<article class="product-card"><div class="product-type">${ctx.escape(label)}</div><div class="product-icon">${ctx.escape(product.icon||'🎁')}</div><h4>${ctx.escape(product.title)}</h4><p>${ctx.escape(product.description||'')}</p><div class="product-foot"><b>${ctx.money(product.price)} 灵石</b><button data-shop-purchase="${ctx.escape(product.id)}">允许自己拥有</button></div></article>`;
  const simple=(id,label)=>api.register('productTypes',id,{label,fields,validate:p=>{if(!p.title)throw new Error('心愿需要名称');if(Number(p.price)<0)throw new Error('价格不能为负数')},renderCard:(p,c)=>render(p,c,label),fulfill:({product})=>({kind:id,payload:product.payload||{},fulfilledAt:new Date().toISOString()})});
  simple('product.cash','现金用途');simple('product.rest-time','休息时长');simple('product.permission','生活许可');simple('product.custom','其他心愿');
});
