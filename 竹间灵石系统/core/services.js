(function(L){
  'use strict';
  class EconomyService{
    constructor(storage){this.storage=storage}
    balance(){return this.storage.getState().economy.balance}
    record(amount,label,meta={}){const state=this.storage.getState();state.economy.balance=Math.max(0,Number(state.economy.balance)+Number(amount));const tx={id:L.uid('tx'),time:new Date().toISOString(),amount:Number(amount),label,meta};state.economy.transactions.push(tx);this.storage.save();L.events.emit(amount>=0?'currency.earned':'currency.spent',{transaction:tx,balance:state.economy.balance});return tx}
    earn(amount,label,meta){if(Number(amount)<0)throw new Error('earn amount must be positive');return this.record(amount,label,meta)}
    spend(amount,label,meta){amount=Number(amount);if(amount<0)throw new Error('spend amount must be positive');if(this.balance()<amount)throw new Error('灵石不足');return this.record(-amount,label,meta)}
    refund(amount,label,meta){return this.record(Math.abs(Number(amount)),label,{...meta,refund:true})}
    adjust(amount,label='手动调整'){return this.record(Number(amount),label,{manual:true})}
  }
  class TaskService{
    constructor(storage,economy){this.storage=storage;this.economy=economy}
    list(){return this.storage.getState().tasks.items}
    create(task){const type=L.registries.taskTypes.get(task.type);if(!type)throw new Error(`未知任务类型 ${task.type}`);type.validate?.(task);const item={id:task.id||L.uid('task'),done:false,...task};this.list().push(item);this.storage.save();L.events.emit('task.created',{task:item});return item}
    update(id,changes){const item=this.list().find(x=>x.id===id);if(!item)throw new Error(`找不到任务 ${id}`);Object.assign(item,changes,{id:item.id});this.storage.save();L.events.emit('task.updated',{task:item,changes});return item}
    remove(id){const list=this.list(),index=list.findIndex(x=>x.id===id);if(index<0)throw new Error(`找不到任务 ${id}`);const [task]=list.splice(index,1);this.storage.save();L.events.emit('task.removed',{task});return task}
    complete(id){const task=this.list().find(x=>x.id===id);if(!task||task.done)return task;const handler=L.registries.taskTypes.get(task.type);if(!handler)throw new Error(`任务类型 ${task.type} 未加载`);const outcome=handler.complete?handler.complete(task,{services:L.services,state:this.storage.getState()}):{reward:task.reward};task.done=true;const reward=Number(outcome?.reward??task.reward??0);if(reward>0)this.economy.earn(reward,task.title,{taskId:task.id,category:task.category});this.storage.save();L.events.emit('task.completed',{task,reward,outcome});return task}
    resetDaily(){this.list().forEach(x=>x.done=false);this.storage.save();L.events.emit('day.reset',{})}
  }
  class ShopService{
    constructor(storage,economy){this.storage=storage;this.economy=economy}
    list(){return this.storage.getState().shop.items.filter(x=>x.enabled!==false)}
    find(id){return this.storage.getState().shop.items.find(x=>x.id===id)}
    upsert(item){const list=this.storage.getState().shop.items,index=list.findIndex(x=>x.id===item.id);if(index>=0)list[index]={...list[index],...item};else list.push(item);this.storage.save()}
    async purchase(id){const product=this.find(id);if(!product)throw new Error(`找不到心愿 ${id}`);const handler=L.registries.productTypes.get(product.type);if(!handler)throw new Error(`心愿类型 ${product.type} 未加载`);handler.validate?.(product);const context={product,services:L.services,state:this.storage.getState()};const check=await handler.canPurchase?.(context);if(check===false||typeof check==='string')throw new Error(typeof check==='string'?check:'暂时无法兑换');const cost=Number(product.price||0);this.economy.spend(cost,`兑换：${product.title}`,{productId:product.id,type:product.type});try{const result=await handler.fulfill?.(context);const purchase={id:L.uid('purchase'),productId:product.id,type:product.type,title:product.title,cost,time:new Date().toISOString(),result:result||null};this.storage.getState().shop.purchases.push(purchase);this.storage.save();L.events.emit('shop.purchased',{product,purchase,result});return purchase}catch(error){this.economy.refund(cost,`兑换失败退还：${product.title}`,{productId:product.id});throw error}}
  }
  L.services.economy=new EconomyService(L.services.storage);
  L.services.tasks=new TaskService(L.services.storage,L.services.economy);
  L.services.shop=new ShopService(L.services.storage,L.services.economy);
})(window.Lingshi);
