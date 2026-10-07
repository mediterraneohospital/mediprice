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
 #mp-auth-root{height:100svh!important;min-height:0;overflow:hidden}
 #mp-account-bar{flex:0 0 auto}
 #mp-app-frame{display:block;flex:1 1 0%;height:0;min-height:0;min-width:0}
 .mp-login-wrap{min-height:0;overflow:auto}
 #mobile-shell-nav{flex:0 0 auto;display:flex;min-height:56px;padding-bottom:env(safe-area-inset-bottom);background:var(--sur);border-top:1px solid var(--brd)}
 #mobile-shell-nav a{flex:1;display:flex;align-items:center;justify-content:center;min-height:56px;color:var(--mut);text-decoration:none;font-size:12px}
 #mobile-shell-nav a[aria-current="page"]{color:var(--acc);font-weight:700;background:var(--acc-bg)}
 .mobile-detail-open #mobile-shell-nav{display:none}
 `;
 document.head.append(css);
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

(function(){
 const badge=document.createElement('div');badge.id='mobile-refresh-hint';badge.setAttribute('role','status');
 badge.style.cssText='position:fixed;top:52px;left:50%;transform:translateX(-50%);z-index:2000;padding:10px 16px;border-radius:24px;background:var(--sur);color:var(--acc);box-shadow:0 3px 15px #0003;pointer-events:none;display:none;font:14px system-ui';
 document.body.append(badge);
 function bind(doc){
 let start=null,ready=false;
 function reset(){start=null;ready=false;badge.style.display='none';}
 doc.addEventListener('touchstart',function(e){
 reset();if(e.touches.length!==1||document.body.classList.contains('mobile-detail-open')||doc.querySelector('.gs-drop.open')||e.target.closest('input,select,textarea,button,a'))return;
 let node=e.target,canPull=true;while(node&&node!==doc){if(node.nodeType===1&&node.scrollHeight>node.clientHeight+1&&node.scrollTop>1){canPull=false;break;}node=node.parentNode;}
 if(canPull)start={x:e.touches[0].clientX,y:e.touches[0].clientY};
 },{passive:true});
 doc.addEventListener('touchmove',function(e){if(!start)return;if(e.touches.length!==1){reset();return;}const dx=e.touches[0].clientX-start.x,dy=e.touches[0].clientY-start.y;
 if(Math.abs(dx)>40||dy<0){reset();return;}ready=dy>=100;badge.style.display=dy>25?'block':'none';badge.textContent=ready?'Άφησε για ανανέωση':'Τράβηξε για ανανέωση';
 },{passive:true});
 doc.addEventListener('touchend',function(){const reload=ready;reset();if(reload)window.location.reload();},{passive:true});
 doc.addEventListener('touchcancel',reset,{passive:true});
 }
 function frameReady(e){if(e.target.id==='mp-app-frame'&&e.target.contentDocument)bind(e.target.contentDocument);}
 document.getElementById('mp-auth-root').addEventListener('load',frameReady,true);
 bind(document);
})();
