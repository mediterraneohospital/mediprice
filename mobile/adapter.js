(function(){
 'use strict';
 function quietSearchFields(){document.querySelectorAll('input:not([type]),input[type="text"],input[type="search"]').forEach(input=>{
 input.setAttribute('autocomplete','off');input.setAttribute('autocorrect','off');input.setAttribute('autocapitalize','none');input.setAttribute('spellcheck','false');
 });}
 quietSearchFields();
 new MutationObserver(quietSearchFields).observe(document.body,{childList:true,subtree:true});

 if(!document.getElementById('viewSingle')){
 const secondaryStyle=document.createElement('style');
 secondaryStyle.textContent=`
 html,body{height:100%;margin:0;overflow:hidden;overscroll-behavior:none}
 #app{display:flex;flex-direction:column;height:100%;min-height:0}
 #app>header{flex:0 0 auto;min-height:48px;height:auto;padding:8px 12px;gap:8px}
 header .hosp,header .back,header .sep{display:none}
 header .title{font-size:14px}#darkBtn{flex-shrink:0}
 #app>.sidebar{display:flex;flex-direction:column;flex:0 0 auto;height:auto;max-height:none;min-height:0;overflow:visible;border-right:0;border-bottom:1px solid var(--brd)}
 .ins-tabs,.sb-list,.sb-search{display:none!important}.mobile-choice{display:block;padding:8px 12px}.mobile-choice span{display:block;font-size:12px;color:var(--mut);margin-bottom:5px}.mobile-choice select{width:100%;min-height:44px;font:inherit;font-size:16px;padding:8px;border:1px solid var(--brd);border-radius:10px;background:var(--sur);color:var(--txt)}.placeholder{flex:0 0 auto;padding:30px 16px}.placeholder p{max-width:100%}
 .ins-tab{flex:0 0 auto;min-height:40px;padding:10px 14px;white-space:nowrap}
 .sb-search{flex:0 0 auto;padding:8px 12px}.sb-search input{font-size:16px}
 .sb-list{min-height:0;overflow-y:auto;overscroll-behavior:contain}
 main{flex:1 1 0;min-height:0;overflow:auto;overscroll-behavior:contain}
 .detail{padding:12px;min-height:0}.det-head{padding:12px}.det-name{font-size:18px}
 .det-searchbox{width:100%;margin-left:0}.det-searchbox input{font-size:16px}
 .table-wrap{overflow-x:auto;overflow-y:visible;min-height:0;flex:none}.cat-chips,.active-filters{padding:8px 0}
 main{display:block;padding:0 12px 20px}
 main>.sidebar{display:flex;flex-direction:column;border-bottom:1px solid var(--brd)}
 .detail{display:block;overflow:visible;padding:12px 0;flex:none}
 .det-head{padding:8px 0}.det-name{font-size:16px}
 .mobile-choice{padding:8px 0}
 .cat-chips{gap:5px}
 table{min-width:100%;margin:8px 0}td,th{padding:10px 12px}

 .spec-card{padding:12px;gap:8px;flex-wrap:wrap}.sc-info{min-width:0;flex-basis:65%}
 .tabs{overflow-x:auto}.tab{white-space:nowrap;flex-shrink:0}
 .follow-modal-backdrop,.fee-pop-backdrop{overflow:auto}.follow-modal{max-height:100%;overflow:auto}
 `;
 document.head.append(secondaryStyle);

 const sidebar=document.querySelector('#app>.sidebar');
 document.querySelector('main').prepend(sidebar);
 function choice(label,selector){
 const wrap=document.createElement('label');wrap.className='mobile-choice';const caption=document.createElement('span');caption.textContent=label;const select=document.createElement('select');select.setAttribute('aria-label',label);wrap.append(caption,select);sidebar.append(wrap);
 let signature='';
 function sync(){
 const items=[...document.querySelectorAll(selector)];const labels=items.map(item=>{const copy=item.cloneNode(true);copy.querySelectorAll('.sb-count,.sb-type').forEach(n=>n.remove());return copy.textContent.trim();});
 const next=JSON.stringify(labels);if(next!==signature){signature=next;select.replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Επίλεξε '+label.toLowerCase();select.append(placeholder);labels.forEach((text,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=text;select.append(option);});}
 const active=items.findIndex(item=>item.classList.contains('active'));select.value=active<0?'':String(active);
 }
 select.onchange=()=>{if(select.value==='')return;document.querySelectorAll(selector)[Number(select.value)]?.click();document.querySelector('main').scrollTop=0;sync();};
 sync();return sync;
 }
 const tabs=document.querySelector('.ins-tabs');const syncIns=tabs?choice('Ασφαλιστική εταιρεία','.ins-tabs .ins-tab'):null;
 const syncList=choice(tabs?'Ειδικότητα':'Ασφαλιστική εταιρεία','#sbList .sb-item');
 const watch=new MutationObserver(()=>{syncIns?.();syncList();});
 const list=document.getElementById('sbList');if(list)watch.observe(list,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});if(tabs)watch.observe(tabs,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 document.querySelectorAll('.placeholder p').forEach(p=>{p.textContent=tabs?'Επίλεξε ασφαλιστική και ειδικότητα από τα μενού παραπάνω.':'Επίλεξε ασφαλιστική εταιρεία από το μενού παραπάνω για να δεις τα plafond και τα πακέτα.';});

 return;
 }

 const style=document.createElement('style');
 style.textContent=`
 html,body{height:100%;overflow:hidden;font-size:15px} #app{display:flex;flex-direction:column;height:100%;min-height:0;overscroll-behavior:none}
 header{flex:none;display:flex;flex-wrap:wrap;padding:10px 12px;gap:8px;height:auto}header .hosp{display:none}header .logo{font-size:19px}
 header>a,#editBtn,#editBar{display:none!important}#darkBtn{margin-left:auto}.gsearch{order:3;width:100%;flex-basis:100%}.gsearch{position:relative}.gsearch input{padding-right:48px!important;font-size:16px;min-height:44px;border-radius:10px}
 .mobile-search-clear{position:absolute;right:8px;top:2px;min-width:40px;min-height:40px;border:0;background:transparent;color:var(--mut);font-size:25px;z-index:3}.mobile-search-clear[hidden]{display:none}.mobile-all-title{font-size:17px;padding:12px;margin:0} .gsearch:has(.gs-drop.open){z-index:300}
 .gs-drop.open{background:var(--sur);border:2px solid var(--acc);box-shadow:0 12px 32px rgba(0,0,0,.3);isolation:isolate}
 .gs-drop .gs-item{background:var(--sur);border-bottom:1px solid var(--brd)}
 .gs-drop .gs-item:last-child{border-bottom:0}
 .gs-drop .gs-item:hover,.gs-drop .gs-item:focus-within{background:var(--acc-bg)}
 #app:has(.gs-drop.open) main::after{content:'';position:fixed;inset:0;background:rgba(16,24,40,.42);z-index:200}
 #app:has(.gs-drop.open)>header{position:relative;z-index:300}
 .gs-drop{top:48px;max-height:calc(100dvh - 210px);border-radius:12px}.gs-item{padding:16px 12px}.gs-desc{font-size:16px!important;line-height:1.45}.gs-meta{margin-top:8px}
 .sidebar{display:none}main{min-height:0;flex:1;overflow:auto;padding-bottom:12px;overscroll-behavior:contain}main>div{flex:none!important;overflow:visible!important}.card-list{overflow:visible!important;padding:12px!important;display:block!important}.multi-wrap{padding:12px!important}
 .proc-card{width:100%;max-width:none;min-height:66px;padding:16px 12px;gap:10px;border-radius:12px;background:var(--sur)}.pc-desc{font-size:16px!important;line-height:1.45}.pc-aa{display:none}.pc-chevron{flex:none}
 .mobile-specialty{order:4;width:100%;min-height:44px;font:inherit;color:var(--txt);background:var(--sur);border:1px solid var(--brd);border-radius:10px;padding:8px}
 .mobile-nav{position:fixed;bottom:0;left:0;right:0;height:56px;display:flex;background:var(--sur);border-top:1px solid var(--brd);z-index:150;padding-bottom:env(safe-area-inset-bottom)}.mobile-nav a{flex:1;display:flex;align-items:center;justify-content:center;color:var(--acc);text-decoration:none;font-size:13px}
 .card-detail.mobile-full{position:fixed!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;margin:0!important;overflow:auto!important;background:var(--sur);z-index:1000;border:0;border-radius:0;padding-bottom:30px;box-sizing:border-box}.mobile-detail-head{position:sticky;top:0;background:var(--sur);border-bottom:1px solid var(--brd);padding:12px;z-index:2}.mobile-detail-head button{font:inherit;background:none;border:0;color:var(--acc);min-height:44px}.mobile-detail-head button:focus{outline:none;box-shadow:none}.mobile-detail-head button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}@media(pointer:coarse){.mobile-detail-head button:focus-visible{outline:none}}.mobile-detail-head h2{font-size:19px;line-height:1.5;margin:8px 0}.mobile-detail-head small{color:var(--mut)}
 .mobile-full .detail-wrap{padding:12px!important;max-width:100%;display:block!important}.mobile-full table{width:100%!important;min-width:0!important;table-layout:fixed}.mobile-full td,.mobile-full th{overflow-wrap:anywhere;white-space:normal!important;padding:10px 6px!important}.mobile-full .dt-label{width:43%!important}.mobile-full .dt-val{width:57%!important}.mobile-full .card-detail-close{display:none}.drawer{inset:0;width:100%;max-width:100%;height:100%;border-radius:0;z-index:1000}.instr-body{overflow-wrap:anywhere}
 `;
 document.head.append(style);
 const header=document.querySelector('#app>header');
 if(!header)return;
 const select=document.createElement('select');select.className='mobile-specialty';select.setAttribute('aria-label','Επιλογή ειδικότητας');header.append(select);
 let optionsSignature='',allSelected=false;
 const main=document.querySelector('main');const allList=document.createElement('div');allList.id='mobileAll';allList.style.display='none';main.append(allList);
 function chooseSpecialty(value){allSelected=value==='all';allList.style.display=allSelected?'block':'none';if(!allSelected){document.querySelectorAll('.sb-item')[Number(value)]?.click();return;}allList.replaceChildren();[...document.querySelectorAll('.sb-item')].forEach((item,i)=>{if(item.classList.contains('locked'))return;item.click();const source=[...main.querySelectorAll('[id^="view"]')].find(v=>v.style.display!=='none'&&v.querySelector('.proc-card'));if(!source)return;const heading=document.createElement('h2');heading.className='mobile-all-title';heading.textContent=item.querySelector('span')?.textContent||'';allList.append(heading);[...source.querySelectorAll('.proc-card')].forEach((card,index)=>{const button=document.createElement('button');button.className='proc-card';button.style.textAlign='left';const label=document.createElement('span');label.className='pc-desc';label.textContent=card.querySelector('.pc-desc')?.textContent||card.textContent;button.append(label);button.onclick=()=>{item.click();const target=[...document.getElementById(source.id).querySelectorAll('.proc-card')][index];target?.click();};allList.append(button);});});main.querySelectorAll('[id^="view"]').forEach(v=>v.style.display='none');select.value='all';}
 const searchInput=document.getElementById('gsInput');const clear=document.createElement('button');clear.type='button';clear.className='mobile-search-clear';clear.textContent='×';clear.setAttribute('aria-label','Καθαρισμός αναζήτησης πράξεων');clear.hidden=!searchInput.value;searchInput.parentElement.append(clear);searchInput.addEventListener('input',()=>{clear.hidden=!searchInput.value;});clear.onclick=()=>{searchInput.value='';globalSearch('');clear.hidden=true;searchInput.focus();};
 function syncSpecialties(){const items=[...document.querySelectorAll('.sb-item')];const sig=items.map(x=>x.textContent).join('|');if(sig!==optionsSignature){optionsSignature=sig;select.replaceChildren();const allOption=document.createElement('option');allOption.value='all';allOption.textContent='Όλες οι ειδικότητες';select.append(allOption);items.forEach((item,i)=>{const o=document.createElement('option');o.value=i;o.textContent=item.querySelector("span")?.textContent+" · "+(item.querySelector(".sb-count")?.textContent||"");o.disabled=item.classList.contains('locked');select.append(o);});}const active=items.findIndex(x=>x.classList.contains('active'));if(allSelected)select.value='all';else if(active>=0)select.value=active;}
 select.onchange=()=>{chooseSpecialty(select.value);main.scrollTop=0;};
 const baseSearch=window.globalSearch;
 if(baseSearch)window.globalSearch=function(q){baseSearch(q);const needle=norm(q);if(!needle)return;const drop=document.getElementById('gsDrop');GNATHO.sections.forEach((section,si)=>section.subtables.forEach((table,sti)=>{if(table.kind!=='procedures')return;table.rows.forEach((row,ri)=>{if(!norm(row.desc).includes(needle))return;drop.querySelector('.gs-empty')?.remove();const item=document.createElement('div');item.className='gs-item';const title=document.createElement('div');title.className='gs-desc';title.textContent=row.desc;const meta=document.createElement('div');meta.className='gs-meta';meta.textContent='Γναθοχειρουργικά';item.append(title,meta);item.onclick=()=>{drop.classList.remove('open');document.getElementById('gsInput').value='';showView('gnatho');const cards=[...document.querySelectorAll('#viewGnatho .proc-card')];const target=cards.find(c=>(c.getAttribute('onclick')||'').includes('toggleGnathoProcCard('+si+','+sti+','+ri+','));if(target)toggleGnathoProcCard(si,sti,ri,target);};drop.append(item);});}));};
 let current=null,card=null,snapshot=null,previousFocus=null;
 function remember(){snapshot={q:document.getElementById('gsInput')?.value||'',results:document.getElementById('gsDrop')?.innerHTML||'',searchOpen:document.getElementById('gsDrop')?.classList.contains('open'),specialty:select.value,scroll:document.querySelector('main').scrollTop};}
 document.addEventListener('click',e=>{if(e.target.closest('.proc-card,.gs-item'))remember();},true);
 function restore(){if(current){current.remove();current=null;}card?.classList.remove('active');if(snapshot){const input=document.getElementById('gsInput'),drop=document.getElementById('gsDrop');chooseSpecialty(snapshot.specialty);input.value=snapshot.q;clear.hidden=!input.value;globalSearch(snapshot.q);drop.classList.toggle('open',!!snapshot.searchOpen);document.querySelector('main').scrollTop=snapshot.scroll;}previousFocus?.focus({preventScroll:true});}
 window.addEventListener('message',e=>{if(e.source===parent&&e.data?.type==='mp-mobile-back')restore();});
 const observer=new MutationObserver(()=>{syncSpecialties();const detail=document.querySelector('.card-detail:not(.mobile-full)');if(!detail||current)return;card=detail.previousElementSibling;current=detail;previousFocus=document.activeElement;detail.classList.add('mobile-full');detail.setAttribute('role','dialog');detail.setAttribute('aria-modal','true');const title=card?.querySelector('.pc-desc')?.textContent||card?.textContent||'Λεπτομέρειες πράξης';const head=document.createElement('div');head.className='mobile-detail-head';const back=document.createElement('button');back.textContent='‹ Πίσω';back.onclick=()=>parent.postMessage({type:'mp-mobile-close'},parent.location.origin);const category=document.createElement('small');category.textContent=select.selectedOptions[0]?.textContent||'';const h=document.createElement('h2');h.textContent=title;head.append(back,category,h);detail.prepend(head);detail.scrollTop=0;back.focus({preventScroll:true});parent.postMessage({type:'mp-mobile-open'},parent.location.origin);});observer.observe(document.querySelector('main'),{childList:true,subtree:true});observer.observe(document.getElementById('sbList'),{childList:true,subtree:true});syncSpecialties();
})();



