Lingshi.defineExtension('theme.inkwash',api=>api.register('themes','theme.inkwash',{
  name:'山水未央',
  subtitle:'宣纸山水、矿物暗金与流动云雾',
  icon:'墨',
  tags:['付费','水墨','动态云雾','全景'],
  license:{price:720,durationDays:7},
  preview:'url(./extensions/themes/assets/ink-mountain-scroll.png) center/cover',
  tokens:{
    '--color-background-primary':'#ece7da',
    '--color-background-glow':'rgba(165,132,67,.17)',
    '--color-surface-card':'#f8f3e6',
    '--color-surface-raised':'#eee8da',
    '--color-surface-glass':'rgba(248,243,230,.84)',
    '--color-text-primary':'#252c27',
    '--color-text-muted':'#747971',
    '--color-border-soft':'#cfcabd',
    '--color-accent-primary':'#4a6355',
    '--color-accent-secondary':'#7e8e80',
    '--color-luxury':'#a7833f',
    '--color-luxury-bright':'#d2b970',
    '--color-danger':'#8f4e45',
    '--shadow-card':'0 16px 50px rgba(45,50,46,.10)',
    '--shadow-luxury':'0 0 38px rgba(167,131,63,.15)',
    '--radius-card':'1px',
    '--radius-control':'1px',
    '--font-display':'"STKaiti","KaiTi",serif',
    '--font-body':'"Noto Serif SC","Songti SC",serif',
    '--hero-image':'url(./extensions/themes/assets/ink-mountain-scroll.png)',
    '--hero-overlay':'linear-gradient(90deg,rgba(32,39,34,.72),rgba(45,51,47,.12))'
  },
  styles:`
body[data-theme='theme.inkwash']{
  background-color:#ece7da;
  background-image:linear-gradient(rgba(239,234,221,.78),rgba(245,240,228,.91)),url(./extensions/themes/assets/ink-mountain-scroll.png);
  background-size:cover;background-position:center top;background-attachment:fixed
}
body[data-theme='theme.inkwash'] #theme-layer:before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(90deg,rgba(247,241,225,.3),rgba(65,68,59,.08)),url(./extensions/themes/assets/ink-mountain-scroll.png) center/cover;
  opacity:.25;filter:saturate(.72)
}
body[data-theme='theme.inkwash'] .hero{
  min-height:340px;
  background-image:linear-gradient(90deg,rgba(30,35,31,.84) 0%,rgba(38,42,36,.38) 43%,rgba(44,45,38,.02) 72%),url(./extensions/themes/assets/ink-mountain-scroll.png)!important;
  background-size:cover;background-position:center 54%;filter:saturate(.85)
}
body[data-theme='theme.inkwash'] .hero:before{
  content:'山\A静\A日\A长';white-space:pre;position:absolute;right:24px;top:18px;
  line-height:1.7;color:rgba(255,255,255,.62);font-size:16px;text-shadow:0 1px 10px rgba(24,30,25,.5)
}
body[data-theme='theme.inkwash'] .card,
body[data-theme='theme.inkwash'] .product-card,
body[data-theme='theme.inkwash'] .stat-card{position:relative;overflow:hidden;box-shadow:none}
body[data-theme='theme.inkwash'] .card:after,
body[data-theme='theme.inkwash'] .product-card:after,
body[data-theme='theme.inkwash'] .stat-card:after{
  content:'';position:absolute;right:-18px;bottom:-18px;width:160px;height:116px;pointer-events:none;
  background:url(./extensions/themes/assets/ink-mountain-scroll.png) 82% 58%/cover;
  opacity:.14;filter:grayscale(.18) sepia(.08);mask-image:linear-gradient(120deg,transparent 2%,#000 75%)
}
body[data-theme='theme.inkwash'] .product-card{border-top:3px solid #a7833f}
body[data-theme='theme.inkwash'] .section-head h2:before,
body[data-theme='theme.inkwash'] .section-head h3:before{content:'◆';margin-right:8px;color:#a7833f;font-size:9px}
.ink-mist{position:absolute;width:90vw;height:24vh;border-radius:50%;filter:blur(35px);background:rgba(245,244,235,.38);animation:inkDrift var(--d) ease-in-out infinite alternate;left:var(--x);top:var(--y)}
.ink-gold{position:absolute;width:3px;height:3px;border-radius:50%;background:#c29e50;box-shadow:0 0 9px #dabb72;left:var(--x);top:var(--y);animation:inkGlow 4s ease-in-out infinite}
@keyframes inkDrift{to{transform:translateX(26vw) scale(1.2);opacity:.2}}
@keyframes inkGlow{50%{opacity:.18;transform:scale(.5)}}
`,
  mount:({layer})=>{
    layer.innerHTML='<i class="ink-mist" style="--x:-20%;--y:18%;--d:18s"></i><i class="ink-mist" style="--x:15%;--y:62%;--d:24s"></i>'+Array.from({length:20},(_,i)=>`<i class="ink-gold" style="--x:${(i*43)%100}%;--y:${(i*29)%90}%"></i>`).join('');
    return()=>{layer.innerHTML=''};
  }
}));
