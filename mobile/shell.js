(function(){
 let detailFrame=null;
 window.addEventListener('message',function(e){
 const frame=document.getElementById('mp-app-frame');if(!frame||e.source!==frame.contentWindow)return;
 if(e.data?.type==='mp-mobile-open'&&!detailFrame){detailFrame=frame;history.pushState({mpMobileDetail:true},'',location.href);document.body.classList.add('mobile-detail-open');}
 if(e.data?.type==='mp-mobile-close'&&detailFrame)history.back();
 });
 window.addEventListener('popstate',function(){if(detailFrame){detailFrame.contentWindow.postMessage({type:'mp-mobile-back'},'*');detailFrame=null;document.body.classList.remove('mobile-detail-open');}});
 const observer=new MutationObserver(function(){const bar=document.getElementById('mp-account-bar');if(bar&&!bar.querySelector('.mobile-account-menu')){const menu=document.createElement('button');menu.textContent='☰';menu.className='mobile-account-menu';menu.setAttribute('aria-label','Μενού λογαριασμού');menu.onclick=function(){const open=bar.classList.toggle('expanded');menu.setAttribute('aria-expanded',String(open));};bar.prepend(menu);}});observer.observe(document.getElementById('mp-auth-root'),{childList:true,subtree:true});
})();


if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/mediprice/mobile/sw.js',{scope:'/mediprice/mobile/'}).catch(function(error){console.warn('Mobile service worker registration failed',error);});});}

(function(){
 const css=document.createElement('style');
 css.textContent=`
 html,body{width:100%;height:100%;overflow:hidden;overscroll-behavior:none}
 body{position:fixed;inset:0}
 #mp-auth-root{height:var(--mobile-height,100dvh)!important;min-height:0;overflow:hidden}
 #mp-account-bar{flex:0 0 auto}
 #mp-app-frame{display:block;flex:1 1 0%;height:0;min-height:0;min-width:0}
 .mp-login-wrap{min-height:0;overflow:auto}
 #mobile-shell-nav{flex:0 0 auto;display:flex;min-height:56px;padding-bottom:env(safe-area-inset-bottom);background:var(--sur);border-top:1px solid var(--brd)}
 #mobile-shell-nav a{flex:1;display:flex;align-items:center;justify-content:center;min-height:56px;color:var(--mut);text-decoration:none;font-size:12px}
 #mobile-shell-nav a[aria-current="page"]{color:var(--acc);font-weight:700;background:var(--acc-bg)}
 .mobile-detail-open #mobile-shell-nav{display:none}
 `;
 document.head.append(css);
 function size(){document.documentElement.style.setProperty('--mobile-height',(window.visualViewport?window.visualViewport.height:window.innerHeight)+'px');window.scrollTo(0,0);}
 size();window.addEventListener('resize',size);window.visualViewport?.addEventListener('resize',size);
 const root=document.getElementById('mp-auth-root');
 function navigation(){
 const frame=document.getElementById('mp-app-frame');let nav=document.getElementById('mobile-shell-nav');
 if(!frame){nav?.remove();return;}
 if(!nav){nav=document.createElement('nav');nav.id='mobile-shell-nav';nav.setAttribute('aria-label','Πλοήγηση εφαρμογής');
 [['Κατάλογος','index.html'],['Plafond','plafond.html'],['Κατηγοριοποίηση','katigoriopoiisi.html']].forEach(([label,page])=>{const link=document.createElement('a');link.textContent=label;link.href='/mediprice/mobile/'+(page==='index.html'?'':page);link.dataset.page=page;nav.append(link);});
 root.append(nav);
 }
 nav.querySelectorAll('a').forEach(link=>{if(link.dataset.page===window.MP_PAGE)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
 }
 new MutationObserver(navigation).observe(root,{childList:true});
 window.addEventListener('popstate',navigation);
 root.addEventListener('load',navigation,true);
 navigation();
})();
