Lingshi.defineExtension('statistics.basic',api=>{
  api.register('statistics','stat.earned',{order:10,label:'这段时间拾得',compute:s=>({value:s.economy.transactions.filter(x=>x.amount>0).reduce((n,x)=>n+x.amount,0),note:'每一枚都有来处'})});
  api.register('statistics','stat.spent',{order:20,label:'已经花去',compute:s=>({value:Math.abs(s.economy.transactions.filter(x=>x.amount<0).reduce((n,x)=>n+x.amount,0)),note:'为愿望与新境界'})});
  api.register('statistics','stat.completed',{order:30,label:'今日完成',compute:s=>({value:s.tasks.items.filter(x=>x.done).length,note:'不必全部完成'})});
});
