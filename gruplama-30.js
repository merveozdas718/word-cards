/* Phrasal Cards — mevcut index.html icin grup eklentisi.
   Orijinal </script> etiketinden SONRA, </body> oncesinde yukleyin.
   Veriler ayni localStorage anahtarinda korunur. */
(() => {
'use strict';
const byId = id => document.getElementById(id);
const norm = x => String(x||'').trim().toLocaleLowerCase('tr');
const css = document.createElement('style');
css.textContent = `.group-pick{display:grid;gap:7px;margin:12px 0 16px}.group-pick label{font-size:14px;margin:0;font-weight:700;color:#403a9b}.group-pick select{width:100%;padding:12px;border:1px solid #c9c9d9;border-radius:11px;background:#fff;font:inherit}.group-hint{color:#666;font-size:13px;margin:0 0 10px}`;
document.head.appendChild(css);
let selectedStudy='all', selectedQuiz='', selectedList='all';
document.querySelector('#quizStart h2').textContent='30 Soruluk Grup Quizi';
byId('startQuiz').textContent='Grup Quizini Başlat';
byId('refreshQuiz').textContent='Grup Quizini Yenile';
byId('restart').textContent='Aynı Grupla Yeniden Quiz';
byId('refreshDuring').textContent='Grup Quizini Yenile';
document.querySelector('header p').textContent='Anlamca ve yazılışça benzer kelimelerle, 30 kelimelik gruplar halinde çalış.';
const categoryName = {PV:'Phrasal Verbs', V:'Fiiller', ADJ:'Sıfatlar', N:'İsimler', ADV:'Zarflar', EXP:'İfadeler', Other:'Diğer Kelimeler'};
function groups(){
 const groupsMap = new Map();
 cards.forEach(c=>{let id=c.quizGroup||'UNGROUPED'; if(!groupsMap.has(id))groupsMap.set(id,{id,name:id==='UNGROUPED'?'Henüz gruplandırılmamış':`${categoryName[c.category]||c.category||'Kelimeler'} · Grup ${Number(id.split('-').at(-1))||id}`,n:0});groupsMap.get(id).n++});
 return [...groupsMap.values()].sort((a,b)=>{
  const cats=['PV','V','ADJ','N','ADV','EXP','Other'];
  const ia=cats.indexOf(a.id.split('-')[0]),ib=cats.indexOf(b.id.split('-')[0]);
  return (ia<0?99:ia)-(ib<0?99:ib) || a.id.localeCompare(b.id,undefined,{numeric:true});
 });
}
function groupCards(id){return id==='all'?cards:cards.filter(c=>(c.quizGroup||'UNGROUPED')===id)}
function control(where, label, allAllowed, onChange){
 const root=document.createElement('div');root.className='group-pick';const lab=document.createElement('label');lab.textContent=label;const select=document.createElement('select');root.append(lab,select);where.prepend(root);
 select.onchange=()=>onChange(select.value);
 return (wanted)=>{const gs=groups();const options=(allAllowed?[{id:'all',name:'Tüm gruplar',n:cards.length}]:[]).concat(gs);select.replaceChildren(...options.map(g=>{const o=document.createElement('option');o.value=g.id;o.textContent=`${g.name} (${g.n} kelime)`;return o}));if(!options.some(g=>g.id===wanted))wanted=options[0]?.id||'';select.value=wanted;return wanted};
}
const studyWrap=document.createElement('div');byId('study').insertBefore(studyWrap,byId('study').querySelector('.study-top'));
const studyControl=control(studyWrap,'Çalışılacak kelime grubu',true,v=>{selectedStudy=v;index=0;showCard()});
const quizControl=control(byId('quizStart'),'Quiz yapılacak kelime grubu',false,v=>{selectedQuiz=v;updateRequirement()});
const listControl=control(byId('list').querySelector('.panel'),'Kartları göster',true,v=>{selectedList=v;renderList()});
function refresh(){selectedStudy=studyControl(selectedStudy);selectedQuiz=quizControl(selectedQuiz);selectedList=listControl(selectedList)}
function safe(s){return esc(s??'')}
// Orijinal islevleri, secilen grubu esas alacak sekilde degistir.
showCard=function(){const pool=groupCards(selectedStudy);if(!pool.length){byId('verb').textContent='Bu grupta kart yok';byId('answer').innerHTML='';byId('progress').textContent='Kart 0 / 0';byId('unknownCount').textContent='Bilmediğim: 0';['previous','markUnknown','markKnown'].forEach(id=>byId(id).disabled=true);return}
 ['previous','markUnknown','markKnown'].forEach(id=>byId(id).disabled=false);index=(index+pool.length)%pool.length;const c=pool[index],isKnown=c.status==='known';byId('verb').textContent=c.verb;byId('answer').innerHTML=`<span>${safe(c.meaning)}</span><span class="example">${safe(c.example)}</span><span class="translation">${safe(c.translation)}</span><span class="badge ${isKnown?'known':'unknown'}">${isKnown?'Biliyorum':'Bilmiyorum'}</span>`;byId('verb').classList.remove('hidden');byId('answer').classList.add('hidden');byId('progress').textContent=`Kart ${index+1} / ${pool.length}`;byId('unknownCount').textContent=`Bilmediğim: ${pool.filter(x=>x.status==='unknown').length}`;
};
byId('previous').onclick=()=>{const n=groupCards(selectedStudy).length;if(n){index=(index-1+n)%n;showCard()}};
mark=function(status){let pool=groupCards(selectedStudy);if(!pool.length)return;pool[index].status=status;save();index=(index+1)%pool.length;showCard();updateRequirement()};
byId('markUnknown').onclick=()=>mark('unknown');byId('markKnown').onclick=()=>mark('known');
renderList=function(){const arr=groupCards(selectedList).filter(c=>filter==='all'||c.status===filter);byId('total').textContent=`${cards.length} kart`;byId('summary').textContent=`${unknown().length} bilmediğim • ${known().length} bildiğim`;byId('cardList').innerHTML=arr.length?'':'<p class="empty">Bu grupta kart yok.</p>';
 arr.forEach(c=>{let real=cards.indexOf(c),isKnown=c.status==='known',el=document.createElement('article');el.className='item';el.innerHTML=`<div class="list-top"><h3>${safe(c.verb)}</h3><span class="badge ${isKnown?'known':'unknown'}">${isKnown?'Biliyorum':'Bilmiyorum'}</span></div><p>${safe(c.meaning)}</p><p class="example">${safe(c.example)}</p><p class="note">${safe(c.group||'')} • ${safe(c.quizGroup||'Grupsuz')}</p><div class="actions"><button class="action unknown" data-a="unknown" data-i="${real}">Bilmiyorum</button><button class="action known" data-a="known" data-i="${real}">Biliyorum</button><button class="action secondary" data-a="delete" data-i="${real}">Sil</button></div>`;byId('cardList').appendChild(el)});
 document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.i);if(b.dataset.a==='delete'){if(confirm(`"${cards[i].verb}" silinsin mi?`))cards.splice(i,1)}else cards[i].status=b.dataset.a;save();refresh();renderList();showCard();updateRequirement()});
};
updateRequirement=function(){refresh();const pool=groupCards(selectedQuiz),n=pool.length;byId('requirement').textContent=n>=4?`${n} kelimelik gruptan ${Math.min(30,n)} soru sorulacak. Bildiğin kelimeler de dahil.`:`Bu grupta ${n} kelime var. Dört seçenekli quiz için en az 4 kelime gerekli.`;byId('requirement').className=n>=4?'success':'error';byId('startQuiz').disabled=n<4;byId('refreshQuiz').disabled=n<4};
begin=function(){const pool=groupCards(selectedQuiz);if(pool.length<4){resetQuiz();return}const chosen=shuffle(pool).slice(0,30);quiz=chosen.map((c,i)=>{let askMeaning=i%2===0,correct=askMeaning?c.meaning:c.verb,others=[...new Set(pool.filter(x=>x!==c).map(x=>askMeaning?x.meaning:x.verb))].filter(x=>x!==correct);let wrong=shuffle(others).slice(0,3);return{direction:askMeaning?'Bu kelimenin Türkçe anlamı nedir?':'Bu anlam hangi kelimeye aittir?',question:askMeaning?c.verb:c.meaning,correct,options:shuffle([correct,...wrong]),example:c.example}});qIndex=0;score=0;answered=false;byId('quizStart').classList.add('hidden');byId('quizResult').classList.add('hidden');byId('quizGame').classList.remove('hidden');showQuestion()};
showQuestion=function(){answered=false;let q=quiz[qIndex];byId('quizProgress').textContent=`Soru ${qIndex+1} / ${quiz.length}`;byId('quizScore').textContent=`Puan: ${score}`;byId('direction').textContent=q.direction;byId('question').textContent=q.question;byId('feedback').textContent='';byId('next').classList.add('hidden');byId('options').innerHTML='';q.options.forEach(o=>{let b=document.createElement('button');b.className='option';b.textContent=o;b.onclick=()=>answer(o,b);byId('options').appendChild(b)})};
byId('next').onclick=()=>{qIndex++;if(qIndex>=quiz.length){byId('quizGame').classList.add('hidden');byId('quizResult').classList.remove('hidden');byId('finalScore').textContent=`${score} / ${quiz.length}`;byId('resultText').textContent=score/quiz.length>=.8?'Çok iyi!':score/quiz.length>=.6?'İyi gidiyorsun.':'Kartları biraz daha tekrar et.'}else showQuestion()};
// Import: orijinal fonksiyonun atladigi category,group,quizGroup alanlarini koru.
byId('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text()),data=Array.isArray(parsed)?parsed:parsed.cards;if(!Array.isArray(data))throw Error('JSON');const cleaned=data.filter(c=>c&&typeof c.verb==='string'&&typeof c.meaning==='string').map(c=>({verb:String(c.verb).trim(),meaning:String(c.meaning).trim(),example:String(c.example||'').trim(),translation:String(c.translation||'').trim(),status:c.status==='known'?'known':'unknown',category:String(c.category||'Other'),group:String(c.group||''),quizGroup:String(c.quizGroup||'UNGROUPED'),quizOrder:Number(c.quizOrder)||0})).filter(c=>c.verb&&c.meaning);if(!cleaned.length)throw Error('Empty');const replace=confirm(`${cleaned.length} kart bulundu.\n\nTamam: mevcut kartların üzerine yaz.\nİptal: mevcut kartlarla birleştir.`);if(replace){cards=cleaned}else{const id=c=>norm(c.verb)+'|'+norm(c.meaning);const statusMap=new Map(cards.map(c=>[id(c),c.status]));const mp=new Map(cards.map(c=>[id(c),c]));cleaned.forEach(c=>{c.status=statusMap.get(id(c))||c.status;mp.set(id(c),c)});cards=[...mp.values()]}
 save();index=0;refresh();showCard();renderList();updateRequirement();msg(`${cleaned.length} kart başarıyla içe aktarıldı.`,true,'transferMessage')}catch(err){msg('Dosya okunamadı. Geçerli bir JSON dosyası seç.',false,'transferMessage')}finally{e.target.value=''}};
// Yeni kartlar da "Grupsuz" olarak gozuksun.
const oldSubmit=byId('form').onsubmit;
byId('form').onsubmit=e=>{const before=cards.length;oldSubmit(e);if(cards.length>before){let c=cards[cards.length-1];c.category='Other';c.quizGroup='UNGROUPED';c.group='Yeni eklenenler';save();refresh()}};
// Navigasyonun eski onclick kodu grup gorunumunu da guncellesin.
document.querySelectorAll('.nav button').forEach(b=>{const old=b.onclick;b.onclick=e=>{old(e);refresh();if(b.dataset.page==='study')showCard();if(b.dataset.page==='quiz')updateRequirement();if(b.dataset.page==='list')renderList()}});
refresh();showCard();updateRequirement();
})();
