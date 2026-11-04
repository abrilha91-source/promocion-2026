'use strict';
/* Promoción 2026 · v2.0 · App de estudio (estilo Plan de Ascenso). El banco de preguntas NO viene incluido: se importa en el dispositivo y vive solo en localStorage. */
const $=s=>document.querySelector(s),V=$('#v');
const KB='p26_bank',KP='p26_prog',DAY=864e5,INT=[0,0,1,3,7,15];
const KL='p26_lec';let LEC=null,BANK=null,P=null,TIMER=null,POMO=null;
const RANKS=['Cadete','Subteniente','Teniente','Cap. 2/o.','Cap. 1/o.','Mayor','Tte. Cor.','Coronel','Gral. Brig.','Gral. Brigada','Gral. Div.'];
const STOP=new Set('el la los las un una unos unas de del al a en y o u que se su sus por para con sin es son lo le les como más mas este esta estos estas ese esa cual cuál cuando donde dónde qué quien quién ha han ser será sean está están entre sobre todo toda todos todas otro otra otros otras dicha dichas dicho cada mismo misma muy tanto'.split(' '));
const COL={LM:'#5b4bf5',OP:'#ff7a5c',DH:'#22c39a',AA:'#f0a224',AMM:'#3fb6f0',AT:'#e0405a'};
/* El banco (~3 MB) se guarda en IndexedDB: localStorage de Safari/iPhone no alcanza (cuota ~5 MB) */
function idb(){return new Promise((ok,ko)=>{const r=indexedDB.open('p26',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)})}
function idbSet(k,v){return idb().then(d=>new Promise((ok,ko)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>ok();t.onerror=()=>ko(t.error);t.onabort=()=>ko(t.error)}))}
function idbGet(k){return idb().then(d=>new Promise((ok,ko)=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>ok(q.result);q.onerror=()=>ko(q.error)}))}
function idbDel(k){return idb().then(d=>new Promise(ok=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').delete(k);t.oncomplete=()=>ok();t.onerror=()=>ok()}))}
function load(){try{BANK=JSON.parse(localStorage.getItem(KB))}catch(e){BANK=null}
 try{P=JSON.parse(localStorage.getItem(KP))}catch(e){P=null}
 P=Object.assign({it:{},xp:0,st:{n:0,last:''},day:{d:'',n:0},goal:20,hist:[],lv:{},best:{},
  hd:{},xpd:{},badges:{},retos:{},logs:[],pomo:{work:25,short:5,long:15,every:4,count:0},pomoRun:null,dark:false,cnt:{resp:0,ok:0,maxc:0,cards:0,sim:0,pomos:0}},P||{});
 if(!P.cnt.resp){let r=0,o=0;Object.values(P.it).forEach(s=>{r+=(s.ok||0)+(s.ko||0);o+=s.ok||0});P.cnt.resp=r;P.cnt.ok=o}}
function prep(){if(!BANK)return;BANK._all=BANK._all||BANK.items;P.bad=P.bad||{};BANK.items=BANK._all.filter(i=>!i.oculto&&!P.bad[i.id]);BANK.cuadros=BANK.cuadros||[]}
function save(){localStorage.setItem(KP,JSON.stringify(P))}
const today=()=>new Date().toLocaleDateString('sv');
const ymd=d=>d.toLocaleDateString('sv');
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9ñ ]/g,' ').replace(/\s+/g,' ').trim();
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cap=s=>{s=String(s).toLowerCase();return s.charAt(0).toUpperCase()+s.slice(1)};
const pct=(a,b)=>b?Math.round(a*100/b):0;
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2400)}
const topics=()=>BANK?BANK.temas.filter(t=>BANK.items.some(i=>i.t===t.id)):[];
const items=t=>BANK.items.filter(i=>!t||i.t===t);
const byTT=tt=>BANK.items.filter(i=>(i.tt||('s:'+i.s))===tt);
const st=id=>P.it[id]||{b:0,due:0,ok:0,ko:0};
function rankOf(xp){const l=Math.floor(Math.sqrt(xp/60));return{l,name:RANKS[Math.min(l,RANKS.length-1)],nextName:RANKS[Math.min(l+1,RANKS.length-1)],next:Math.pow(l+1,2)*60,prev:l*l*60}}
const HD=()=>(P.hd[today()]=P.hd[today()]||{resp:0,ok:0,cards:0,ses:0,min:0});
function racha(){let d=new Date();const a=x=>P.hd[ymd(x)]&&(P.hd[ymd(x)].resp||P.hd[ymd(x)].min);if(!a(d))d=new Date(Date.now()-DAY);let n=0;while(a(d)){n++;d=new Date(d.getTime()-DAY)}return Math.max(n,P.st.last===today()?P.st.n:0)}
function bump(){const d=today();if(P.day.d!==d){P.day={d,n:0}}P.day.n++;
 if(P.st.last!==d){const y=new Date(Date.now()-DAY).toLocaleDateString('sv');P.st.n=(P.st.last===y?P.st.n:0)+1;P.st.last=d}}
function gainXP(n){if(!n)return;const r0=rankOf(P.xp).l,h0=P.xpd[today()]||0;P.xp+=n;P.xpd[today()]=h0+n;
 if(rankOf(P.xp).l>r0)setTimeout(()=>{confeti();toast('🎖️ ¡Ascenso a '+rankOf(P.xp).name+'!')},300);
 const meta=P.goal*10;if(h0<meta&&h0+n>=meta){setTimeout(()=>{confeti(80);toast('🎯 ¡Meta diaria cumplida!')},200)}
 checkBadges();hdr()}
/* Repetición espaciada: Leitner (quiz) + SM-2 (tarjetas con autoevaluación) sobre el mismo registro */
function grade(it,ok){const s=Object.assign({b:0,due:0,ok:0,ko:0},P.it[it.id]);
 if(ok){s.ok++;s.b=Math.min(5,s.b+1)}else{s.ko++;s.b=1}
 s.due=Date.now()+INT[s.b]*DAY-36e5;s.last=Date.now();P.it[it.id]=s;bump();count(ok);save()}
function sm2(it,q){const s=Object.assign({b:0,due:0,ok:0,ko:0},P.it[it.id]);s.ef=s.ef||2.5;s.rep=s.rep||0;s.iv=s.iv||0;
 if(q<3){s.rep=0;s.iv=1;s.ko++;s.b=1}else{s.rep++;s.iv=s.rep===1?1:s.rep===2?6:Math.round(s.iv*s.ef);s.ok++;s.b=Math.min(5,s.b+1)}
 s.ef=Math.max(1.3,s.ef+(0.1-(5-q)*(0.08+(5-q)*0.02)));
 s.due=Date.now()+(q<3?10*60000:s.iv*DAY-36e5);s.last=Date.now();P.it[it.id]=s;bump();count(q>=3);HD().cards++;P.cnt.cards++;save()}
function count(ok){const h=HD();h.resp++;P.cnt.resp++;if(ok){h.ok++;P.cnt.ok++}}
function mastery(L){if(!L.length)return 0;return L.reduce((a,i)=>a+Math.min(st(i.id).b,4),0)/(L.length*4)}

/* ---------- Generadores de reactivos ---------- */
function distract(it,n=3){const a=norm(it.a),out=[],used=new Set([a]);
 const pools=[shuf(BANK.items.filter(x=>x.s===it.s)),shuf(BANK.items.filter(x=>x.t===it.t)),shuf(BANK.items)];
 for(const pool of pools)for(const x of pool){const k=norm(x.a);if(out.length>=n)break;if(used.has(k)||k.includes(a)||a.includes(k)||[...used].some(u=>1-lev(u,k)/Math.max(u.length,k.length,1)>.7))continue;used.add(k);out.push(x.a)}
 return out}
function mkMC(it){let d=(it.d||[]).filter(x=>norm(x)!==norm(it.a)).slice(0,3);if(d.length<3)d=d.concat(distract(it,3-d.length).filter(x=>!d.includes(x)));return{k:'mc',it,q:it.q,opts:shuf([it.a,...d]),ans:it.a,lbl:'Opción múltiple'}}
function mkTF(it){const t=Math.random()<.5,cand=t?it.a:(distract(it,1)[0]||it.a);return{k:'tf',it,q:it.q,cand,opts:['Verdadero','Falso'],ans:(t||cand===it.a)?'Verdadero':'Falso',lbl:'Verdadero o falso'}}
function mkFill(it){const w=it.q.split(/\s+/),c=[];w.forEach((x,i)=>{const n=norm(x);if(n.length>=6&&!STOP.has(n)&&!/\d/.test(n))c.push(i)});
 if(!c.length)return mkMC(it);const i=c[Math.random()*c.length|0],raw=w[i],word=raw.replace(/^[^\wÁÉÍÓÚÑáéíóúñü]+|[^\wÁÉÍÓÚÑáéíóúñü]+$/g,'');
 const pool=new Set();shuf(BANK.items.filter(x=>x.t===it.t&&x.id!==it.id)).slice(0,400).forEach(x=>x.q.split(/\s+/).forEach(y=>{y=y.replace(/^[^\wÁÉÍÓÚÑáéíóúñü]+|[^\wÁÉÍÓÚÑáéíóúñü]+$/g,'');const n=norm(y);if(n.length>=6&&!STOP.has(n)&&norm(word)!==n&&Math.abs(n.length-word.length)<4)pool.add(y.toLowerCase())}));
 const d=shuf([...pool]).slice(0,3);if(d.length<3)return mkMC(it);
 const q=w.map((x,j)=>j===i?x.replace(word,'_____'):x).join(' ');
 return{k:'fill',it,q,extra:'Respuesta: '+it.a,opts:shuf([word.toLowerCase(),...d]),ans:word.toLowerCase(),lbl:'Completa la palabra exacta'}}
function mkOrder(it){const w=it.a.split(/\s+/);if(w.length<3||w.length>9)return mkFill(it);return{k:'order',it,q:it.q,words:w,ans:it.a,lbl:'Ordena la respuesta'}}
function mkWrite(it){return{k:'write',it,q:it.q,ans:it.a,lbl:'Escríbela de memoria'}}
function mkCard(it){return{k:'card',it,q:it.q,ans:it.a,lbl:'Recuerdo activo · tarjeta'}}
function kindFor(it,mode){if(it.nf)return nfKind(it,mode);const b=st(it.id).b,r=Math.random();
 if(mode==='exam')return mkMC(it);
 if(mode==='cards')return mkCard(it);
 if(mode==='fast')return r<.6?mkMC(it):mkTF(it);
 if(mode==='mix')return r<.45?mkMC(it):r<.7?mkTF(it):mkFill(it);
 if(mode==='boss')return r<.35?mkMC(it):r<.6?mkFill(it):r<.8?mkOrder(it):mkWrite(it);
 if(b<=1)return r<.75?mkMC(it):mkTF(it);
 if(b===2)return r<.4?mkFill(it):r<.7?mkMC(it):mkCard(it);
 if(b===3)return r<.4?mkOrder(it):r<.7?mkFill(it):mkCard(it);
 return r<.45?mkWrite(it):r<.75?mkCard(it):mkOrder(it)}
/* Reactivos sin huecos (nf): solo opción múltiple, verdadero/falso de concepto o tarjeta completa; nunca completar, ordenar palabras ni escribir */
function nfKind(it,mode){const f=it.formato||'',r=Math.random();
 if(f==='tarjeta')return mode==='exam'?mkMC(it):mkCard(it);
 if(mode==='exam'||mode==='fast')return mkMC(it);
 if(mode==='cards')return mkCard(it);
 if((f==='que_es'||f==='def_concepto'||!f)&&r<.2)return mkTF(it);
 return r<.85?mkMC(it):mkCard(it)}
function lev(a,b){const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>[i]);for(let j=1;j<=n;j++)d[0][j]=j;
 for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n]}
function writeOK(u,a){u=norm(u).replace(/^(el|la|los|las|lo) /,'');a=norm(a).replace(/^(el|la|los|las|lo) /,'');if(!u)return false;
 return 1-lev(u,a)/Math.max(a.length,1)>=.8}
/* Intercalado: alterna materias para que no salgan dos seguidas de la misma */
function interleave(L){const g={};L.forEach(i=>(g[i.t]=g[i.t]||[]).push(i));const ks=shuf(Object.keys(g));const out=[];let k=0;
 while(out.length<L.length){const key=ks[k%ks.length];if(g[key].length)out.push(g[key].shift());k++;if(k>L.length*ks.length+10)break}return out}

/* ---------- Motor de sesiones ---------- */
let S=null;
function session(o){clearInterval(TIMER);S=Object.assign({i:0,ok:0,ko:0,combo:0,maxc:0,xp:0,log:[],lives:null,left:null,done:false,t0:Date.now()},o);
 S.queue=S.queue.slice();if(!S.queue.length&&!S.endless){toast('No hay preguntas para esta sesión');return}
 setChrome(true,o.title);if(S.total){S.left=S.total;TIMER=setInterval(tick,1000)}next()}
function tick(){S.left--;const e=$('#clk');if(e)e.textContent=fmt(S.left);if(S.left<=0){clearInterval(TIMER);finish()}}
const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function next(){if(S.done)return;
 if(S.lives!==null&&S.lives<=0)return finish();
 if(S.i>=S.queue.length){if(S.endless){S.queue=S.queue.concat(shuf(S.pool()));}else return finish()}
 const it=S.queue[S.i];S.cur=kindFor(it,S.mode);draw()}
function hud(){const p=S.endless?'':`${S.i+1}/${S.queue.length}`;const w=S.endless?0:pct(S.i,S.queue.length);
 return `${S.endless?'':`<div class="pbar"><i style="width:${w}%"></i></div>`}<div class="hud"><span>${p} ${S.lives!==null?'❤️'.repeat(Math.max(S.lives,0)):''}</span><span>${S.combo>1?'🔥 combo x'+S.combo:''}</span><span>${S.left!==null?'⏱ <b id="clk">'+fmt(S.left)+'</b> · ':''}✔ ${S.ok}</span></div>`}
function fuenteH(it){return it.fuente?`<span class="fuente">📖 Fuente: ${esc(it.fuente)}</span>`:''}
function draw(){const c=S.cur,it=c.it;const col=COL[it.t]||'var(--pri)';
 let h=hud()+`<div class="card"><span class="tag">${esc(c.lbl)}</span> <span class="tag" style="background:${col}22;color:${col}">${esc(it.s||it.t)}</span><div class="q">${esc(c.q)}</div>`;
 if(c.k==='tf')h+=`<div class="card info"><b>${esc(c.cand)}</b></div>`;
 if(c.k==='fill')h+=`<div class="muted">${esc(c.extra)}</div>`;
 if(c.k==='mc'||c.k==='tf'||c.k==='fill')h+=c.opts.map((o,i)=>`<button class="opt" data-i="${i}"><span class="lt">${'ABCD'[i]}</span><span>${esc(c.k==='mc'?cap(o):o)}</span></button>`).join('');
 if(c.k==='order'){c.pick=[];c.pool=shuf(c.words.map((w,i)=>({w,i})));h+=`<div class="words" id="dst"></div><div class="words" id="src" style="border-style:solid"></div><button class="btn" id="chk">Revisar</button>`}
 if(c.k==='write')h+=`<input type="text" id="wr" autocomplete="off" placeholder="Escribe la respuesta exacta"><div class="row" style="margin-top:8px"><button class="btn" id="chk">Revisar</button><button class="btn sec" id="idk">No me acuerdo</button></div>`;
 if(c.k==='card')h+=`<p class="muted">Responde en voz alta o mentalmente <b>antes</b> de voltear (recuerdo activo).</p><div class="flip" id="fl"><div class="in"><div class="fc">${esc(c.q)}</div><div class="fc back">${esc(it.a)}${it.fuente?`<span class="ref">📖 ${esc(it.fuente)}</span>`:''}</div></div></div>
 <button class="btn xl" id="show" style="margin-top:12px">Mostrar respuesta</button><div id="rt" class="hide"><p class="muted center" style="margin:10px 0 0">¿Qué tan bien la recordaste?</p><div class="rate">
 <button class="btn peligro" data-q="1">Otra vez<small>10 min</small></button><button class="btn coral" data-q="3">Difícil<small>${prevIv(it,3)}</small></button><button class="btn" data-q="4">Bien<small>${prevIv(it,4)}</small></button><button class="btn mint" data-q="5">Fácil<small>${prevIv(it,5)}</small></button></div></div>`;
 h+=`<div id="fb"></div></div>`;V.innerHTML=h;
 if(c.k==='order')drawOrder();
 if(c.k==='card'){const flip=()=>{$('#fl').classList.add('on');$('#show').classList.add('hide');$('#rt').classList.remove('hide')};$('#fl').onclick=flip;$('#show').onclick=flip;
  V.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>rateCard(+b.dataset.q))}
 V.querySelectorAll('.opt').forEach(b=>b.onclick=()=>answer(c.opts[b.dataset.i],b));
 const k=$('#chk');if(k)k.onclick=()=>answer(c.k==='order'?c.pick.map(x=>x.w).join(' '):$('#wr').value);
 const idk=$('#idk');if(idk)idk.onclick=()=>answer('');
 const wr=$('#wr');if(wr){wr.focus();wr.onkeydown=e=>{if(e.key==='Enter')answer(wr.value)}}}
function prevIv(it,q){const s=Object.assign({ef:2.5,rep:0,iv:0},P.it[it.id]);const rep=s.rep+1;const iv=rep===1?1:rep===2?6:Math.round((s.iv||1)*(s.ef||2.5));return iv+' d'}
function rateCard(q){const c=S.cur;if(c.answered)return;c.answered=true;const ok=q>=3;
 S.log.push({it:c.it,ok,k:'card'});if(ok){S.ok++;S.combo++;S.maxc=Math.max(S.maxc,S.combo)}else{S.ko++;S.combo=0;if(S.lives!==null)S.lives--}
 if(!S.noGrade)sm2(c.it,q);const g=ok?5+Math.min(S.combo,5):2;S.xp+=g;gainXP(g);S.i++;next()}
function drawOrder(){const c=S.cur;$('#dst').innerHTML=c.pick.map((x,j)=>`<button class="w" data-j="${j}">${esc(x.w)}</button>`).join('');
 $('#src').innerHTML=c.pool.map((x,j)=>`<button class="w pool" data-j="${j}">${esc(x.w)}</button>`).join('');
 $('#dst').querySelectorAll('button').forEach(b=>b.onclick=()=>{c.pool.push(c.pick.splice(b.dataset.j,1)[0]);drawOrder()});
 $('#src').querySelectorAll('button').forEach(b=>b.onclick=()=>{c.pick.push(c.pool.splice(b.dataset.j,1)[0]);drawOrder()})}
const OKS=['¡Exacto!','¡Eso es!','¡Literal, perfecto!','¡Muy bien, Capitán!','¡Así se asciende!'];
function answer(v,btn){const c=S.cur;if(c.answered)return;c.answered=true;
 let ok=c.k==='write'?writeOK(v,c.ans):c.k==='order'?norm(v)===norm(c.ans):v===c.ans;
 S.log.push({it:c.it,ok,given:v,k:c.k});let g;
 if(ok){S.ok++;S.combo++;S.maxc=Math.max(S.maxc,S.combo);g=10+Math.min(S.combo,10)*(S.mode==='fast'?2:1)}else{S.ko++;S.combo=0;g=2;if(S.lives!==null)S.lives--}
 S.xp+=g;P.cnt.maxc=Math.max(P.cnt.maxc||0,S.maxc);
 if(!S.noGrade)grade(c.it,ok);else{count(ok);save()}
 gainXP(g);checkReto();
 if(S.silent){S.i++;return next()}
 V.querySelectorAll('.opt').forEach(b=>{const o=c.opts[b.dataset.i];if(o===c.ans)b.classList.add('ok');else if(b===btn)b.classList.add('bad');b.disabled=true});
 const f=$('#fb');f.innerHTML=`<div class="fb ${ok?'ok pop':'no'}"><b>${ok?'✔ '+OKS[Math.random()*OKS.length|0]:'✘ Literal del manual:'}</b><br>${esc(c.it.a)}${fuenteH(c.it)}${c.k==='write'&&!ok&&v?'<br><span class="muted">Escribiste: '+esc(v)+'</span>':''}${c.it.exp?'<div class="exp">💡 '+esc(c.it.exp)+'</div>':''}</div>${!ok?difTabla(c.it):''}<button class="btn xl" id="nx" style="margin-top:10px">Siguiente ›</button><button class="btn sm sec" id="bad" style="margin-top:8px">🚩 Pregunta mala (ocultarla)</button>`;
 on('bad',()=>{P.bad=P.bad||{};P.bad[c.it.id]=1;save();prep();toast('Pregunta ocultada en este teléfono');$('#bad').disabled=true});
 const go=()=>{S.i++;next()};$('#nx').onclick=go;
 if(ok&&S.auto)setTimeout(()=>{if(S.cur===c)go()},650)}
function finish(){if(S.done)return;S.done=true;clearInterval(TIMER);const n=S.ok+S.ko,p=n?Math.round(S.ok*100/n):0;
 P.hist.push({d:Date.now(),m:S.title,ok:S.ok,n});P.hist=P.hist.slice(-200);HD().ses++;
 if(S.title==='Simulacro')P.cnt.sim++;
 const min=Math.round((Date.now()-S.t0)/60000);if(min>=1)HD().min+=min;
 if(S.bestKey&&S.ok>(P.best[S.bestKey]||0)){P.best[S.bestKey]=S.ok;S.rec=true}
 if(S.onEnd)S.onEnd(p);gainXP(n>=5?15:0);checkReto();save();if(p>=80&&n>=5)confeti();
 const errs=S.log.filter(x=>!x.ok);
 V.innerHTML=`<div class="card hero center"><div class="big">${p>=80?'🏅':p>=60?'👍':'💪'}</div><h1>${S.ok} de ${n} (${p}%)</h1>
 <p class="muted">+${S.xp+(n>=5?15:0)} XP · combo máximo ${S.maxc}${S.rec?' · ¡nuevo récord!':''} · ${min} min</p>${S.msg?'<p><b>'+esc(S.msg)+'</b></p>':''}</div>
 ${errs.length?`<div class="card"><h3>Repasa estos (literal)</h3>${errs.map(x=>`<p><span class="muted">${esc(x.it.q)}</span><br><b>${esc(x.it.a)}</b>${fuenteH(x.it)}</p>`).join('')}<p class="muted">Ya quedaron en tu cuaderno de errores y volverán por repetición espaciada.</p></div>`:''}
 <button class="btn xl" id="fin">Volver a Hoy</button>`;$('#fin').onclick=()=>{setChrome(false);location.hash='#inicio';render()}}

/* ---------- Pools ---------- */
function duePool(t){const now=Date.now();return items(t).filter(i=>{const s=P.it[i.id];return s&&s.due<=now})}
function newPool(t){return items(t).filter(i=>!P.it[i.id])}
function daily(t,n){const d=shuf(duePool(t)).sort((a,b)=>st(a.id).b-st(b.id).b);let q=d.slice(0,n);if(q.length<n)q=q.concat(shuf(newPool(t)).slice(0,n-q.length));
 if(q.length<n)q=q.concat(shuf(items(t)).filter(i=>!q.includes(i)).slice(0,n-q.length));return interleave(q)}
function errPool(){return BANK.items.filter(i=>{const s=P.it[i.id];return s&&s.ko>0&&s.b<=2})}
/* Sesión guiada: repaso vencido (60 %) + errores (20 %) + nuevas (20 %), intercaladas */
function guided(n){const used=new Set(),take=(L,k)=>{const o=[];for(const i of L){if(o.length>=k)break;if(!used.has(i.id)){used.add(i.id);o.push(i)}}return o};
 const due=take(shuf(duePool()).sort((a,b)=>st(a.id).b-st(b.id).b),Math.ceil(n*.6));const er=take(shuf(errPool()),Math.ceil(n*.2));
 let q=due.concat(er);q=q.concat(take(shuf(newPool()),n-q.length));if(q.length<n)q=q.concat(take(shuf(BANK.items),n-q.length));return interleave(q)}

/* ---------- Logros / retos ---------- */
const BADGES=[
 ['primera','🪖','Primera respuesta','Responde tu primera pregunta',()=>P.cnt.resp>=1],
 ['ok100','🎯','Cien aciertos','100 respuestas correctas',()=>P.cnt.ok>=100],
 ['ok500','🏹','Francotiradora','500 respuestas correctas',()=>P.cnt.ok>=500],
 ['ok2000','🦅','Élite','2,000 respuestas correctas',()=>P.cnt.ok>=2000],
 ['run5','⚡','En racha','Combo de 5 aciertos',()=>P.cnt.maxc>=5],
 ['run15','🔥','Imparable','Combo de 15 aciertos',()=>P.cnt.maxc>=15],
 ['dias3','📆','Arranque','3 días seguidos',()=>racha()>=3],
 ['dias7','📅','Constancia','7 días seguidos',()=>racha()>=7],
 ['dias30','🗓️','Disciplina militar','30 días seguidos',()=>racha()>=30],
 ['cards50','🃏','Memoria activa','50 tarjetas autoevaluadas',()=>P.cnt.cards>=50],
 ['pomo1','🍅','Primer pomodoro','Completa un pomodoro',()=>P.cnt.pomos>=1],
 ['pomo20','⏱️','Enfoque total','20 pomodoros',()=>P.cnt.pomos>=20],
 ['sim1','📝','Simulacro','Termina un simulacro',()=>P.cnt.sim>=1],
 ['dom','🏆','Dominio','Una materia al 80 %',()=>BANK&&topics().some(t=>mastery(items(t.id))>=.8)],
];
function checkBadges(){BADGES.forEach(([k,ic,n,,f])=>{if(!P.badges[k]){let ok=false;try{ok=f()}catch(e){}if(ok){P.badges[k]=today();setTimeout(()=>{toast(ic+' Insignia: '+n);confeti(60)},700)}}})}
const RETOS=[['🚀','Completa la sesión guiada de hoy','ses',1],['🔥','Logra 15 aciertos hoy','ok',15],['🎯','Responde 30 preguntas','resp',30],['🃏','Autoevalúa 10 tarjetas','cards',10],['⏱️','Estudia 25 minutos (un pomodoro)','min',25],['✅','Acierta 25 preguntas','ok',25]];
const reto=()=>RETOS[Math.floor(Date.parse(today())/DAY)%RETOS.length];
const retoP=()=>{const r=reto();return Math.min(1,(HD()[r[2]]||0)/r[3])};
function checkReto(){if(P.retos[today()]||retoP()<1)return;P.retos[today()]=1;setTimeout(()=>{toast(reto()[0]+' ¡Reto del día cumplido! +25 XP');confeti(90)},400);gainXP(25)}

/* ---------- Efectos ---------- */
function confeti(n=120){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;let cv=document.getElementById('confetti');if(!cv){cv=document.createElement('canvas');cv.id='confetti';cv.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:90';document.body.appendChild(cv)}
 const W=cv.width=innerWidth,H=cv.height=innerHeight,ctx=cv.getContext('2d');const cols=['#5b4bf5','#8b5cf6','#ff7a5c','#22c39a','#ffc83d','#3fb6f0'];const Pp=[];
 for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=3+Math.random()*7;Pp.push({x:W/2,y:H*.35,vx:Math.cos(a)*v,vy:Math.sin(a)*v-4,r:3+Math.random()*4,c:cols[i%cols.length],l:0})}
 cv._P=(cv._P||[]).concat(Pp);if(cv._run)return;cv._run=true;
 (function f(){ctx.clearRect(0,0,W,H);cv._P=cv._P.filter(p=>p.l<110&&p.y<H+20);cv._P.forEach(p=>{p.l++;p.vy+=.22;p.x+=p.vx;p.y+=p.vy;ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,p.r,p.r*1.6)});if(cv._P.length)requestAnimationFrame(f);else{cv._run=false;ctx.clearRect(0,0,W,H)}})()}
function ring(p,s=72,c='var(--pri)'){const r=s/2-7,C=2*Math.PI*r;p=Math.max(0,Math.min(1,p));return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="var(--verde-cl)" stroke-width="8"/><circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C*p} ${C}" transform="rotate(-90 ${s/2} ${s/2})"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="${s/4.2}" font-weight="800" fill="currentColor">${Math.round(p*100)}%</text></svg>`}
const barra=(p,c)=>`<div class="bar"><i style="width:${Math.round(p*100)}%;${c?'background:'+c:''}"></i></div>`;

/* ---------- Pomodoro ---------- */
function pomoStart(m){const p=P.pomo;const dur=(m==='work'?p.work:m==='short'?p.short:p.long)*60000;P.pomoRun={m,ini:Date.now(),fin:Date.now()+dur};save();
 if('Notification' in window&&Notification.permission==='default')try{Notification.requestPermission()}catch(e){}pomoTick();render()}
function pomoStop(){const r=P.pomoRun;if(r&&r.m==='work'){const min=Math.round((Date.now()-r.ini)/60000);if(min>=1){HD().min+=min;gainXP(min);toast(`Se registraron ${min} min`)}}P.pomoRun=null;save();render()}
function avisar(t){toast(t);try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}if('Notification' in window&&Notification.permission==='granted')try{new Notification('Promoción 2026',{body:t})}catch(e){}}
function pomoTick(){clearInterval(POMO);POMO=setInterval(()=>{const r=P.pomoRun,bar=$('#pomoBar');
 if(!r){bar.style.display='none';clearInterval(POMO);return}const left=r.fin-Date.now();bar.style.display='block';
 bar.textContent=`${r.m==='work'?'⏱ Concentración':'☕ Descanso'} · ${fmt(Math.max(0,Math.ceil(left/1000)))}`;const t=$('#tmr');if(t)t.textContent=fmt(Math.max(0,Math.ceil(left/1000)));
 if(left<=0){const p=P.pomo;if(r.m==='work'){HD().min+=p.work;gainXP(p.work);p.count++;P.cnt.pomos++;const lg=p.count%p.every===0;P.pomoRun={m:lg?'long':'short',ini:Date.now(),fin:Date.now()+(lg?p.long:p.short)*60000};avisar(lg?'¡Pomodoro completo! Descanso largo.':'¡Pomodoro completo! Toma un descanso.');checkReto();checkBadges()}
  else{P.pomoRun=null;avisar('Fin del descanso. ¿Listo el siguiente pomodoro?')}save();if(location.hash==='#pomodoro')render()}},1000)}

/* ---------- Navegación ---------- */
function hdr(){$('#hdrFl span').textContent=racha();$('#hdrXP').textContent=P.xp+' XP · '+rankOf(P.xp).name;$('#hdrDark').textContent=P.dark?'☀️':'🌙'}
function tema(){document.documentElement.classList.toggle('dark',!!P.dark);const m=document.querySelector('meta[name=theme-color]');if(m)m.content=P.dark?'#14122b':'#f6f4ff';hdr()}
$('#hdrDark').onclick=()=>{P.dark=!P.dark;save();tema()};
$('#pomoBar').onclick=()=>location.hash='#pomodoro';
function setChrome(inS,t){document.body.classList.toggle('ses',inS);$('#back').classList.toggle('hidden',!inS);$('#nav').style.display=inS?'none':'';$('#ttl').textContent=t||'Promoción 2026'}
$('#back').onclick=()=>{if(S&&!S.done){if(!confirm('¿Salir de la sesión? Lo respondido sí se guarda.'))return;S.done=true;clearInterval(TIMER)}setChrome(false);render()};
const VW={};
function render(){clearInterval(TIMER);if(S&&!S.done){S.done=true}setChrome(false);
 const h=(location.hash||'#inicio').slice(1);const[r,...a]=h.split('/');
 const tab={cuadros:'inicio',cuadro:'inicio',lectura:'inicio',leer:'inicio',semaforo:'logros',inicio:'inicio',camino:'camino',materia:'camino',tema:'camino',practicar:'practicar',simulacro:'practicar',errores:'practicar',logros:'logros'}[r]||'mas';
 document.querySelectorAll('#nav a').forEach(x=>x.classList.toggle('on',x.dataset.r===tab));
 if(!BANK&&!['mas','pomodoro','tecnicas'].includes(r)){noBank();hdr();return}
 (VW[r]||VW.inicio)(...a.map(decodeURIComponent));hdr();scrollTo(0,0)}
window.addEventListener('hashchange',render);
function on(id,f){const e=$('#'+id);if(e)e.onclick=f}

function noBank(){V.innerHTML=`<div class="card hero center"><div class="big">🔒</div><h1>Importa tu banco privado</h1>
<p class="muted">Esta app se publica <b>vacía</b>. Para estudiar, importa el archivo <b>banco_privado.json</b>. Se guarda solo en este teléfono.</p></div>
<label class="btn xl">Importar banco (.json)<input type="file" id="imp" accept=".json,application/json" hidden></label>
<a class="card info" href="#tecnicas" style="margin-top:14px"><b>🧠 ¿Cómo estudia esta app?</b><div class="muted">Repetición espaciada, recuerdo activo, intercalado, pomodoro y más.</div></a>`;$('#imp').onchange=importBank}
function importBank(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onerror=()=>alert('No se pudo leer el archivo.');r.onload=async()=>{let b;
 try{b=JSON.parse(String(r.result).replace(/^\uFEFF/,''))}catch(x){alert('El archivo no es JSON válido ('+x.message+'). Verifica que sea banco_privado.json completo.');return}
 if(b&&Array.isArray(b.temas)&&b.temas.length&&b.temas[0].parrafos){try{await idbSet(KL,b)}catch(x){alert('No hay espacio para guardar las lecturas ('+(x&&x.name||x)+').');return}LEC=b;toast(`Lecturas: ${b.temas.length} temas importados`);location.hash='#lectura';render();return}
 if(!b||!Array.isArray(b.items)||!b.items.length){alert('El archivo no es un banco válido (no tiene preguntas).');return}
 if(!Array.isArray(b.temas)){const m={};b.items.forEach(i=>m[i.t]=(m[i.t]||0)+1);b.temas=Object.keys(m).map(k=>({id:k,n:k,count:m[k]}))}
 b.items=b.items.filter(i=>i&&i.id&&i.q&&i.a!=null);
 const old=BANK&&BANK.v||0;if(BANK&&(b.v||0)<old&&!confirm(`Este banco (v${b.v||1}) es más antiguo que el que tienes (v${old}). ¿Reemplazarlo de todos modos?`))return;
 try{await idbSet(KB,b);localStorage.removeItem(KB)}catch(x){try{localStorage.removeItem(KB);localStorage.setItem(KB,JSON.stringify(b))}catch(y){alert('No hay espacio para guardar el banco en este teléfono ('+(y&&y.name||y)+'). Abre la app en Safari normal (no en modo privado).');return}}
 BANK=b;prep();const keep=b.items.filter(i=>P.it[i.id]).length;toast(`Banco v${b.v||1}: ${b.items.length} preguntas · tu avance se conserva (${keep} ya estudiadas)`);location.hash='#inicio';try{tema()}catch(_){}render()};r.readAsText(f)}

const saludo=()=>{const h=new Date().getHours();return h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches'};
const FR=['Lo que repasas hoy es lo que recuerdas el día del examen.','Pocos minutos, todos los días: así se asciende.','Constancia le gana a la memoria de última hora.','Recordar cuesta; por eso funciona.','Sin prisa y sin pausa, Capitán.'];
function heat(){let x='';for(let i=27;i>=0;i--){const d=ymd(new Date(Date.now()-i*DAY)),h=P.hd[d],n=h?h.resp+h.min:0;x+=`<i class="${n>=60?'l3':n>=25?'l2':n>0?'l1':''}" title="${d}: ${n}"></i>`}return `<div class="heat">${x}</div>`}

/* ---------- Portada v2.4 (foto solo en este teléfono: IndexedDB p26_foto) ---------- */
const EXAMEN=new Date(2027,3,12),INI_PREP=new Date(2026,10,4);let FOTO=null;
const FRM=['Disciplina hoy, orgullo familiar en abril.','Cada pregunta de hoy es una estrella más en el hombro.','El uniforme se honra estudiando también.','Cuidar es mi vocación; ascender, mi compromiso.','La constancia es el arma más fiel de un soldado.','Lo que repasas hoy es lo que recuerdas el día del examen.','Ellas me ven estudiar: que vean también el ascenso.','Firme en la guardia, firme en el estudio.','Sin prisa y sin pausa, Capitán.','Una página más hoy es un día menos de duda en abril.'];
const frase=()=>FRM[Math.floor(Date.parse(today())/DAY)%FRM.length];
function diasExamen(){const h=new Date();h.setHours(0,0,0,0);return Math.max(0,Math.round((EXAMEN-h)/DAY))}
function avanceTiempo(){return Math.max(0,Math.min(1,(Date.now()-INI_PREP)/(EXAMEN-INI_PREP)))}
const ESTR=n=>'<span class="estr">'+'★'.repeat(n)+'</span>';
function portada(){const d=diasExamen(),sem=Math.floor(d/7),p=avanceTiempo(),v=P.portada||'a',done=HD().ses;
 const R=58,C=2*Math.PI*R,anillo=`<svg class="pt-ring" viewBox="0 0 140 140"><defs><linearGradient id="pg" x1="0" x2="1"><stop offset="0" stop-color="#ffc83d"/><stop offset="1" stop-color="#ff7a5c"/></linearGradient></defs><circle cx="70" cy="70" r="${R}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="10"/><circle cx="70" cy="70" r="${R}" fill="none" stroke="url(#pg)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C*Math.max(.02,p)} ${C}" transform="rotate(-90 70 70)"/></svg>`;
 const grado=`<div class="pt-grado"><div><small>Hoy</small><b>Cap. 2/o.</b>${ESTR(2)}</div><i>➜</i><div class="meta"><small>12 abr 2027</small><b>Cap. 1/o.</b>${ESTR(3)}</div></div>`;
 const foto=FOTO?`<img src="${FOTO}" alt="">`:`<span class="pt-add">📷<br>Agrega tu foto<br><small>Por quiénes luchas</small></span>`;
 const btn=`<button class="btn go ${done?'done':''}" id="g-go">${done?'✔ Sesión de hoy hecha · otra ronda':'▶ Empezar sesión guiada'}</button>`;
 const fecha=`${saludo()} · ${new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'})}`;
 if(v==='b')return `<div class="card hero pt pt-b"><div class="kick">${fecha}</div>
  <div class="pt-top"><div class="pt-cd">${anillo}<div class="pt-num"><b>${d}</b><span>días</span></div></div>
  <label class="pt-pola" id="pt-foto">${foto}<input type="file" accept="image/*" hidden id="pt-in"><em>Por quiénes lucho</em></label></div>
  <div class="pt-sub">para el examen · ${sem} semanas · ${Math.round(p*100)} % del camino recorrido</div>
  <blockquote class="pt-fr">“${frase()}”</blockquote>${grado}${btn}</div>`;
 return `<div class="card hero pt pt-a${FOTO?' con':''}"><label class="pt-bg" id="pt-foto">${FOTO?`<img src="${FOTO}" alt="">`:''}<input type="file" accept="image/*" hidden id="pt-in"></label><div class="pt-veil"></div>
  <div class="pt-in"><div class="row"><div class="kick grow">${fecha}</div><label class="pt-chip" for="pt-in">Por quiénes lucho ${FOTO?'✎':'📷'}</label></div>
  <div class="pt-big"><div class="pt-cd sm">${anillo}<div class="pt-num"><b>${Math.round(p*100)}%</b><span>recorrido</span></div></div><div><div class="pt-dias">${d}</div><div class="pt-lbl">días para el examen<br><small>12 de abril de 2027 · ${sem} semanas</small></div></div></div>
  <blockquote class="pt-fr">“${frase()}”</blockquote>${grado}${btn}</div></div>`}
function portadaEv(){const i=$('#pt-in');if(!i)return;i.onchange=e=>{const f=e.target.files[0];if(!f)return;const im=new Image();im.onload=async()=>{const k=Math.min(1,900/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);const u=c.toDataURL('image/jpeg',.82);URL.revokeObjectURL(im.src);try{await idbSet('p26_foto',u);FOTO=u;toast('Foto guardada solo en este teléfono');render()}catch(x){alert('No se pudo guardar la foto.')}};im.src=URL.createObjectURL(f)}}
VW.inicio=()=>{const n=P.goal,dn=HD().resp,rk=rankOf(P.xp),due=duePool().length,er=errPool().length,nw=newPool().length,r=reto(),meta=P.goal*10,xh=P.xpd[today()]||0;
 V.innerHTML=`${portada()}
 ${(()=>{const r=nextRead();return r?`<a class="card info" href="#leer/${r.id}"><b>📖 Primero lee (${Math.max(1,Math.round(r.chars/1200))} min)</b><div class="muted">${esc(r.titulo.slice(0,80))}${P.lastRead&&P.lastRead.id===r.id?' · retomar':''}</div></a>`:LEC?'':`<a class="card info" href="#lectura"><b>📖 Lectura antes de practicar</b><div class="muted">Importa lecturas_privado.json</div></a>`})()}
 <div class="grid2"><a class="btn blk" href="#cuadros">🗂️ Mis cuadros<small>Fichas, mnemotecnias y quiz</small></a><a class="btn sec blk" href="#lectura">📖 Lectura<small>${LEC?lecPct(lecTemas())+' % leído':'Texto literal'}</small></a></div>
 <div class="grid3" style="margin-top:10px"><div class="stat"><b>${due}</b><span>por repasar</span></div><div class="stat"><b>${er}</b><span>errores</span></div><div class="stat"><b>${nw}</b><span>nuevas</span></div></div>
 <a class="card" href="#logros" style="margin-top:14px"><div class="xpbox">${ring(xh/meta,64,'var(--coral)')}<div class="grow"><b>Meta diaria: ${xh}/${meta} XP</b><div class="muted">🎖️ ${rk.name} · ${P.xp} XP · faltan ${rk.next-P.xp} para ${rk.nextName}</div>${barra((P.xp-rk.prev)/(rk.next-rk.prev))}</div></div></a>
 <div class="card"><div class="row"><span style="font-size:1.5rem">${r[0]}</span><div class="grow"><b>Reto del día</b><div class="muted">${r[1]}${P.retos[today()]?' · ✔ cumplido':''}</div></div></div>${barra(retoP(),'var(--grad-c)')}</div>
 <div class="grid2"><button class="btn mint blk" id="g-cards">🃏 Tarjetas<small>Recuerdo activo + autoevaluación</small></button><button class="btn coral blk" id="g-pomo">🍅 Pomodoro<small>${P.pomoRun?'En curso':P.pomo.work+' min de enfoque'}</small></button></div>
 <div class="card" style="margin-top:14px"><b>Constancia · últimas 4 semanas</b> <span class="muted">🔥 ${racha()} días seguidos</span>${heat()}</div>`;
 portadaEv();on('g-go',()=>session({title:'Sesión guiada',queue:guided(n),mode:'leitner',onEnd:()=>{}}));
 on('g-cards',()=>{const q=daily(null,20);session({title:'Tarjetas',queue:q,mode:'cards'})});on('g-pomo',()=>location.hash='#pomodoro')};
function ttList(t){if(BANK.temario&&BANK.temario.length){return BANK.temario.filter(x=>x.t===t).map(x=>({id:x.id,n:x.tema,bib:x.bib,L:byTT(x.id)}))}
 const g={};items(t).forEach(i=>(g[i.s]=g[i.s]||[]).push(i));return Object.keys(g).map(s=>({id:'s:'+s,n:s,L:g[s]}))}
VW.camino=()=>{V.innerHTML=`<div class="card hl"><h1>Camino</h1><div class="muted">Avance por materia y por tema del temario. El dominio sube cuando aciertas en días distintos (repetición espaciada).</div></div>`+
 topics().map(t=>{const L=items(t.id),m=mastery(L),c=COL[t.id]||'var(--pri)',d=duePool(t.id).length;return `<a class="card" href="#materia/${t.id}"><div class="row"><span class="tag" style="background:${c}22;color:${c}">${t.id}</span><b class="grow">${esc(t.n)}</b><span class="muted">${Math.round(m*100)}%</span></div><div class="mini" style="margin:4px 0 6px">${L.length} preguntas · ${d} por repasar · ${ttList(t.id).length} temas</div>${barra(m,c)}</a>`}).join('')}
function levels(t){const L=items(t),out=[];for(let i=0;i<L.length;i+=15)out.push(L.slice(i,i+15));return out}
VW.materia=(t)=>{const T=BANK.temas.find(x=>x.id===t);if(!T)return VW.camino();const c=COL[t]||'var(--pri)',tl=ttList(t);
 V.innerHTML=`<div class="card hl"><a href="#camino" class="muted">‹ Camino</a><h1>${esc(T.n)}</h1><div class="row"><button class="btn sm" id="m-rep">Repaso espaciado</button><button class="btn sm mint" id="m-crd">Tarjetas</button><button class="btn sm coral" id="m-boss">👑 Jefe</button></div></div>
 <div class="card"><h3>Temas del temario</h3>${tl.map(x=>{const m=mastery(x.L);return `<div class="tt-row" data-tt="${esc(x.id)}"><div class="grow"><div style="font-weight:700;font-size:.92rem">${esc(x.n)}</div><div class="mini">${x.L.length} preguntas${x.bib?' · '+esc(x.bib):''}</div>${barra(m,c)}</div><span class="muted">${x.L.length?Math.round(m*100)+'%':'—'}</span></div>`}).join('')}</div>
 <div class="card"><h3>Niveles</h3><div class="muted">15 preguntas cada uno. ⭐ con 80 % abre el siguiente.</div>${(()=>{let unl=true;return levels(t).map((L,i)=>{const k=t+':'+i,ok=P.lv[k],open=unl;unl=unl&&!!ok;return `<button class="btn ${ok?'':'sec'} blk" data-l="${i}" ${open?'':'disabled style="opacity:.45"'}>${ok?'⭐':open?'▶️':'🔒'} Nivel ${i+1}</button>`}).join('')})()}</div>`;
 V.querySelectorAll('[data-tt]').forEach(b=>b.onclick=()=>location.hash='#tema/'+encodeURIComponent(b.dataset.tt));
 on('m-rep',()=>session({title:T.n+' · Repaso',queue:daily(t,P.goal),mode:'leitner'}));
 on('m-crd',()=>session({title:T.n+' · Tarjetas',queue:daily(t,20),mode:'cards'}));
 on('m-boss',()=>session({title:'👑 Jefe: '+T.n,queue:shuf(items(t)).slice(0,20),mode:'boss',lives:3,onEnd:()=>{if(S.lives>0){P.lv[t+':boss']=1;S.msg='👑 ¡Venciste al jefe!'}else S.msg='El jefe ganó esta vez. Repasa errores y vuelve.'}}));
 V.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const i=+b.dataset.l;session({title:`${T.n} · Nivel ${i+1}`,queue:shuf(levels(t)[i]),mode:'mix',onEnd:p=>{if(p>=80){P.lv[t+':'+i]=1;S.msg='⭐ ¡Nivel superado!'}else S.msg='Necesitas 80 % para la estrella. ¡Otra vez!'}})})};
VW.tema=(tt)=>{const L=byTT(tt);const x=(BANK.temario||[]).find(y=>y.id===tt);const name=x?x.tema:tt.replace(/^s:/,'');const t=x?x.t:(L[0]&&L[0].t);
 const due=L.filter(i=>P.it[i.id]&&P.it[i.id].due<=Date.now()).length,nw=L.filter(i=>!P.it[i.id]).length;
 V.innerHTML=`<div class="card hl"><a href="#materia/${t}" class="muted">‹ Materia</a><h2>${esc(name)}</h2>${x&&x.bib?`<div class="muted">${esc(x.bib)}</div>`:''}<div class="xpbox" style="margin-top:10px">${ring(mastery(L),70)}<div class="muted">${L.length} preguntas<br>${due} por repasar · ${nw} nuevas</div></div></div>
 ${L.length?`<button class="btn xl" id="t-rep">🔁 Repaso espaciado (15)</button><button class="btn xl mint" id="t-crd" style="margin-top:10px">🃏 Tarjetas de recuerdo activo</button><button class="btn xl sec" id="t-wr" style="margin-top:10px">✍️ Escribir de memoria</button>`:'<div class="card info">Este tema aún no tiene preguntas en tu banco.</div>'}`;
 const q=()=>{const d=shuf(L.filter(i=>P.it[i.id]&&P.it[i.id].due<=Date.now()));return d.concat(shuf(L.filter(i=>!d.includes(i)))).slice(0,15)};
 on('t-rep',()=>session({title:name,queue:q(),mode:'leitner'}));on('t-crd',()=>session({title:name,queue:q(),mode:'cards'}));
 on('t-wr',()=>{const z=q();session({title:name+' · escribir',queue:z,mode:'boss'})})};
VW.practicar=()=>{V.innerHTML=`<div class="card hl"><h1>Practicar</h1><div class="muted">Elige un modo. Todo cuenta para tu repetición espaciada.</div></div>
 <button class="btn xl blk" id="p-day">📅 Repaso del día<small>${duePool().length} vencidas + nuevas · intercaladas</small></button>
 <div class="grid2" style="margin-top:10px">
 <button class="btn mint blk" id="p-cards">🃏 Tarjetas<small>Voltea y autoevalúa (SM-2)</small></button>
 <button class="btn blk" id="p-5">⏱️ Mini 5 min<small>Lo que alcances</small></button>
 <button class="btn coral blk" id="p-fast">⚡ Relámpago<small>60 s · récord ${P.best.fast||0}</small></button>
 <button class="btn coral blk" id="p-surv">❤️ Supervivencia<small>3 vidas · récord ${P.best.surv||0}</small></button>
 <button class="btn sec blk" id="p-err">📕 Errores<small>${errPool().length} por reforzar</small></button>
 <button class="btn sec blk" id="p-sim">📝 Simulacro<small>Formato examen</small></button></div>`;
 on('p-day',()=>session({title:'Repaso del día',queue:daily(null,P.goal),mode:'leitner'}));
 on('p-cards',()=>session({title:'Tarjetas',queue:daily(null,20),mode:'cards'}));
 on('p-5',()=>session({title:'Mini 5 minutos',queue:daily(null,30),pool:()=>daily(null,30),endless:true,total:300,mode:'leitner'}));
 on('p-fast',()=>session({title:'Relámpago',queue:shuf(BANK.items),pool:()=>shuf(BANK.items),endless:true,total:60,mode:'fast',auto:true,bestKey:'fast'}));
 on('p-surv',()=>session({title:'Supervivencia',queue:shuf(BANK.items),pool:()=>shuf(BANK.items),endless:true,lives:3,mode:'mix',bestKey:'surv'}));
 on('p-err',()=>location.hash='#errores');on('p-sim',()=>location.hash='#simulacro')};
VW.simulacro=()=>{V.innerHTML=`<div class="card hl"><a href="#practicar" class="muted">‹ Practicar</a><h1>📝 Simulacro</h1><p class="muted">Como el examen real: opción múltiple, sin ver la respuesta hasta el final y con reloj.</p>
<label class="lb">Materia</label><select id="sm-t"><option value="">Todas (mezcla)</option>${topics().map(t=>`<option value="${t.id}">${esc(t.n)}</option>`).join('')}</select>
<label class="lb">Número de preguntas</label><input type="number" id="sm-n" value="50" min="10" max="200">
<label class="lb">Minutos</label><input type="number" id="sm-m" value="50" min="5" max="240">
<button class="btn xl" id="sm-go" style="margin-top:14px">Comenzar simulacro</button></div>
<div class="card"><h3>Historial</h3>${P.hist.filter(h=>h.m==='Simulacro').slice(-8).reverse().map(h=>`<div class="task"><span class="grow">${new Date(h.d).toLocaleDateString('es-MX')}</span><b>${h.ok}/${h.n} (${Math.round(h.ok*100/Math.max(h.n,1))}%)</b></div>`).join('')||'<p class="muted">Aún no hay simulacros.</p>'}</div>`;
 on('sm-go',()=>{const t=$('#sm-t').value||null,n=+$('#sm-n').value||50,m=+$('#sm-m').value||50;session({title:'Simulacro',queue:t?shuf(items(t)).slice(0,n):interleave(shuf(BANK.items).slice(0,n)),mode:'exam',silent:true,total:m*60})})};
VW.errores=()=>{const L=errPool().sort((a,b)=>st(b.id).ko-st(a.id).ko);
 V.innerHTML=`<div class="card hl"><a href="#practicar" class="muted">‹ Practicar</a><h1>📕 Cuaderno de errores</h1><div class="muted">Preguntas que has fallado y aún no dominas. Salen de aquí cuando las aciertas varias veces en días distintos.</div>
 ${L.length?'<button class="btn" id="pe" style="margin-top:10px">Practicar 20 errores</button>':''}</div>`+
 (L.length?L.slice(0,150).map(i=>`<div class="card"><span class="tag">✘ ${st(i.id).ko}</span> <span class="tag">${esc(i.s||i.t)}</span><p>${esc(i.q)}</p><b>${esc(i.a)}</b>${fuenteH(i)}</div>`).join(''):'<div class="card center">🎉 Sin errores pendientes.</div>');
 on('pe',()=>session({title:'Cuaderno de errores',queue:shuf(L).slice(0,20),mode:'leitner'}))};
VW.logros=()=>{const rk=rankOf(P.xp),xh=P.xpd[today()]||0,meta=P.goal*10;let w=0;for(let i=0;i<7;i++)w+=P.xpd[ymd(new Date(Date.now()-i*DAY))]||0;
 V.innerHTML=`<div class="card hero"><div class="xpbox">${ring((P.xp-rk.prev)/(rk.next-rk.prev),76,'#fff')}<div><h2 style="margin:0">🎖️ ${rk.name}</h2><div class="muted">${P.xp} XP · faltan ${rk.next-P.xp} para ${rk.nextName}</div></div></div></div>
 <div class="grid3"><div class="stat"><b>${racha()}</b><span>días seguidos</span></div><div class="stat"><b>${xh}</b><span>XP hoy / ${meta}</span></div><div class="stat"><b>${w}</b><span>XP 7 días</span></div></div>
 <div class="grid3" style="margin-top:10px"><div class="stat"><b>${P.cnt.resp}</b><span>respuestas</span></div><div class="stat"><b>${pct(P.cnt.ok,P.cnt.resp)}%</b><span>aciertos</span></div><div class="stat"><b>${P.cnt.pomos}</b><span>pomodoros</span></div></div>
 <div class="card" style="margin-top:14px"><h3>Insignias (${Object.keys(P.badges).length}/${BADGES.length})</h3><div class="badges">${BADGES.map(([k,ic,nm,d])=>`<div class="badge ${P.badges[k]?'on':'off'}"><span class="ic" style="background:var(--sup2)">${ic}</span><b>${esc(nm)}</b><br><span class="muted">${esc(d)}</span></div>`).join('')}</div></div>
 <a class="card" href="#semaforo"><b>🚦 Semáforo por tema</b><div class="muted">Qué temas están en rojo, amarillo o verde</div></a><div class="card"><h3>Dominio por materia</h3>${topics().map(t=>{const m=mastery(items(t.id));return `<div class="row" style="margin-top:8px"><span class="grow">${esc(t.n)}</span><span class="muted">${Math.round(m*100)}%</span></div>${barra(m,COL[t.id])}`}).join('')}</div>
 <div class="card"><p class="muted">XP: acierto +10 (más bono de combo) · fallo +2 · tarjeta +5 · minuto de pomodoro +1 · sesión completa +15 · reto del día +25.</p></div>`};
VW.pomodoro=()=>{const p=P.pomo,r=P.pomoRun;const today_p=P.cnt.pomos;
 V.innerHTML=`<div class="card hl center"><h1>🍅 Pomodoro</h1><span class="tag">${r?(r.m==='work'?'Concentración':'Descanso'):'Listo'}</span>
 <div class="timer" id="tmr">${r?fmt(Math.max(0,Math.ceil((r.fin-Date.now())/1000))):fmt(p.work*60)}</div>
 <div class="muted">Ciclo ${p.count%p.every}/${p.every} · ${today_p} pomodoros en total · hoy ${HD().min} min</div>
 <div class="row" style="justify-content:center;margin-top:12px">${r?`<button class="btn peligro" id="ps">■ Detener</button>${r.m!=='work'?'<button class="btn sec" id="pw">Saltar descanso</button>':''}`:`<button class="btn" id="pw">▶ Enfoque ${p.work} min</button><button class="btn sec" id="psh">Descanso ${p.short}</button><button class="btn sec" id="pl">Largo ${p.long}</button>`}</div></div>
 <div class="card"><h3>Ajustes</h3><div class="grid3"><div><label class="lb">Enfoque</label><input type="number" id="pa" value="${p.work}" min="5" max="90"></div><div><label class="lb">Descanso</label><input type="number" id="pb" value="${p.short}" min="1" max="30"></div><div><label class="lb">Largo</label><input type="number" id="pc" value="${p.long}" min="5" max="60"></div></div>
 <p class="muted">Trabaja con el teléfono en «Practicar» durante el enfoque; en el descanso, levántate. Cada ${p.every} pomodoros toca descanso largo. Cada minuto suma 1 XP.</p></div>`;
 on('pw',()=>pomoStart('work'));on('psh',()=>pomoStart('short'));on('pl',()=>pomoStart('long'));on('ps',pomoStop);
 ['pa','pb','pc'].forEach((id,i)=>$('#'+id).onchange=e=>{P.pomo[['work','short','long'][i]]=Math.max(1,+e.target.value||1);save()})};
VW.tecnicas=()=>{V.innerHTML=`<div class="card hl"><a href="#mas" class="muted">‹ Más</a><h1>🧠 Cómo estudia esta app</h1></div>
 ${[['🔁','Repetición espaciada','Cada pregunta tiene su propio calendario: si la aciertas vuelve en 1, 3, 7 y 15 días; si fallas, vuelve mañana. Las tarjetas usan el algoritmo SM-2 según qué tan fácil la recordaste.'],
 ['🧠','Recuerdo activo','En las tarjetas primero respondes de memoria y luego volteas. Recordar sin ver las opciones fija mejor que releer.'],
 ['🔀','Intercalado','La sesión guiada y el repaso mezclan materias para que no salgan dos seguidas iguales; así entrenas a distinguir temas, como en el examen.'],
 ['📈','Dificultad progresiva','Al principio ves opción múltiple; conforme dominas una pregunta pasas a completar, ordenar y escribir de memoria.'],
 ['🍅','Pomodoro','Bloques de enfoque de 25 min con descansos de 5 y uno largo cada 4.'],
 ['📕','Cuaderno de errores','Lo que fallas se repasa primero, con la respuesta literal y su fuente.'],
 ['📝','Práctica tipo examen','Simulacros con reloj y calificación al final.'],
 ['🎖️','Motivación','XP, grados, racha, meta diaria, reto del día e insignias.']].map(([i,t,d])=>`<div class="card"><h3>${i} ${t}</h3><div class="muted">${d}</div></div>`).join('')}`};
VW.mas=()=>{V.innerHTML=`<div class="card hl"><h1>Más</h1></div>
 <a class="card" href="#pomodoro"><b>🍅 Pomodoro</b><div class="muted">Temporizador de enfoque</div></a>
 <a class="card" href="#lectura"><b>📖 Lectura</b><div class="muted">Manuales y leyes, textual</div></a><a class="card" href="#cuadros"><b>🗂️ Mis cuadros</b><div class="muted">Aspectos Administrativos</div></a><a class="card" href="#semaforo"><b>🚦 Semáforo por tema</b></a>
 <a class="card" href="#tecnicas"><b>🧠 Técnicas de estudio</b><div class="muted">Cómo funciona la app</div></a>
 <div class="card"><h3>Banco de preguntas</h3><p class="muted">${BANK?`${BANK.items.length} preguntas activas (${(BANK._all||BANK.items).length-BANK.items.length} ocultas) · versión ${BANK.v||1} · ${esc(BANK.titulo||'')}`:'No hay banco cargado.'}</p>
 <p class="muted">Lecturas: ${LEC?LEC.temas.length+' temas':'no importadas'} · usa el mismo botón para importar lecturas_privado.json.</p><label class="btn">${BANK?'Reemplazar':'Importar'} banco o lecturas (.json)<input type="file" id="imp" accept=".json,application/json" hidden></label>
 ${BANK?' <button class="btn sec" id="delb">Quitar banco de este teléfono</button>':''}</div>
 <div class="card"><h3>Portada</h3><div class="row"><select id="portSel"><option value="a" ${(P.portada||'a')==='a'?'selected':''}>Póster con mi foto</option><option value="b" ${P.portada==='b'?'selected':''}>Cuenta regresiva + polaroid</option></select>${FOTO?'<button class="btn sm sec" id="fotoDel">Quitar foto</button>':''}</div><div class="muted">Tu foto se guarda solo en este teléfono; nunca se sube.</div></div><div class="card"><h3>Meta diaria</h3><div class="row"><input type="number" id="goal" value="${P.goal}" min="5" max="200" style="width:110px"><span class="muted">preguntas por sesión guiada · meta = ${P.goal*10} XP/día</span></div></div>
 <div class="card"><h3>Respaldo de tu avance</h3><p class="muted">Tu avance (no las preguntas) se guarda solo en este teléfono.</p>
 <div class="row"><button class="btn sec" id="exp">Descargar respaldo</button><label class="btn sec">Restaurar<input type="file" id="impp" accept=".json" hidden></label><button class="btn peligro" id="rst">Borrar avance</button></div></div>
 <p class="muted center">Promoción 2026 · v2.4 · Los datos no salen de tu teléfono.</p>`;
 $('#imp').onchange=importBank;{const ps=$('#portSel');if(ps)ps.onchange=e=>{P.portada=e.target.value;save();toast('Portada cambiada')};const fd=$('#fotoDel');if(fd)fd.onclick=async()=>{if(!confirm('¿Quitar la foto de la portada de este teléfono?'))return;try{await idbSet('p26_foto',null)}catch(e){}FOTO=null;render()}}$('#goal').onchange=e=>{P.goal=Math.max(5,+e.target.value||20);save();toast('Meta guardada')};
 on('delb',()=>{if(confirm('¿Quitar el banco de este teléfono? Tu avance se conserva.')){localStorage.removeItem(KB);idbDel(KB);BANK=null;render()}});
 on('exp',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(P)],{type:'application/json'}));a.download='avance_promocion_'+today()+'.json';a.click()});
 $('#impp').onchange=e=>{const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.it)throw 0;localStorage.setItem(KP,JSON.stringify(x));load();tema();toast('Avance restaurado')}catch(_){alert('Archivo no válido')}};r.readAsText(e.target.files[0])};
 on('rst',()=>{if(confirm('¿Borrar todo tu avance?')){localStorage.removeItem(KP);load();tema();toast('Avance borrado');render()}})};
load();prep();tema();if(P.pomoRun)pomoTick();render();
if(!BANK&&window.indexedDB)idbGet(KB).then(b=>{if(b&&b.items){BANK=b;prep();tema();render()}}).catch(()=>{});

/* ---------- v2.3: Mis cuadros, tabla de diferencias, semáforo, Lectura ---------- */
const famOf=id=>(BANK&&BANK.cuadros||[]).find(f=>f.id===id);
function difTabla(it){const f=it.fam&&famOf(it.fam);if(!f)return'';return `<div class="card info" style="margin-top:10px"><b>📊 Diferencias · ${esc(f.titulo)}</b> <span class="muted">(${f.cuantos})</span>${f.mnemotecnia?`<div class="muted">🧠 ${esc(f.mnemotecnia)}</div>`:''}<table class="tb">${f.conceptos.map(x=>`<tr${x.concepto===it.a?' class="hi"':''}><td><b>${esc(x.concepto)}</b></td><td>${esc(x.clave)}</td></tr>`).join('')}</table></div>`}
const semaf=m=>m>=.75?'🟢':m>=.4?'🟡':'🔴';
VW.cuadros=()=>{const F=BANK.cuadros||[];V.innerHTML=`<div class="card hl"><a href="#inicio" class="muted">‹ Hoy</a><h1>🗂️ Mis cuadros</h1><div class="muted">Estudia por cuadro: fichas → mnemotecnia y diferencias → quiz de ese cuadro.</div></div>`+
 (F.length?F.map(f=>{const L=BANK.items.filter(i=>i.fam===f.id),m=mastery(L);return `<a class="card" href="#cuadro/${f.id}"><div class="row"><span>${L.length?semaf(m):'⚪'}</span><b class="grow">${esc(f.titulo)}</b><span class="muted">${f.cuantos} · ${Math.round(m*100)}%</span></div><div class="mini">Cap. ${esc(f.cap)}${f.mnemotecnia?' · 🧠 '+esc(f.mnemotecnia):''}</div></a>`}).join(''):'<div class="card">Tu banco no trae cuadros. Importa el banco v9.</div>')};
VW.cuadro=(id)=>{const f=famOf(id);if(!f)return VW.cuadros();const L=BANK.items.filter(i=>i.fam===f.id);
 V.innerHTML=`<div class="card hl"><a href="#cuadros" class="muted">‹ Mis cuadros</a><h2>${esc(f.titulo)}</h2><div class="muted">Cap. ${esc(f.cap)} · ¿Cuántos son? <b>${f.cuantos}</b></div>${f.mnemotecnia?`<div class="card info" style="margin-top:8px">🧠 <b>${esc(f.mnemotecnia)}</b></div>`:''}</div>
 <div class="card"><h3>1 · Fichas</h3><p class="muted">Lee la definición, di el concepto en voz alta y toca para voltear.</p>${f.conceptos.map((x,i)=>`<div class="flip fl2" data-i="${i}"><div class="in"><div class="fc">${hl(esc(x.definicion),[x.clave])}</div><div class="fc back"><b>${esc(x.concepto)}</b><span class="ref">🔑 ${esc(x.clave)} · ${esc(x.fuente.split('), ').pop())}</span></div></div></div>`).join('')}</div>
 <div class="card"><h3>2 · Diferencias entre hermanos</h3><table class="tb">${f.conceptos.map(x=>`<tr><td><b>${esc(x.concepto)}</b></td><td>${esc(x.clave)}</td></tr>`).join('')}</table></div>
 <button class="btn xl" id="c-q">3 · Quiz de este cuadro (${L.length})</button><button class="btn xl mint" id="c-c" style="margin-top:10px">🃏 Tarjetas de este cuadro</button>`;
 V.querySelectorAll('.fl2').forEach(e=>e.onclick=()=>e.classList.toggle('on'));
 on('c-q',()=>session({title:f.titulo,queue:shuf(L),mode:'leitner'}));on('c-c',()=>session({title:f.titulo+' · tarjetas',queue:shuf(L),mode:'cards'}))};
VW.semaforo=()=>{V.innerHTML=`<div class="card hl"><a href="#logros" class="muted">‹ Logros</a><h1>🚦 Semáforo por tema</h1><div class="muted">🔴 menos de 40 % · 🟡 40–74 % · 🟢 75 % o más de dominio. ⚪ sin preguntas.</div></div>`+
 topics().map(t=>`<div class="card"><h3>${esc(t.n)}</h3>${ttList(t.id).map(x=>{const m=mastery(x.L);return `<a class="task" href="#tema/${encodeURIComponent(x.id)}"><span>${x.L.length?semaf(m):'⚪'}</span><span class="grow">${esc(x.n)}</span><b>${x.L.length?Math.round(m*100)+'%':'—'}</b></a>`}).join('')}</div>`).join('')};
/* Lectura */
const KWS=()=>{if(KWS.c)return KWS.c;const w=new Set();(BANK&&BANK.cuadros||[]).forEach(f=>f.conceptos.forEach(x=>{w.add(x.clave);if(x.concepto.includes(' ')&&x.concepto.length>12)w.add(x.concepto)}));KWS.c=[...w].filter(x=>x&&x.length>=8&&/\s/.test(x)&&!/[¿?…()]/.test(x)).sort((a,b)=>b.length-a.length);return KWS.c};
function hl(h,extra){const ks=(extra||[]).concat(KWS()).filter(Boolean);if(!ks.length)return h;const re=new RegExp('(?<![\\wáéíóúñÁÉÍÓÚÑ])('+ks.slice(0,600).map(k=>esc(k).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![\\wáéíóúñÁÉÍÓÚÑ])','gi');return h.replace(re,'<mark>$1</mark>')}
const lecTemas=()=>LEC?LEC.temas:[];
const ttName=tt=>{const x=(BANK&&BANK.temario||[]).find(y=>y.id===tt);return x?x.tema:null};
function lecPct(L){return L.length?Math.round(L.filter(x=>P.read&&P.read[x.id]).length*100/L.length):0}
function nextRead(){const L=lecTemas();if(!L.length)return null;if(P.lastRead&&!P.read?.[P.lastRead.id]){const x=L.find(y=>y.id===P.lastRead.id);if(x)return x}
 return L.find(x=>x.tt&&!(P.read||{})[x.id])||L.find(x=>!(P.read||{})[x.id])}
VW.lectura=(q)=>{P.read=P.read||{};const L=lecTemas();
 if(!L.length){V.innerHTML=`<div class="card hl"><h1>📖 Lectura</h1><p class="muted">Importa <b>lecturas_privado.json</b> (texto literal de manuales y leyes). Se guarda solo en este teléfono.</p><label class="btn xl">Importar lecturas (.json)<input type="file" id="imp" accept=".json" hidden></label></div>`;$('#imp').onchange=importBank;return}
 const qq=q?norm(q):'';const nr=nextRead();
 const grp={};L.forEach(x=>{if(qq&&!norm(x.titulo+' '+x.doc+' '+x.parrafos.map(p=>p.txt).join(' ')).includes(qq))return;const k=x.t;(grp[k]=grp[k]||{});const g=x.tt?(ttName(x.tt)||x.doc):x.doc;(grp[k][g]=grp[k][g]||[]).push(x)});
 V.innerHTML=`<div class="card hl"><h1>📖 Lectura</h1><div class="muted">Texto literal de tus manuales y leyes. Lee antes de practicar: ${lecPct(L)} % leído en total.</div>
 <input type="search" id="lq" placeholder="Buscar en las lecturas…" value="${esc(q||'')}" style="margin-top:10px">${nr?`<a class="btn xl" href="#leer/${nr.id}" style="margin-top:10px">▶ ${P.lastRead&&P.lastRead.id===nr.id?'Retomar':'Seguir con'}: ${esc(nr.titulo.slice(0,60))}</a>`:''}</div>`+
 topics().filter(t=>grp[t.id]).map(t=>{const all=L.filter(x=>x.t===t.id);return `<details class="card" ${qq?'open':''}><summary><b>${esc(t.n)}</b> <span class="muted">${lecPct(all)} % leído</span></summary>${Object.entries(grp[t.id]).map(([g,X])=>`<div style="margin-top:10px"><b>${esc(g)}</b> <span class="muted">${lecPct(X)} %</span>${barra(lecPct(X)/100,COL[t.id])}${X.map(x=>`<a class="task" href="#leer/${x.id}"><span>${P.read[x.id]?'✅':'⬜'}</span><span class="grow">${esc(x.titulo)}</span><span class="mini">${Math.max(1,Math.round(x.chars/1200))} min</span></a>`).join('')}</div>`).join('')}</details>`}).join('');
 $('#lq').onchange=e=>location.hash='#lectura/'+encodeURIComponent(e.target.value)};
function lecItems(x){if(x.tt){const L=byTT(x.tt);if(L.length)return L}
 const txt=norm(x.parrafos.map(p=>p.txt).join(' '));return BANK.items.filter(i=>i.t===x.t&&String(i.a).length>3&&txt.includes(norm(i.a))).slice(0,40)}
VW.leer=(id)=>{P.read=P.read||{};P.fs=P.fs||1;const L=lecTemas(),x=L.find(y=>y.id===id);if(!x)return VW.lectura();const k=L.indexOf(x),nx=L[k+1];
 P.lastRead={id,y:(P.lastRead&&P.lastRead.id===id)?P.lastRead.y:0};save();const Q=lecItems(x);
 V.innerHTML=`<div class="card hl"><a href="#lectura" class="muted">‹ Lectura</a><h2>${esc(x.titulo)}</h2><div class="muted">${esc(x.fuente)}${x.tt?' · Tema: '+esc(ttName(x.tt)||x.tt):''}</div>
 <div class="row" style="margin-top:8px"><button class="btn sm sec" id="fm">A−</button><button class="btn sm sec" id="fp">A+</button><span class="muted">🟨 palabra clave</span></div></div>
 <div class="card lec" style="font-size:${P.fs}rem">${x.parrafos.map(p=>`<p>${p.ref?`<span class="tag">${esc(p.ref)}</span> `:''}${hl(esc(p.txt))}</p>`).join('')}</div>
 <label class="card row"><input type="checkbox" id="rd" ${P.read[id]?'checked':''} style="width:auto"> <b>Ya lo leí</b></label>
 <button class="btn xl" id="pr">🎯 Practicar este tema (${Q.length})</button>${nx?`<a class="btn xl sec" href="#leer/${nx.id}" style="margin-top:10px">Siguiente lectura ›</a>`:''}`;
 setTimeout(()=>scrollTo(0,P.lastRead.y||0),30);
 window.onscroll=()=>{if(location.hash==='#leer/'+id){P.lastRead.y=scrollY;clearTimeout(VW._t);VW._t=setTimeout(save,400)}};
 const fs=d=>{P.fs=Math.min(1.8,Math.max(.8,P.fs+d));save();$('.lec').style.fontSize=P.fs+'rem'};on('fm',()=>fs(-.1));on('fp',()=>fs(.1));
 $('#rd').onchange=e=>{if(e.target.checked){P.read[id]=Date.now();gainXP(5)}else delete P.read[id];save()};
 on('pr',()=>{P.read[id]=P.read[id]||Date.now();save();if(!Q.length)return toast('Este tema aún no tiene preguntas');const cards=shuf(Q).slice(0,8);
  session({title:x.titulo.slice(0,40)+' · fichas',queue:cards,mode:'cards',onEnd:()=>{S.msg='Ahora el quiz del tema 👇';setTimeout(()=>session({title:x.titulo.slice(0,40)+' · quiz',queue:shuf(Q).slice(0,15),mode:'leitner'}),1800)}})})};
if(window.indexedDB)idbGet(KL).then(b=>{if(b&&b.temas){LEC=b;if(/inicio|lectura|leer/.test(location.hash||'#inicio'))render()}}).catch(()=>{});

if(window.indexedDB)idbGet('p26_foto').then(u=>{if(u){FOTO=u;if(/inicio/.test(location.hash||'#inicio'))render()}}).catch(()=>{});
