(() => {
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money40 = v => Number(v || 0).toLocaleString('fr-CA',{style:'currency',currency:'CAD'});
  let selected = null;
  function db(){ return window.sb || window.supabaseClient || null; }
  function allVehicles(){
    if(typeof window.getSharboVehicles==='function'){
      const list=window.getSharboVehicles();
      return Array.isArray(list)?list:[];
    }
    return Array.isArray(window.vehicles)?window.vehicles:[];
  }
  function vehicleUrl(v){ return `${location.origin.replace(/\/admin-v2\/?$/,'')}/vehicle.html?id=${encodeURIComponent(v.id)}`; }

  function fillVehicles(){
    const sel=$('opsVehicleSelect'); if(!sel)return;
    const current=sel.value;
    sel.innerHTML='<option value="">Choisir un véhicule…</option>'+allVehicles().map(v=>`<option value="${v.id}">${esc(v.year)} ${esc(v.make)} ${esc(v.model)} · ${esc(v.stock_number||v.vin||'')}</option>`).join('');
    if(current) sel.value=current;
  }
  function selectVehicle(){
    selected=allVehicles().find(v=>String(v.id)===String($('opsVehicleSelect').value))||null;
    if(!selected){$('opsVehicleSummary').innerHTML='';$('costAnalyzer').innerHTML='Choisissez un véhicule.';return;}
    $('opsVehicleSummary').innerHTML=`<strong>${esc(selected.title||`${selected.year} ${selected.make} ${selected.model}`)}</strong><br>${money40(selected.price)} · ${Number(selected.mileage||0).toLocaleString('fr-CA')} km<br><span class="pill40">${selected.published===false?'Masqué':'Publié'}</span>`;
    $('togglePublishBtn').textContent=selected.published===false?'Publier sur le site':'Masquer du site';
    renderCost(); loadPriceHistory();
  }
  async function togglePublish(){
    if(!selected)return alert('Choisissez un véhicule.');
    const next=selected.published===false;
    const {error}=await db().from('vehicles').update({published:next,updated_at:new Date().toISOString()}).eq('id',selected.id);
    $('publishMsg').textContent=error?'Erreur: '+error.message:(next?'Véhicule publié.':'Véhicule masqué du site.');
    if(!error){selected.published=next;selectVehicle();}
  }
  function renderCost(){
    if(!selected)return;
    const costs=Number(selected.cost||0), sale=Number(selected.price||0), profit=sale-costs, margin=sale?profit/sale*100:0;
    const grade=margin>=20?'Excellent':margin>=10?'Moyen':'Faible';
    $('costAnalyzer').innerHTML=`<div class="cost-kpis"><div><span>Coût inscrit</span><strong>${money40(costs)}</strong></div><div><span>Prix affiché</span><strong>${money40(sale)}</strong></div><div><span>Profit estimé</span><strong>${money40(profit)}</strong></div><div><span>Marge</span><strong>${margin.toFixed(1)} %</strong></div></div><p class="profit-grade grade-${grade.toLowerCase()}">${grade}</p>`;
  }
  async function loadPriceHistory(){
    if(!selected)return;
    const {data,error}=await db().from('vehicle_price_history').select('*').eq('vehicle_id',selected.id).order('changed_at',{ascending:false}).limit(20);
    $('priceHistoryList').innerHTML=error?'':`<h3>Historique de prix</h3>${(data||[]).length?`<table><thead><tr><th>Date</th><th>Ancien</th><th>Nouveau</th><th>Variation</th></tr></thead><tbody>${data.map(x=>`<tr><td>${new Date(x.changed_at).toLocaleString('fr-CA')}</td><td>${money40(x.old_price)}</td><td>${money40(x.new_price)}</td><td>${money40(Number(x.new_price)-Number(x.old_price))}</td></tr>`).join('')}</tbody></table>`:'<p>Aucun changement de prix.</p>'}`;
  }
  function qrDataUrl(text){ const box=document.createElement('div'); new QRCode(box,{text,width:360,height:360,correctLevel:QRCode.CorrectLevel.H}); return box.querySelector('canvas')?.toDataURL('image/png')||box.querySelector('img')?.src||''; }
  function printDoc(type){
    if(!selected)return alert('Choisissez un véhicule.');
    const title=esc(selected.title||`${selected.year} ${selected.make} ${selected.model}`), url=vehicleUrl(selected), qr=qrDataUrl(url), img=(selected.images&&selected.images[0])||'../assets/images/logo.png';
    let body='';
    if(type==='sold'||type==='new') body=`<div class="sticker ${type}">${type==='sold'?'VENDU':'NOUVEL<br>ARRIVAGE'}</div>`;
    else if(type==='qr') body=`<div class="center"><img class="logo" src="../assets/images/logo.png"><h1>${title}</h1><img class="qr" src="${qr}"><p>Scannez pour voir les photos et détails</p></div>`;
    else body=`<div class="sheet"><img class="logo" src="../assets/images/logo.png"><h1>${title}</h1>${type==='a4'?`<img class="carpic" src="${esc(img)}">`:''}<div class="bigprice">${money40(selected.price)}</div><div class="spec">${Number(selected.mileage||0).toLocaleString('fr-CA')} km · ${esc(selected.transmission||'')} · ${esc(selected.fuel||'')}</div><p>Stock: ${esc(selected.stock_number||'—')} · VIN: ${esc(selected.vin||'—')}</p><img class="qr small" src="${qr}"><p>438-927-7272 · sharboauto.com</p></div>`;
    const w=open('','_blank'); w.document.write(`<!doctype html><html><head><title>Impression Sharbo Auto</title><style>@page{size:auto;margin:10mm}body{font-family:Arial;margin:0;color:#111}.center,.sheet{text-align:center;padding:25px}.logo{max-width:260px;max-height:90px}.carpic{width:100%;max-height:430px;object-fit:cover;border-radius:14px}.bigprice{font-size:64px;font-weight:900;margin:20px}.spec{font-size:24px}.qr{width:360px}.qr.small{width:150px}.sticker{height:90vh;display:flex;align-items:center;justify-content:center;text-align:center;font-size:150px;font-weight:1000;border:18px solid #d71920}.sticker.sold{color:#d71920}.sticker.new{background:#d71920;color:white}</style></head><body>${body}<script>onload=()=>setTimeout(()=>print(),300)<\/script></body></html>`);w.document.close();
  }
  function csvEscape(v){ const s=String(v??''); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
  function exportCsv(){
    const cols=['title','stock_number','vin','make','model','trim','year','mileage','price','cost','transmission','fuel','color','engine','status','carfax','description_fr','description_en','featured','published'];
    const csv=[cols.join(','),...allVehicles().map(v=>cols.map(c=>csvEscape(v[c])).join(','))].join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download=`inventaire-sharbo-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href);
  }
  function parseCsv(text){
    const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'&&q&&n==='"'){cell+='"';i++;}else if(c==='"')q=!q;else if(c===','&&!q){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
  }
  async function importCsv(file){
    const rows=parseCsv(await file.text()); if(rows.length<2)return;
    const heads=rows.shift().map(x=>x.trim());let ok=0,fail=0;
    for(const r of rows){const o={};heads.forEach((h,i)=>o[h]=r[i]??'');['year','mileage','price','cost'].forEach(k=>{if(o[k]!=='')o[k]=Number(o[k])});['featured','published'].forEach(k=>{if(k in o)o[k]=!['false','0','non','no'].includes(String(o[k]).toLowerCase())});o.vin=(o.vin||'').trim()||null;o.status=o.status||'Disponible';
      const {error}=await db().from('vehicles').upsert(o,{onConflict:o.vin?'vin':'id'});error?fail++:ok++;
    }
    $('importExportMsg').textContent=`${ok} importés / mis à jour, ${fail} erreurs.`; if(window.loadVehicles)await window.loadVehicles();fillVehicles();
  }
  function fallbackGenerate(v,type){
    const name=`${v.year||''} ${v.make||''} ${v.model||''} ${v.trim||''}`.replace(/\s+/g,' ').trim();const specs=`${Number(v.mileage||0).toLocaleString('fr-CA')} km, ${v.transmission||'transmission à confirmer'}, ${v.fuel||'carburant à confirmer'}`;
    const fr=`Découvrez ce ${name} offert chez Sharbo Auto. ${specs}. Véhicule inspecté, présentation soignée et financement disponible selon approbation. Contactez-nous au 438-927-7272 pour planifier une visite ou un essai routier.`;
    const en=`Discover this ${name} available at Sharbo Auto. ${specs}. Clean presentation, inspection information available, and financing available upon approval. Call 438-927-7272 to schedule a visit or test drive.`;
    if(type==='descriptions')return `FR:\n${fr}\n\nEN:\n${en}`;
    if(type==='marketplace')return `${name}\n${money40(v.price)} · ${specs}\n\n${fr}\n\n📍 2260 Boulevard des Laurentides, Laval\n📞 438-927-7272`;
    if(type==='autotrader')return `${name}\n\n${fr}\n\nVIN: ${v.vin||'sur demande'} | Stock: ${v.stock_number||'sur demande'}`;
    if(type==='instagram')return `🚗 ${name}\n💰 ${money40(v.price)}\n🛣 ${specs}\n\nDisponible maintenant chez Sharbo Auto. Écrivez-nous pour les détails ou un essai routier.\n\n#SharboAuto #AutoUsagée #Laval #VoitureÀVendre`;
    if(type==='reply')return `Bonjour! Oui, le ${name} est actuellement ${v.status==='Disponible'?'disponible':'à confirmer'}. Son prix est de ${money40(v.price)}. Souhaitez-vous planifier un essai routier? Vous pouvez aussi nous joindre au 438-927-7272.`;
    const missing=['vin','stock_number','price','mileage','transmission','fuel','carfax','description_fr','description_en'].filter(k=>!v[k]);return missing.length?`Informations à compléter avant publication:\n- ${missing.join('\n- ')}`:'Le dossier du véhicule contient les principales informations nécessaires à la publication.';
  }
  async function generate(){
    if(!selected)return alert('Choisissez un véhicule.');const type=$('aiOutputType').value;$('aiMsg').textContent='Génération…';
    try{const r=await fetch('/.netlify/functions/ai-sales',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vehicle:selected,type})});if(r.ok){const j=await r.json();$('aiResult').value=j.text||fallbackGenerate(selected,type);$('aiMsg').textContent='Généré avec l’assistant IA.';}else throw new Error();}
    catch(e){$('aiResult').value=fallbackGenerate(selected,type);$('aiMsg').textContent='Mode local utilisé. Ajoutez OPENAI_API_KEY dans Netlify pour la génération IA avancée.';}
  }
  async function applyDescriptions(){
    if(!selected)return;const text=$('aiResult').value;const m=text.match(/FR:\s*([\s\S]*?)\n\s*EN:\s*([\s\S]*)/i);if(!m)return alert('Générez d’abord les descriptions FR + EN.');
    const {error}=await db().from('vehicles').update({description_fr:m[1].trim(),description_en:m[2].trim(),updated_at:new Date().toISOString()}).eq('id',selected.id);$('aiMsg').textContent=error?'Erreur: '+error.message:'Descriptions enregistrées sur le véhicule.';
  }
  function init(){
    if(!$('opsVehicleSelect'))return;fillVehicles();$('opsVehicleSelect').addEventListener('change',selectVehicle);$('togglePublishBtn').addEventListener('click',togglePublish);document.querySelectorAll('[data-print]').forEach(b=>b.addEventListener('click',()=>printDoc(b.dataset.print)));$('exportVehiclesCsv').addEventListener('click',exportCsv);$('importVehiclesCsv').addEventListener('change',e=>e.target.files[0]&&importCsv(e.target.files[0]));$('generateAiBtn').addEventListener('click',generate);$('copyAiBtn').addEventListener('click',()=>navigator.clipboard.writeText($('aiResult').value));$('applyDescriptionsBtn').addEventListener('click',applyDescriptions);
    document.querySelectorAll('.nav-link').forEach(b=>b.addEventListener('click',()=>setTimeout(fillVehicles,100)));
    window.addEventListener('sharbo:vehicles-loaded',fillVehicles);
    setTimeout(fillVehicles,300);
    setInterval(fillVehicles,5000);
  }
  document.addEventListener('DOMContentLoaded',init);
})();
