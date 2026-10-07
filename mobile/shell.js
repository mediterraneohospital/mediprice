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
