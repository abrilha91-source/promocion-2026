'use strict';
/* Promoción 2026 · App de estudio. El banco de preguntas NO viene incluido: se importa en el dispositivo y vive solo en localStorage. */
const $=s=>document.querySelector(s),V=$('#v');
const KB='p26_bank',KP='p26_prog',DAY=864e5,INT=[0,0,1,3,7,15];
let BANK=null,P=null,TIMER=null;
const RANKS=['Cadete','Subteniente','Teniente','Cap. 2/o.','Cap. 1/o.','Mayor','Tte. Cor.','Coronel','Gral. Brig.','Gral. Brigada','Gral. Div.'];
const STOP=new Set('el la los las un una unos unas de del al a en y o u que se su sus por para con sin es son lo le les como más mas este esta estos estas ese esa cual cuál cuando donde dónde qué quien quién ha han ser será sean está están entre sobre todo toda todos todas otro otra otros otras dicha dichas dicho cada mismo misma muy tanto'.split(' '));
function load(){try{BANK=JSON.parse(localStorage.getItem(KB))}catch(e){BANK=null}
 try{P=JSON.parse(localStorage.getItem(KP))}catch(e){P=null}
 P=Object.assign({it:{},xp:0,st:{n:0,last:''},day:{d:'',n:0},goal:20,hist:[],lv:{},best:{}},P||{})}
function save(){localStorage.setItem(KP,JSON.stringify(P))}
const today=()=>new Date().toLocaleDateString('sv');
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9ñ ]/g,' ').replace(/\s+/g,' ').trim();
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cap=s=>{s=s.toLowerCase();return s.charAt(0).toUpperCase()+s.slice(1)};
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
const topics=()=>BANK?BANK.temas.filter(t=>BANK.items.some(i=>i.t===t.id)):[];
const items=t=>BANK.items.filter(i=>!t||i.t===t);
const st=id=>P.it[id]||{b:0,due:0,ok:0,ko:0};
function rankOf(xp){const l=Math.floor(Math.sqrt(xp/60));return{l,name:RANKS[Math.min(l,RANKS.length-1)],next:Math.pow(l+1,2)*60,prev:l*l*60}}
function bump(){const d=today();if(P.day.d!==d){P.day={d,n:0}}P.day.n++;
 if(P.st.last!==d){const y=new Date(Date.now()-DAY).toLocaleDateString('sv');P.st.n=(P.st.last===y?P.st.n:0)+1;P.st.last=d}}
function grade(it,ok){const s=Object.assign({b:0,due:0,ok:0,ko:0},P.it[it.id]);
 if(ok){s.ok++;s.b=Math.min(5,s.b+1)}else{s.ko++;s.b=1}
 s.due=Date.now()+INT[s.b]*DAY-36e5;s.last=Date.now();P.it[it.id]=s;bump();save()}
function mastery(t){const L=items(t);if(!L.length)return 0;return L.reduce((a,i)=>a+Math.min(st(i.id).b,4),0)/(L.length*4)}

/* ---------- Generadores de reactivos ---------- */
function distract(it,n=3){const a=norm(it.a),out=[],used=new Set([a]);
 const pools=[shuf(BANK.items.filter(x=>x.s===it.s)),shuf(BANK.items.filter(x=>x.t===it.t)),shuf(BANK.items)];
 for(const pool of pools)for(const x of pool){const k=norm(x.a);if(out.length>=n)break;if(used.has(k)||k.includes(a)||a.includes(k)||[...used].some(u=>1-lev(u,k)/Math.max(u.length,k.length,1)>.7))continue;used.add(k);out.push(x.a)}
 return out}
function mkMC(it){let d=(it.d||[]).filter(x=>norm(x)!==norm(it.a)).slice(0,3);if(d.length<3)d=d.concat(distract(it,3-d.length).filter(x=>!d.includes(x)));return{k:'mc',it,q:it.q,opts:shuf([it.a,...d]),ans:it.a,lbl:'Opción múltiple'}}
function mkTF(it){const t=Math.random()<.5,cand=t?it.a:(distract(it,1)[0]||it.a);return{k:'tf',it,q:it.q,cand,opts:['Verdadero','Falso'],ans:(t||cand===it.a)?'Verdadero':'Falso',lbl:'Verdadero o falso'}}
function mkFill(it){const w=it.q.split(/\s+/),c=[];w.forEach((x,i)=>{const n=norm(x);if(n.length>=6&&!STOP.has(n)&&!/\d/.test(n))c.push(i)});
 if(!c.length)return mkMC(it);const i=c[Math.random()*c.length|0],raw=w[i],word=raw.replace(/^[^\wÁÉÍÓÚÑáéíóúñü]+|[^\wÁÉÍÓÚÑáéíóúñü]+$/g,'');
 const pool=new Set();shuf(BANK.items.filter(x=>x.t===it.t&&x.id!==it.id)).forEach(x=>x.q.split(/\s+/).forEach(y=>{y=y.replace(/^[^\wÁÉÍÓÚÑáéíóúñü]+|[^\wÁÉÍÓÚÑáéíóúñü]+$/g,'');const n=norm(y);if(n.length>=6&&!STOP.has(n)&&norm(word)!==n&&Math.abs(n.length-word.length)<4)pool.add(y.toLowerCase())}));
 const d=shuf([...pool]).slice(0,3);if(d.length<3)return mkMC(it);
 const q=w.map((x,j)=>j===i?x.replace(word,'_____'):x).join(' ');
 return{k:'fill',it,q,extra:'Respuesta: '+it.a,opts:shuf([word.toLowerCase(),...d]),ans:word.toLowerCase(),lbl:'Completa la palabra exacta'}}
function mkOrder(it){const w=it.a.split(/\s+/);if(w.length<3||w.length>9)return mkFill(it);return{k:'order',it,q:it.q,words:w,ans:it.a,lbl:'Ordena la respuesta'}}
function mkWrite(it){return{k:'write',it,q:it.q,ans:it.a,lbl:'Escríbela de memoria'}}
function kindFor(it,mode){const b=st(it.id).b,r=Math.random();
 if(mode==='exam')return mkMC(it);
 if(mode==='fast')return r<.6?mkMC(it):mkTF(it);
 if(mode==='mix')return r<.45?mkMC(it):r<.7?mkTF(it):mkFill(it);
 if(b<=1)return r<.75?mkMC(it):mkTF(it);
 if(b===2)return r<.4?mkFill(it):r<.7?mkMC(it):mkTF(it);
 if(b===3)return r<.5?mkOrder(it):mkFill(it);
 return r<.6?mkWrite(it):mkOrder(it)}
function lev(a,b){const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>[i]);for(let j=1;j<=n;j++)d[0][j]=j;
 for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n]}
function writeOK(u,a){u=norm(u).replace(/^(el|la|los|las|lo) /,'');a=norm(a).replace(/^(el|la|los|las|lo) /,'');if(!u)return false;
 return 1-lev(u,a)/Math.max(a.length,1)>=.8}

/* ---------- Motor de sesiones ---------- */
let S=null;
function session(o){clearInterval(TIMER);S=Object.assign({i:0,ok:0,ko:0,combo:0,maxc:0,xp:0,log:[],lives:null,left:null,done:false},o);
 S.queue=S.queue.slice();setChrome(true,o.title);if(S.total){S.left=S.total;TIMER=setInterval(tick,1000)}next()}
function tick(){S.left--;const e=$('#clk');if(e)e.textContent=fmt(S.left);if(S.left<=0){clearInterval(TIMER);finish()}}
const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function next(){if(S.done)return;
 if(S.lives!==null&&S.lives<=0)return finish();
 if(S.i>=S.queue.length){if(S.endless){S.queue=S.queue.concat(shuf(S.pool()));}else return finish()}
 const it=S.queue[S.i];S.cur=kindFor(it,S.mode);render()}
function hud(){const p=S.endless?'':`${S.i+1}/${S.queue.length}`;
 return `<div class="hud"><span>${p} ${S.lives!==null?'❤️'.repeat(Math.max(S.lives,0)):''}</span><span>${S.combo>1?'🔥x'+S.combo:''}</span><span>${S.left!==null?'⏱ <b id="clk">'+fmt(S.left)+'</b>':''} ✔ ${S.ok}</span></div>`}
function render(){const c=S.cur,it=c.it;let h=hud()+`<div class="card"><span class="chip">${esc(c.lbl)}</span><span class="chip">${esc(it.s)}</span><div class="q">${esc(c.q)}</div>`;
 if(c.k==='tf')h+=`<div class="card" style="background:#faf8f2"><b>${esc(c.cand)}</b></div>`;
 if(c.k==='fill')h+=`<div class="muted">${esc(c.extra)}</div>`;
 if(c.k==='mc'||c.k==='tf'||c.k==='fill')h+=c.opts.map((o,i)=>`<button class="opt" data-i="${i}">${esc(c.k==='mc'?cap(o):o)}</button>`).join('');
 if(c.k==='order'){c.pick=[];c.pool=shuf(c.words.map((w,i)=>({w,i})));h+=`<div class="words" id="dst"></div><div class="words" id="src" style="border-style:solid"></div><button class="btn" id="chk">Revisar</button>`}
 if(c.k==='write')h+=`<input type="text" id="wr" autocomplete="off" placeholder="Escribe la respuesta exacta"><button class="btn" id="chk">Revisar</button><button class="btn alt" id="idk">No me acuerdo</button>`;
 h+=`<div id="fb"></div></div>`;V.innerHTML=h;
 if(c.k==='order')drawOrder();
 V.querySelectorAll('.opt').forEach(b=>b.onclick=()=>answer(c.opts[b.dataset.i],b));
 const k=$('#chk');if(k)k.onclick=()=>answer(c.k==='order'?c.pick.map(x=>x.w).join(' '):$('#wr').value);
 const idk=$('#idk');if(idk)idk.onclick=()=>answer('');
 const wr=$('#wr');if(wr){wr.focus();wr.onkeydown=e=>{if(e.key==='Enter')answer(wr.value)}}}
function drawOrder(){const c=S.cur;$('#dst').innerHTML=c.pick.map((x,j)=>`<button class="w" data-j="${j}">${esc(x.w)}</button>`).join('');
 $('#src').innerHTML=c.pool.map((x,j)=>`<button class="w pool" data-j="${j}">${esc(x.w)}</button>`).join('');
 $('#dst').querySelectorAll('button').forEach(b=>b.onclick=()=>{c.pool.push(c.pick.splice(b.dataset.j,1)[0]);drawOrder()});
 $('#src').querySelectorAll('button').forEach(b=>b.onclick=()=>{c.pick.push(c.pool.splice(b.dataset.j,1)[0]);drawOrder()})}
function answer(v,btn){const c=S.cur;if(c.answered)return;c.answered=true;
 let ok=c.k==='write'?writeOK(v,c.ans):c.k==='order'?norm(v)===norm(c.ans):v===c.ans;
 S.log.push({it:c.it,ok,given:v,k:c.k});
 if(ok){S.ok++;S.combo++;S.maxc=Math.max(S.maxc,S.combo);const g=10+Math.min(S.combo,10)*(S.mode==='fast'?2:1);S.xp+=g}else{S.ko++;S.combo=0;if(S.lives!==null)S.lives--}
 if(!S.noGrade)grade(c.it,ok);
 if(S.silent){S.i++;return next()}
 V.querySelectorAll('.opt').forEach(b=>{const o=c.opts[b.dataset.i];if(o===c.ans)b.classList.add('ok');else if(b===btn)b.classList.add('no');b.disabled=true});
 const f=$('#fb');f.innerHTML=`<div class="fb ${ok?'ok pop':'no'}">${ok?'✔ ¡Exacto!':'✘ Literal del manual:'}<br><b>${esc(c.it.a)}</b>${c.it.fuente?'<br><span class="muted" style="font-size:.85em">📖 Fuente: '+esc(c.it.fuente)+'</span>':''}${c.k==='write'&&!ok&&v?'<br><span class="muted">Escribiste: '+esc(v)+'</span>':''}</div><button class="btn" id="nx">Siguiente ›</button>`;
 const go=()=>{S.i++;next()};$('#nx').onclick=go;
 if(ok&&S.auto)setTimeout(()=>{if(S.cur===c)go()},650)}
function finish(){if(S.done)return;S.done=true;clearInterval(TIMER);const n=S.ok+S.ko,pct=n?Math.round(S.ok*100/n):0;
 P.xp+=S.xp;P.hist.push({d:Date.now(),m:S.title,ok:S.ok,n});P.hist=P.hist.slice(-200);
 if(S.bestKey&&S.ok>(P.best[S.bestKey]||0)){P.best[S.bestKey]=S.ok;S.rec=true}
 if(S.onEnd)S.onEnd(pct);save();
 const errs=S.log.filter(x=>!x.ok);
 V.innerHTML=`<div class="card center"><div class="big">${pct>=80?'🏅':pct>=60?'👍':'💪'}</div><h2>${S.ok} de ${n} (${pct}%)</h2>
 <p class="muted">+${S.xp} XP · racha máxima ${S.maxc}${S.rec?' · ¡nuevo récord!':''}</p>${S.msg?'<p><b>'+S.msg+'</b></p>':''}</div>
 ${errs.length?`<div class="card"><h3>Repasa estos (literal)</h3>${errs.map(x=>`<p><span class="muted">${esc(x.it.q)}</span><br><b>${esc(x.it.a)}</b></p>`).join('')}</div>`:''}
 <button class="btn" id="fin">Volver al inicio</button>`;$('#fin').onclick=()=>go('home')}

/* ---------- Pools ---------- */
function duePool(t){const now=Date.now();return items(t).filter(i=>{const s=P.it[i.id];return s&&s.due<=now})}
function newPool(t){return items(t).filter(i=>!P.it[i.id])}
function daily(t,n){const d=shuf(duePool(t)).sort((a,b)=>st(a.id).b-st(b.id).b);let q=d.slice(0,n);if(q.length<n)q=q.concat(newPool(t).slice(0,n-q.length));
 if(q.length<n)q=q.concat(shuf(items(t)).filter(i=>!q.includes(i)).slice(0,n-q.length));return shuf(q)}
function errPool(){return BANK.items.filter(i=>{const s=P.it[i.id];return s&&s.ko>0&&s.b<=2})}

/* ---------- Vistas ---------- */
function setChrome(inS,t){$('#back').classList.toggle('hidden',!inS);$('#nav').classList.toggle('hidden',inS);$('#ttl').textContent=t||'Promoción 2026'}
$('#back').onclick=()=>{if(S&&!S.done&&confirm('¿Salir de la sesión? Lo respondido sí se guarda.')){S.done=true;clearInterval(TIMER);go('home')}else if(!S||S.done)go('home')};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>go(b.dataset.r));
function go(r,a){clearInterval(TIMER);setChrome(false);document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.r===r));
 if(!BANK&&r!=='ajustes')return noBank();({home,temas,errores,ajustes,tema,simulacro})[r](a);scrollTo(0,0)}
function noBank(){V.innerHTML=`<div class="card center"><div class="big">🔒</div><h2>Importa tu banco privado</h2>
<p>Esta app se publica <b>vacía</b>. Para estudiar, importa el archivo <b>banco_privado.json</b> que te entregaron por chat. Se guarda solo en este teléfono.</p>
<label class="btn gold center">Importar banco (.json)<input type="file" id="imp" accept=".json,application/json" hidden></label></div>`;$('#imp').onchange=importBank}
function importBank(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const b=JSON.parse(r.result);
 if(!b.items||!b.temas)throw 0;const old=BANK&&BANK.v||0;if(BANK&&(b.v||0)<old&&!confirm(`Este banco (v${b.v||1}) es más antiguo que el que tienes (v${old}). ¿Reemplazarlo de todos modos?`))return;
 localStorage.setItem(KB,JSON.stringify(b));BANK=b;const keep=b.items.filter(i=>P.it[i.id]).length;toast(`Banco v${b.v||1}: ${b.items.length} preguntas · tu avance se conserva (${keep} ya estudiadas)`);go('home')}catch(x){alert('El archivo no es un banco válido.')}};r.readAsText(f)}
function ring(p){const r=34,c=2*Math.PI*r;return `<svg class="ring" viewBox="0 0 84 84"><circle cx="42" cy="42" r="${r}" fill="none" stroke="#e6e1d3" stroke-width="9"/><circle cx="42" cy="42" r="${r}" fill="none" stroke="#d4af37" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c*Math.min(p,1)} ${c}" transform="rotate(-90 42 42)"/><text x="42" y="48" text-anchor="middle" font-size="18" font-weight="700" fill="#1f3b2d">${Math.round(Math.min(p,1)*100)}%</text></svg>`}
function home(){const d=P.day.d===today()?P.day.n:0,rk=rankOf(P.xp),due=duePool().length,er=errPool().length;
 V.innerHTML=`<div class="card row">${ring(d/P.goal)}<div class="grow"><b>Meta de hoy: ${d}/${P.goal}</b><div class="muted">🔥 Racha: ${P.st.last===today()||P.st.last===new Date(Date.now()-DAY).toLocaleDateString('sv')?P.st.n:0} días</div>
 <div class="muted">🎖️ ${rk.name} · ${P.xp} XP</div><div class="bar" style="margin-top:6px"><i style="width:${(P.xp-rk.prev)*100/(rk.next-rk.prev)}%"></i></div></div></div>
 <button class="btn gold" id="m-day">📅 Repaso del día<small>${due} pendientes por repetición espaciada + nuevas</small></button>
 <div class="grid">
 <button class="btn" id="m-5">⏱️ Mini 5 min<small>Lo que alcances en 5 minutos</small></button>
 <button class="btn" id="m-fast">⚡ Relámpago<small>60 s, combos x2 · récord ${P.best.fast||0}</small></button>
 <button class="btn" id="m-surv">❤️ Supervivencia<small>3 vidas · récord ${P.best.surv||0}</small></button>
 <button class="btn" id="m-err">📕 Errores<small>${er} por reforzar</small></button></div>
 <button class="btn alt" id="m-sim">📝 Simulacro de examen<small>Formato real: opción múltiple con tiempo, calificación al final</small></button>
 <div class="card"><b>Avance por materia</b>${topics().map(t=>`<div style="margin-top:10px" class="row"><span class="grow">${esc(t.n)}</span><span class="muted">${Math.round(mastery(t.id)*100)}%</span></div><div class="bar"><i style="width:${mastery(t.id)*100}%"></i></div>`).join('')}</div>`;
 $('#m-day').onclick=()=>session({title:'Repaso del día',queue:daily(null,P.goal),mode:'leitner'});
 $('#m-5').onclick=()=>session({title:'Mini 5 minutos',queue:daily(null,30),pool:()=>daily(null,30),endless:true,total:300,mode:'leitner'});
 $('#m-fast').onclick=()=>session({title:'Relámpago',queue:shuf(BANK.items),pool:()=>shuf(BANK.items),endless:true,total:60,mode:'fast',auto:true,bestKey:'fast'});
 $('#m-surv').onclick=()=>session({title:'Supervivencia',queue:shuf(BANK.items),pool:()=>shuf(BANK.items),endless:true,lives:3,mode:'mix',bestKey:'surv'});
 $('#m-err').onclick=()=>{const q=shuf(errPool()).slice(0,20);if(!q.length)return toast('No tienes errores pendientes 🎉');session({title:'Cuaderno de errores',queue:q,mode:'leitner'})};
 $('#m-sim').onclick=()=>go('simulacro')}
function levels(t){const L=items(t),out=[];for(let i=0;i<L.length;i+=15)out.push(L.slice(i,i+15));return out}
function temas(){V.innerHTML=topics().map(t=>{const lv=levels(t.id),done=lv.filter((_,i)=>P.lv[t.id+':'+i]).length;
 return `<button class="btn alt" data-t="${t.id}">${esc(t.n)}<small>${t.count||items(t.id).length} preguntas · ${done}/${lv.length} niveles ⭐ · dominio ${Math.round(mastery(t.id)*100)}%${P.lv[t.id+':boss']?' · 👑 jefe vencido':''}</small></button>`}).join('')+
 `<div class="card muted">Materias del temario sin preguntas en el banco: ${BANK.temas.filter(t=>!items(t.id).length).map(t=>esc(t.n)).join(', ')||'ninguna'}.</div>`;
 V.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>go('tema',b.dataset.t))}
function tema(t){const T=BANK.temas.find(x=>x.id===t),lv=levels(t);let unl=true;
 V.innerHTML=`<div class="card"><h2 style="margin:0">${esc(T.n)}</h2><div class="muted">Cada nivel: 15 preguntas. Gana ⭐ con 80% o más para abrir el siguiente.</div></div>`+
 lv.map((L,i)=>{const k=t+':'+i,ok=P.lv[k],open=unl;unl=unl&&!!ok;const subs=[...new Set(L.map(x=>x.s))].join(' · ');
  return `<button class="btn ${ok?'':'alt'}" data-l="${i}" ${open?'':'disabled style="opacity:.45"'}>${ok?'⭐':open?'▶️':'🔒'} Nivel ${i+1}<small>${esc(subs)}</small></button>`}).join('')+
 `<button class="btn gold" id="boss">👑 Ronda jefe de ${esc(T.n)}<small>20 preguntas mezcladas del tema · 3 vidas · incluye escribir de memoria</small></button>`;
 V.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const i=+b.dataset.l;session({title:`${T.n} · Nivel ${i+1}`,queue:shuf(lv[i]),mode:'mix',onEnd:p=>{if(p>=80){P.lv[t+':'+i]=1;S.msg='⭐ ¡Nivel superado!'}else S.msg='Necesitas 80% para la estrella. ¡Otra vez!'}})});
 $('#boss').onclick=()=>session({title:'👑 Jefe: '+T.n,queue:shuf(items(t)).slice(0,20),mode:'boss',lives:3,onEnd:p=>{if(S.lives>0){P.lv[t+':boss']=1;S.msg='👑 ¡Venciste al jefe!'}else S.msg='El jefe ganó esta vez. Repasa errores y vuelve.'}})}
const _kf=kindFor;kindFor=function(it,mode){if(mode==='boss'){const r=Math.random();return r<.35?mkMC(it):r<.6?mkFill(it):r<.8?mkOrder(it):mkWrite(it)}return _kf(it,mode)};
function simulacro(){V.innerHTML=`<div class="card"><h2 style="margin-top:0">📝 Simulacro</h2><p class="muted">Como el examen real: opción múltiple, sin ver la respuesta hasta el final y con reloj.</p>
<label>Materia</label><select id="sm-t"><option value="">Todas (mezcla)</option>${topics().map(t=>`<option value="${t.id}">${esc(t.n)}</option>`).join('')}</select>
<label style="display:block;margin-top:10px">Número de preguntas</label><input type="number" id="sm-n" value="50" min="10" max="200">
<label style="display:block;margin-top:10px">Minutos</label><input type="number" id="sm-m" value="50" min="5" max="240">
<button class="btn gold" id="sm-go" style="margin-top:14px">Comenzar simulacro</button></div>
<div class="card"><b>Historial</b>${P.hist.filter(h=>h.m==='Simulacro').slice(-8).reverse().map(h=>`<div class="row"><span class="grow">${new Date(h.d).toLocaleDateString('es-MX')}</span><b>${h.ok}/${h.n} (${Math.round(h.ok*100/Math.max(h.n,1))}%)</b></div>`).join('')||'<p class="muted">Aún no hay simulacros.</p>'}</div>`;
 $('#sm-go').onclick=()=>{const t=$('#sm-t').value||null,n=+$('#sm-n').value||50,m=+$('#sm-m').value||50;
  session({title:'Simulacro',queue:shuf(items(t)).slice(0,n),mode:'exam',silent:true,total:m*60})}}
function errores(){const L=errPool().sort((a,b)=>st(b.id).ko-st(a.id).ko);
 V.innerHTML=`<div class="card"><b>📕 Cuaderno de errores</b><div class="muted">Preguntas que has fallado y aún no dominas. Salen de aquí cuando las aciertas varias veces seguidas.</div>
 ${L.length?'<button class="btn" id="pe">Practicar 20 errores</button>':''}</div>`+
 (L.length?L.slice(0,150).map(i=>`<div class="card"><span class="chip">✘ ${st(i.id).ko}</span><span class="chip">${esc(i.s)}</span><p>${esc(i.q)}</p><b>${esc(i.a)}</b></div>`).join(''):'<div class="card center">🎉 Sin errores pendientes.</div>');
 const b=$('#pe');if(b)b.onclick=()=>session({title:'Cuaderno de errores',queue:shuf(L).slice(0,20),mode:'leitner'})}
function ajustes(){V.innerHTML=`<div class="card"><b>Banco de preguntas</b><p class="muted">${BANK?`${BANK.items.length} preguntas · versión ${BANK.v||1} · ${esc(BANK.titulo||'')}`:'No hay banco cargado.'}</p>
<label class="btn gold">${BANK?'Reemplazar':'Importar'} banco (.json)<input type="file" id="imp" accept=".json,application/json" hidden></label>
${BANK?'<button class="btn alt" id="delb">Quitar banco de este teléfono</button>':''}</div>
<div class="card"><b>Meta diaria</b><input type="number" id="goal" value="${P.goal}" min="5" max="200"></div>
<div class="card"><b>Respaldo de tu avance</b><p class="muted">Tu avance (no las preguntas) se guarda solo en este teléfono. Descarga un respaldo para pasarlo a otro dispositivo.</p>
<button class="btn alt" id="exp">Descargar respaldo de avance</button><label class="btn alt">Restaurar avance<input type="file" id="impp" accept=".json" hidden></label>
<button class="btn alt" id="rst">Borrar mi avance</button></div>
<p class="muted center">Promoción 2026 · v1.2 · Los datos no salen de tu teléfono.</p>`;
 $('#imp').onchange=importBank;$('#goal').onchange=e=>{P.goal=Math.max(5,+e.target.value||20);save();toast('Meta guardada')};
 const d=$('#delb');if(d)d.onclick=()=>{if(confirm('¿Quitar el banco de este teléfono? Tu avance se conserva.')){localStorage.removeItem(KB);BANK=null;go('ajustes')}};
 $('#exp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(P)],{type:'application/json'}));a.download='avance_promocion_'+today()+'.json';a.click()};
 $('#impp').onchange=e=>{const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.it)throw 0;P=x;save();toast('Avance restaurado')}catch(_){alert('Archivo no válido')}};r.readAsText(e.target.files[0])};
 $('#rst').onclick=()=>{if(confirm('¿Borrar todo tu avance?')){localStorage.removeItem(KP);load();toast('Avance borrado')}}}
load();go('home');
